'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/ui/Icon';
import type { WorkflowWithSteps, ApprovalStepRecord } from '@/server/workflows';
import styles from './page.module.css';

export default function WorkflowsManagerPage() {
  const [workflows, setWorkflows] = useState<WorkflowWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workflows');
      if (!res.ok) throw new Error('Failed to load workflows');
      const data: WorkflowWithSteps[] = await res.json();
      setWorkflows(data);
    } catch {
      setStatusMsg({ type: 'error', text: 'Error loading approval workflows.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleStepChange = (
    wfId: number,
    stepIndex: number,
    field: keyof ApprovalStepRecord,
    val: unknown
  ) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== wfId) return w;
        const newSteps = [...w.steps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          [field]: val,
        };
        return { ...w, steps: newSteps };
      })
    );
  };

  const handleAddStep = (wfId: number) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== wfId) return w;
        const nextStepNo = w.steps.length + 1;
        const newStep: ApprovalStepRecord = {
          step_no: nextStepNo,
          approver_kind: 'role',
          approver_value: 'principal',
          escalate_after_hours: 48,
          can_skip_if_unavailable: 1,
        };
        return { ...w, steps: [...w.steps, newStep] };
      })
    );
  };

  const handleRemoveStep = (wfId: number, stepIndex: number) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== wfId) return w;
        if (w.steps.length <= 1) {
          alert('Workflows must have at least one step.');
          return w;
        }
        const filtered = w.steps.filter((_, idx) => idx !== stepIndex);
        const renumbered = filtered.map((s, idx) => ({ ...s, step_no: idx + 1 }));
        return { ...w, steps: renumbered };
      })
    );
  };

  const handleMoveStep = (wfId: number, stepIndex: number, direction: 'up' | 'down') => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== wfId) return w;
        const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
        if (targetIndex < 0 || targetIndex >= w.steps.length) return w;

        const newSteps = [...w.steps];
        const temp = newSteps[stepIndex];
        newSteps[stepIndex] = newSteps[targetIndex];
        newSteps[targetIndex] = temp;

        const renumbered = newSteps.map((s, idx) => ({ ...s, step_no: idx + 1 }));
        return { ...w, steps: renumbered };
      })
    );
  };

  const handleSaveWorkflow = async (wf: WorkflowWithSteps) => {
    setSavingId(wf.id);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/workflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: wf.id,
          active: wf.active,
          steps: wf.steps,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to save workflow');
      }

      setStatusMsg({
        type: 'success',
        text: `Saved workflow "${wf.applies_to}" (Version v${wf.version + 1}) successfully!`,
      });
      fetchWorkflows();
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Approval Workflow Chains"
        description="Configure multi-step approval hierarchies for leave requests and fee concessions. Admin decides which role or class teacher approves first, escalation hours, and skip rules."
        actions={
          <Link href="/app/settings" className="button secondary" style={{ textDecoration: 'none' }}>
            ← Settings Center
          </Link>
        }
      />

      {statusMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            background: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {workflows.map((wf) => {
        const title =
          wf.applies_to === 'student_leave'
            ? 'Student & Child Absence Workflow'
            : wf.applies_to === 'staff_leave'
            ? 'Teacher & Staff Leave Workflow'
            : 'Fee Concession / Waiver Approval';

        return (
          <div key={wf.id} className={styles.workflowCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem' }}>{title}</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Target: <code>{wf.applies_to}</code> | Applicant Role: <code>{wf.applicant_role}</code> | Current Version: <strong>v{wf.version}</strong>
                </div>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: wf.active ? '#dcfce7' : '#f1f5f9',
                  color: wf.active ? '#15803d' : '#64748b',
                }}
              >
                {wf.active ? 'Active Engine' : 'Disabled'}
              </span>
            </div>

            <div className={styles.stepsList}>
              {wf.steps.map((step, idx) => (
                <div key={idx} className={styles.stepItem}>
                  <div className={styles.stepNumber}>{idx + 1}</div>

                  <div className={styles.stepFields}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Approver Type</span>
                      <select
                        className={styles.select}
                        value={step.approver_kind}
                        onChange={(e) =>
                          handleStepChange(wf.id, idx, 'approver_kind', e.target.value)
                        }
                      >
                        <option value="class_teacher">Designated Class Teacher</option>
                        <option value="role">Specific Role (e.g. Principal)</option>
                        <option value="user">Specific User ID</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Approver Target</span>
                      {step.approver_kind === 'class_teacher' ? (
                        <input
                          className={styles.input}
                          disabled
                          value="Auto (Class Teacher)"
                        />
                      ) : (
                        <input
                          className={styles.input}
                          value={step.approver_value}
                          onChange={(e) =>
                            handleStepChange(wf.id, idx, 'approver_value', e.target.value)
                          }
                          placeholder={step.approver_kind === 'role' ? 'principal' : 'User ID'}
                        />
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Escalate After</span>
                      <select
                        className={styles.select}
                        value={step.escalate_after_hours}
                        onChange={(e) =>
                          handleStepChange(wf.id, idx, 'escalate_after_hours', Number(e.target.value))
                        }
                      >
                        <option value={12}>12 Hours</option>
                        <option value={24}>24 Hours</option>
                        <option value={48}>48 Hours (2 Days)</option>
                        <option value={72}>72 Hours (3 Days)</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Skip If Off/Away</span>
                      <select
                        className={styles.select}
                        value={step.can_skip_if_unavailable}
                        onChange={(e) =>
                          handleStepChange(wf.id, idx, 'can_skip_if_unavailable', Number(e.target.value))
                        }
                      >
                        <option value={1}>Yes, auto-skip</option>
                        <option value={0}>No, hold in queue</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(wf.id, idx, 'up')}
                      title="Move Step Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      disabled={idx === wf.steps.length - 1}
                      onClick={() => handleMoveStep(wf.id, idx, 'down')}
                      title="Move Step Down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      style={{ color: '#ef4444' }}
                      onClick={() => handleRemoveStep(wf.id, idx)}
                      title="Remove Step"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.simulatorBox}>
              <strong>Workflow Simulation:</strong>
              <div>
                When an application is submitted by a <strong>{wf.applicant_role}</strong>, it is routed to{' '}
                {wf.steps.map((s, i) => (
                  <span key={i}>
                    {i > 0 && ' → then '}
                    <strong>
                      Step {i + 1}: {s.approver_kind === 'class_teacher' ? 'Class Teacher' : s.approver_value}
                    </strong>{' '}
                    (within {s.escalate_after_hours}h)
                  </span>
                ))}
                .
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="secondary" onClick={() => handleAddStep(wf.id)}>
                + Add Next Approval Step
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveWorkflow(wf)}
                disabled={savingId === wf.id}
              >
                {savingId === wf.id ? <Spinner size="sm" /> : 'Save Workflow Version'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
