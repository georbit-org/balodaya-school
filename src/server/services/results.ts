export interface GradeScaleRow {
  min_percent: number;
  grade: string;
  gpa: number;
}

export interface SubjectRule {
  id: number;
  name: string;
  code: string;
  full_marks: number;
  pass_marks: number;
}

export interface StudentMarkEntry {
  subject_id: number;
  marks: number | null; // null = absent / not entered
}

export interface ComputedSubjectResult {
  subject_id: number;
  subject_name: string;
  full_marks: number;
  pass_marks: number;
  obtained: number | null;
  percentage: number;
  grade: string;
  gpa: number;
  passed: boolean;
}

export interface StudentResultSummary {
  student_id: number;
  enrollment_id: number;
  admission_no: string;
  student_name: string;
  roll_no: number | null;
  subjects: ComputedSubjectResult[];
  total_obtained: number;
  total_full_marks: number;
  percentage: number;
  result: 'Pass' | 'Fail';
  gpa: number;
  rank: number | null;
}

export function computeSubjectGrade(
  obtained: number | null,
  fullMarks: number,
  gradeScale: GradeScaleRow[]
): { grade: string; gpa: number; percentage: number } {
  if (obtained === null || fullMarks <= 0) {
    return { grade: 'NG', gpa: 0.0, percentage: 0 };
  }
  const pct = (obtained / fullMarks) * 100;
  // grade scale sorted descending by min_percent
  const sorted = [...gradeScale].sort((a, b) => b.min_percent - a.min_percent);
  for (const band of sorted) {
    if (pct >= band.min_percent) {
      return { grade: band.grade, gpa: band.gpa, percentage: Math.round(pct * 100) / 100 };
    }
  }
  return { grade: 'NG', gpa: 0.0, percentage: Math.round(pct * 100) / 100 };
}

export function computeStudentResults(
  students: Array<{
    student_id: number;
    enrollment_id: number;
    admission_no: string;
    student_name: string;
    roll_no: number | null;
    marks: StudentMarkEntry[];
  }>,
  subjects: SubjectRule[],
  gradeScale: GradeScaleRow[]
): StudentResultSummary[] {
  const summaries: StudentResultSummary[] = students.map((s) => {
    let totalObtained = 0;
    let totalFullMarks = 0;
    let anyFail = false;
    let sumGpa = 0;

    const computedSubjects: ComputedSubjectResult[] = subjects.map((subj) => {
      totalFullMarks += subj.full_marks;
      const found = s.marks.find((m) => m.subject_id === subj.id);
      const obtained = found?.marks ?? null;

      if (obtained !== null) {
        totalObtained += obtained;
      }

      const isPass = obtained !== null && obtained >= subj.pass_marks;
      if (!isPass) {
        anyFail = true;
      }

      const { grade, gpa, percentage } = computeSubjectGrade(obtained, subj.full_marks, gradeScale);
      sumGpa += gpa;

      return {
        subject_id: subj.id,
        subject_name: subj.name,
        full_marks: subj.full_marks,
        pass_marks: subj.pass_marks,
        obtained,
        percentage,
        grade,
        gpa,
        passed: isPass,
      };
    });

    const percentage = totalFullMarks > 0 ? Math.round((totalObtained / totalFullMarks) * 10000) / 100 : 0;
    const isOverallPass = !anyFail && subjects.length > 0;
    const avgGpa = subjects.length > 0 && isOverallPass ? Math.round((sumGpa / subjects.length) * 100) / 100 : 0.0;

    return {
      student_id: s.student_id,
      enrollment_id: s.enrollment_id,
      admission_no: s.admission_no,
      student_name: s.student_name,
      roll_no: s.roll_no,
      subjects: computedSubjects,
      total_obtained: totalObtained,
      total_full_marks: totalFullMarks,
      percentage,
      result: isOverallPass ? 'Pass' : 'Fail',
      gpa: avgGpa,
      rank: null,
    };
  });

  // Calculate Dense Ranking for Pass students:
  // Sort Pass students by total_obtained descending
  const passStudents = summaries
    .filter((s) => s.result === 'Pass')
    .sort((a, b) => b.total_obtained - a.total_obtained);

  let currentRank = 1;
  for (let i = 0; i < passStudents.length; i++) {
    if (i > 0 && passStudents[i].total_obtained < passStudents[i - 1].total_obtained) {
      currentRank++;
    }
    passStudents[i].rank = currentRank;
  }

  return summaries;
}
