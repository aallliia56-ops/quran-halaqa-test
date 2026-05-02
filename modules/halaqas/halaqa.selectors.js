import {
  DEFAULT_HALAQA,
  getHalaqaDisplayLabel,
  normalizeHalaqaCode,
} from "../../app/halaqa-utils.js";

function normalizeStudentsByHalaqa(students = []) {
  const studentsByHalaqa = {};

  students.forEach((student) => {
    const halaqa = student?.halaqa || DEFAULT_HALAQA;
    if (!studentsByHalaqa[halaqa]) {
      studentsByHalaqa[halaqa] = [];
    }

    studentsByHalaqa[halaqa].push(student);
  });

  return studentsByHalaqa;
}

function normalizeHalaqaRecords(halaqas = []) {
  return halaqas
    .map((halaqa) => {
      const code = normalizeHalaqaCode(halaqa?.code || halaqa?.id || halaqa?.halaqa);
      if (!code) return null;

      return {
        id: halaqa?.id || code,
        code,
        label: String(halaqa?.label || halaqa?.name || getHalaqaDisplayLabel(code)).trim(),
        studentCount: 0,
        activeStudentsCount: 0,
        totalPoints: 0,
      };
    })
    .filter(Boolean);
}

function buildHalaqaSummaries(students = [], halaqas = []) {
  const summaryMap = new Map();

  normalizeHalaqaRecords(halaqas).forEach((halaqa) => {
    summaryMap.set(halaqa.code, {
      ...halaqa,
      halaqa: halaqa.label,
    });
  });

  Object.entries(normalizeStudentsByHalaqa(students)).forEach(([halaqaCode, halaqaStudents]) => {
    const code = normalizeHalaqaCode(halaqaCode || DEFAULT_HALAQA);
    const existing = summaryMap.get(code) || {
      id: code,
      code,
      label: getHalaqaDisplayLabel(code),
      halaqa: getHalaqaDisplayLabel(code),
      studentCount: 0,
      activeStudentsCount: 0,
      totalPoints: 0,
    };

    summaryMap.set(code, {
      ...existing,
      halaqa: existing.label || existing.halaqa || getHalaqaDisplayLabel(code),
      studentCount: halaqaStudents.length,
      activeStudentsCount: halaqaStudents.filter((student) => !student.is_archived).length,
      totalPoints: halaqaStudents.reduce((sum, student) => sum + (student.total_points || 0), 0),
    });
  });

  return [...summaryMap.values()].sort((a, b) => a.halaqa.localeCompare(b.halaqa));
}

function getKnownHalaqas(students = [], halaqas = []) {
  return buildHalaqaSummaries(students, halaqas).map((summary) => summary.code);
}

export {
  normalizeStudentsByHalaqa,
  buildHalaqaSummaries,
  getKnownHalaqas,
};
