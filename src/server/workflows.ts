import type { InArgs } from '@libsql/client';
import { query, one, run, batch } from '@/server/db';
import { audit } from '@/server/audit';
import { HttpError } from '@/server/http';

export interface ApprovalStepRecord {
  id?: number;
  workflow_id?: number;
  step_no: number;
  approver_kind: 'class_teacher' | 'role' | 'user';
  approver_value: string;
  escalate_after_hours: number;
  can_skip_if_unavailable: number;
}

export interface WorkflowWithSteps {
  id: number;
  applies_to: string;
  applicant_role: string;
  active: number;
  version: number;
  steps: ApprovalStepRecord[];
}

export async function ensureDefaultWorkflows(): Promise<void> {
  const existing = await one<{ count: number }>('SELECT count(*) as count FROM approval_workflows');
  if (existing && existing.count > 0) return;

  // 1. Student leave
  const wf1 = await run(
    `INSERT INTO approval_workflows (applies_to, applicant_role, active, version)
     VALUES ('student_leave', 'student', 1, 1)`
  );
  const wf1Id = wf1.lastInsertRowid;
  await run(
    `INSERT INTO approval_steps (workflow_id, step_no, approver_kind, approver_value, escalate_after_hours, can_skip_if_unavailable)
     VALUES (?, 1, 'class_teacher', 'class_teacher', 24, 1),
            (?, 2, 'role', 'principal', 48, 0)`,
    [wf1Id, wf1Id]
  );

  // 2. Staff leave
  const wf2 = await run(
    `INSERT INTO approval_workflows (applies_to, applicant_role, active, version)
     VALUES ('staff_leave', 'teacher', 1, 1)`
  );
  const wf2Id = wf2.lastInsertRowid;
  await run(
    `INSERT INTO approval_steps (workflow_id, step_no, approver_kind, approver_value, escalate_after_hours, can_skip_if_unavailable)
     VALUES (?, 1, 'role', 'principal', 48, 0)`,
    [wf2Id]
  );

  // 3. Fee waiver
  const wf3 = await run(
    `INSERT INTO approval_workflows (applies_to, applicant_role, active, version)
     VALUES ('fee_waiver', 'accountant', 1, 1)`
  );
  const wf3Id = wf3.lastInsertRowid;
  await run(
    `INSERT INTO approval_steps (workflow_id, step_no, approver_kind, approver_value, escalate_after_hours, can_skip_if_unavailable)
     VALUES (?, 1, 'role', 'principal', 24, 0)`,
    [wf3Id]
  );
}

export async function listWorkflows(): Promise<WorkflowWithSteps[]> {
  await ensureDefaultWorkflows();
  const workflows = await query<{
    id: number;
    applies_to: string;
    applicant_role: string;
    active: number;
    version: number;
  }>('SELECT * FROM approval_workflows ORDER BY applies_to, applicant_role');

  const allSteps = await query<ApprovalStepRecord & { workflow_id: number }>(
    'SELECT * FROM approval_steps ORDER BY workflow_id, step_no ASC'
  );

  return workflows.map((wf) => ({
    ...wf,
    steps: allSteps.filter((s) => s.workflow_id === wf.id),
  }));
}

export async function saveWorkflow(
  workflowId: number,
  data: {
    active?: number;
    steps: Array<{
      step_no: number;
      approver_kind: 'class_teacher' | 'role' | 'user';
      approver_value: string;
      escalate_after_hours?: number;
      can_skip_if_unavailable?: number;
    }>;
  },
  userId: number
): Promise<WorkflowWithSteps> {
  const current = await one<{
    id: number;
    applies_to: string;
    applicant_role: string;
    version: number;
  }>('SELECT id, applies_to, applicant_role, version FROM approval_workflows WHERE id = ?', [workflowId]);

  if (!current) throw new HttpError(404, 'Workflow not found');

  if (!data.steps || data.steps.length === 0) {
    throw new HttpError(400, 'At least one approval step is required.');
  }

  const newVersion = current.version + 1;

  // Invalidate old steps and insert new steps in transaction
  const statements: Array<{ sql: string; args: InArgs }> = [
    {
      sql: `UPDATE approval_workflows SET active = ?, version = ? WHERE id = ?`,
      args: [data.active ?? 1, newVersion, workflowId],
    },
    {
      sql: `DELETE FROM approval_steps WHERE workflow_id = ?`,
      args: [workflowId],
    },
  ];

  data.steps.forEach((s, idx) => {
    statements.push({
      sql: `INSERT INTO approval_steps (workflow_id, step_no, approver_kind, approver_value, escalate_after_hours, can_skip_if_unavailable)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        workflowId,
        idx + 1,
        s.approver_kind,
        s.approver_value,
        s.escalate_after_hours ?? 48,
        s.can_skip_if_unavailable ?? 1,
      ],
    });
  });

  await batch(statements);

  await audit(userId, 'update_workflow', 'approval_workflows', workflowId, {
    applies_to: current.applies_to,
    applicant_role: current.applicant_role,
    version: newVersion,
    step_count: data.steps.length,
  });

  const all = await listWorkflows();
  const updated = all.find((w) => w.id === workflowId);
  if (!updated) throw new HttpError(500, 'Failed to fetch updated workflow');
  return updated;
}
