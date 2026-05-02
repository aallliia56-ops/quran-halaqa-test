import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const CONSISTENCY_STATUSES = new Set(["pending", "pending_assistant"]);
const SAMPLE_LIMIT = 5;

function pushSample(list, value) {
  if (list.length < SAMPLE_LIMIT) {
    list.push(value);
  }
}

function buildEmptyReport() {
  return {
    students: {
      total: 0,
      missingHalaqa: 0,
      invalidHalaqaReference: 0,
      sampleMissingHalaqaStudents: [],
      sampleInvalidHalaqaStudents: [],
    },
    halaqas: {
      total: 0,
      missingTeacherId: 0,
      invalidTeacherReference: 0,
      sampleMissingTeacherHalaqas: [],
      sampleInvalidTeacherHalaqas: [],
    },
    tasks: {
      totalSubmissions: 0,
      missingStudentCode: 0,
      missingHalaqaId: 0,
      missingType: 0,
      missingStatus: 0,
      sampleInvalidTaskSubmissions: [],
    },
    consistency: {
      checkedStatuses: [...CONSISTENCY_STATUSES],
      studentTasksMissingSubmission: 0,
      submissionsMissingStudentTask: 0,
      sampleMissingSubmissionTasks: [],
      sampleSubmissionsMissingStudentTask: [],
    },
    streak: {
      studentsWithDailyStreak: 0,
      objectMapCount: 0,
      arrayLegacyCount: 0,
      missingOrInvalidCount: 0,
      sampleLegacyArrayStudents: [],
      sampleInvalidStreakStudents: [],
    },
  };
}

async function getDataIntegrityReport(db) {
  const report = buildEmptyReport();

  const [studentsSnapshot, halaqasSnapshot, teachersSnapshot, taskSubmissionsSnapshot] = await Promise.all([
    getDocs(collection(db, "students")),
    getDocs(collection(db, "halaqas")),
    getDocs(collection(db, "teachers")),
    getDocs(collection(db, "task_submissions")),
  ]);

  const students = studentsSnapshot.docs.map((docSnapshot) => docSnapshot.data());
  const halaqas = halaqasSnapshot.docs.map((docSnapshot) => docSnapshot.data());
  const teachers = teachersSnapshot.docs.map((docSnapshot) => docSnapshot.data());
  const taskSubmissions = taskSubmissionsSnapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));

  const halaqaCodes = new Set(
    halaqas
      .map((halaqa) => String(halaqa?.code || "").trim())
      .filter(Boolean)
  );
  const teacherCodes = new Set(
    teachers
      .map((teacher) => String(teacher?.code || "").trim())
      .filter(Boolean)
  );
  const taskSubmissionIdsByStatus = new Set(
    taskSubmissions
      .filter((submission) => CONSISTENCY_STATUSES.has(String(submission?.status || "").trim()))
      .map((submission) => String(submission?.task_id || submission?.id || "").trim())
      .filter(Boolean)
  );

  report.students.total = students.length;
  students.forEach((student) => {
    const studentCode = String(student?.code || "").trim();
    const halaqaCode = String(student?.halaqa || "").trim();

    if (!halaqaCode) {
      report.students.missingHalaqa += 1;
      pushSample(report.students.sampleMissingHalaqaStudents, studentCode || "(unknown)");
    } else if (!halaqaCodes.has(halaqaCode)) {
      report.students.invalidHalaqaReference += 1;
      pushSample(report.students.sampleInvalidHalaqaStudents, {
        code: studentCode || "(unknown)",
        halaqa: halaqaCode,
      });
    }

    const dailyStreak = student?.program_participation?.daily_streak_1;
    if (dailyStreak && typeof dailyStreak === "object") {
      report.streak.studentsWithDailyStreak += 1;

      const completedDateKeys = dailyStreak.completed_date_keys;
      if (Array.isArray(completedDateKeys)) {
        report.streak.arrayLegacyCount += 1;
        pushSample(report.streak.sampleLegacyArrayStudents, studentCode || "(unknown)");
      } else if (completedDateKeys && typeof completedDateKeys === "object") {
        report.streak.objectMapCount += 1;
      } else {
        report.streak.missingOrInvalidCount += 1;
        pushSample(report.streak.sampleInvalidStreakStudents, studentCode || "(unknown)");
      }
    }

    const tasks = Array.isArray(student?.tasks) ? student.tasks : [];
    tasks.forEach((task) => {
      const taskId = String(task?.id || "").trim();
      const status = String(task?.status || "").trim();
      if (!taskId || !CONSISTENCY_STATUSES.has(status)) {
        return;
      }

      if (!taskSubmissionIdsByStatus.has(taskId)) {
        report.consistency.studentTasksMissingSubmission += 1;
        pushSample(report.consistency.sampleMissingSubmissionTasks, {
          student_code: studentCode || "(unknown)",
          task_id: taskId,
          status,
        });
      }
    });
  });

  report.halaqas.total = halaqas.length;
  halaqas.forEach((halaqa) => {
    const halaqaCode = String(halaqa?.code || halaqa?.id || "").trim();
    const teacherId = String(halaqa?.teacher_id || "").trim();

    if (!teacherId) {
      report.halaqas.missingTeacherId += 1;
      pushSample(report.halaqas.sampleMissingTeacherHalaqas, halaqaCode || "(unknown)");
    } else if (!teacherCodes.has(teacherId)) {
      report.halaqas.invalidTeacherReference += 1;
      pushSample(report.halaqas.sampleInvalidTeacherHalaqas, {
        halaqa: halaqaCode || "(unknown)",
        teacher_id: teacherId,
      });
    }
  });

  const studentTaskIdsByStatus = new Set();
  students.forEach((student) => {
    const tasks = Array.isArray(student?.tasks) ? student.tasks : [];
    tasks.forEach((task) => {
      const taskId = String(task?.id || "").trim();
      const status = String(task?.status || "").trim();
      if (taskId && CONSISTENCY_STATUSES.has(status)) {
        studentTaskIdsByStatus.add(taskId);
      }
    });
  });

  report.tasks.totalSubmissions = taskSubmissions.length;
  taskSubmissions.forEach((submission) => {
    const taskId = String(submission?.task_id || submission?.id || "").trim();
    const studentCode = String(submission?.student_code || "").trim();
    const halaqaId = String(submission?.halaqa_id || "").trim();
    const type = String(submission?.type || "").trim();
    const status = String(submission?.status || "").trim();

    let invalid = false;

    if (!studentCode) {
      report.tasks.missingStudentCode += 1;
      invalid = true;
    }
    if (!halaqaId) {
      report.tasks.missingHalaqaId += 1;
      invalid = true;
    }
    if (!type) {
      report.tasks.missingType += 1;
      invalid = true;
    }
    if (!status) {
      report.tasks.missingStatus += 1;
      invalid = true;
    }

    if (invalid) {
      pushSample(report.tasks.sampleInvalidTaskSubmissions, {
        task_id: taskId || "(unknown)",
        student_code: studentCode || null,
        halaqa_id: halaqaId || null,
        type: type || null,
        status: status || null,
      });
    }

    if (taskId && CONSISTENCY_STATUSES.has(status) && !studentTaskIdsByStatus.has(taskId)) {
      report.consistency.submissionsMissingStudentTask += 1;
      pushSample(report.consistency.sampleSubmissionsMissingStudentTask, {
        task_id: taskId,
        student_code: studentCode || null,
        status,
      });
    }
  });

  return report;
}

export { getDataIntegrityReport };
