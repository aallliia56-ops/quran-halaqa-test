import { CONFIG, DEFAULT_DIRECTOR_CODES } from "../../app/config.js";
import { getHalaqaDisplayLabel, normalizeHalaqaCode } from "../../app/halaqa-utils.js";
import { ROLE_PERMISSIONS, ROLES } from "../../app/permissions.js";
import { buildHalaqaSummaries } from "../halaqas/halaqa.selectors.js";
import { PROGRAM_STATUSES, PROGRAM_TYPES } from "../programs/program-engine.js";
import { selectActivePrograms } from "../programs/programs.selectors.js";
import { isStudentActive } from "../students/students.service.js";

function getTimestampMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") {
    const nanoseconds = typeof value?.nanoseconds === "number" ? value.nanoseconds : 0;
    return (value.seconds * 1000) + Math.floor(nanoseconds / 1000000);
  }

  return NaN;
}

function isTimestampInSameDay(value, now = new Date()) {
  const timestamp = getTimestampMs(value);
  if (!Number.isFinite(timestamp)) return false;

  const currentDate = new Date(timestamp);
  return (
    currentDate.getFullYear() === now.getFullYear() &&
    currentDate.getMonth() === now.getMonth() &&
    currentDate.getDate() === now.getDate()
  );
}

function getPeriodStart(period = "today", now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "month") {
    start.setDate(1);
    return start;
  }

  if (period === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return start;
  }

  return start;
}

function isTimestampInPeriod(value, period = "today", now = new Date()) {
  const timestamp = getTimestampMs(value);
  if (!Number.isFinite(timestamp)) return false;

  return timestamp >= getPeriodStart(period, now).getTime() && timestamp <= now.getTime();
}

function getStudentTasks(student = {}) {
  return Array.isArray(student?.tasks) ? student.tasks : [];
}

function buildDirectorDailySummary(students = []) {
  const now = new Date();
  const activeStudents = students.filter((student) => !student?.is_archived);

  let tasksSentTodayCount = 0;
  let approvedTasksTodayCount = 0;
  let pendingTasksCount = 0;

  const presentStudentsCount = activeStudents.filter((student) => {
    const tasks = getStudentTasks(student);
    let hasTodayActivity = false;

    tasks.forEach((task) => {
      if (task?.status === "pending" || task?.status === "pending_assistant") {
        pendingTasksCount += 1;
      }

      if (isTimestampInSameDay(task?.created_at, now)) {
        tasksSentTodayCount += 1;
        hasTodayActivity = true;
      }

      if (isTimestampInSameDay(task?.completed_at, now)) {
        approvedTasksTodayCount += 1;
        hasTodayActivity = true;
      }
    });

    return hasTodayActivity;
  }).length;

  return {
    presentTodayCount: presentStudentsCount,
    absentTodayCount: Math.max(activeStudents.length - presentStudentsCount, 0),
    tasksSentTodayCount,
    approvedTasksTodayCount,
    pendingTasksCount,
  };
}

function buildTeacherNameByHalaqaMap(teachers = [], halaqas = []) {
  const teacherNameByHalaqa = new Map();

  teachers.forEach((teacher) => {
    const halaqaCode = String(teacher?.halaqa || "").trim();
    if (!halaqaCode) return;

    teacherNameByHalaqa.set(halaqaCode, teacher.name || teacher.code || "غير مربوط");
  });

  halaqas.forEach((halaqa) => {
    const halaqaCode = String(halaqa?.code || "").trim();
    const teacherId = String(halaqa?.teacher_id || "").trim();
    if (!halaqaCode || !teacherId || teacherNameByHalaqa.has(halaqaCode)) return;

    const matchedTeacher = teachers.find((teacher) => teacher.code === teacherId);
    teacherNameByHalaqa.set(halaqaCode, matchedTeacher?.name || teacherId);
  });

  return teacherNameByHalaqa;
}

function buildDirectorHalaqasData(students = [], halaqas = [], teachers = []) {
  const halaqaSummaries = buildDirectorHalaqaSummaries(students, halaqas);
  const teacherNameByHalaqa = buildTeacherNameByHalaqaMap(teachers, halaqas);
  const items = halaqaSummaries.map((summary) => {
    const halaqaStudents = students.filter((student) => summary.code === normalizeHalaqaCode(student?.halaqa));

    let presentTodayCount = 0;
    let tasksTodayCount = 0;

    halaqaStudents
      .filter((student) => !student?.is_archived)
      .forEach((student) => {
        const tasks = getStudentTasks(student);
        let hasTodayActivity = false;

        tasks.forEach((task) => {
          if (isTimestampInSameDay(task?.created_at)) {
            tasksTodayCount += 1;
            hasTodayActivity = true;
          }

          if (isTimestampInSameDay(task?.completed_at)) {
            hasTodayActivity = true;
          }
        });

        if (hasTodayActivity) {
          presentTodayCount += 1;
        }
      });

    return {
      ...summary,
      teacherName: teacherNameByHalaqa.get(summary.code) || "غير مربوط",
      presentTodayCount,
      tasksTodayCount,
    };
  });

  const teacherOptions = [...new Set(items.map((item) => item.teacherName).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((teacherName) => ({ value: teacherName, label: teacherName }));

  return {
    items,
    teacherOptions,
  };
}

function buildDirectorHalaqaSummaries(students = [], halaqas = []) {
  return buildHalaqaSummaries(students, halaqas);
}

function buildDirectorOverview(students = [], programs = [], halaqas = []) {
  const halaqaSummaries = buildDirectorHalaqaSummaries(students, halaqas);
  const activePrograms = selectActivePrograms(programs);
  const nominatedHifzTests = students
    .filter((student) => student?.hifz_status === "nominated_for_test")
    .map((student) => ({
      code: student.code,
      name: student.name || student.code,
      halaqaLabel: getHalaqaDisplayLabel(student?.halaqa),
      nominatedAt: getTimestampMs(student?.hifz_test_nominated_at),
    }))
    .sort((a, b) => {
      const timeA = Number.isFinite(a.nominatedAt) ? a.nominatedAt : 0;
      const timeB = Number.isFinite(b.nominatedAt) ? b.nominatedAt : 0;
      return timeA - timeB;
    });

  return {
    totalStudents: students.length,
    totalHalaqas: halaqaSummaries.length,
    activeProgramsCount: activePrograms.length,
    halaqaSummaries,
    nominatedHifzTests,
  };
}

function buildDirectorAccountsData(students = [], teachers = [], halaqas = []) {
  const parentCodes = new Set(
    students
      .map((student) => String(student?.parent_code || "").trim())
      .filter(Boolean)
  );
  const teacherMap = new Map();

  teachers.forEach((teacher) => {
    teacherMap.set(teacher.code, {
      code: teacher.code,
      name: teacher.name || teacher.code,
      halaqa: teacher.halaqa || null,
      halaqaLabel: teacher.halaqa ? getHalaqaDisplayLabel(teacher.halaqa) : "غير مربوط",
      is_active: teacher.is_active,
    });
  });

  const halaqaOptions = buildDirectorHalaqaSummaries(students, halaqas).map((summary) => ({
    code: summary.code,
    label: summary.halaqa,
  }));
  const halaqaLabelByCode = new Map(halaqaOptions.map((halaqa) => [halaqa.code, halaqa.label]));
  const parentMap = new Map();

  students.forEach((student) => {
    const parentCode = String(student?.parent_code || "").trim();
    if (!parentCode) return;

    const existing = parentMap.get(parentCode) || {
      code: parentCode,
      name: String(student?.parent_name || parentCode).trim() || parentCode,
      studentNames: [],
    };

    if (student?.name) {
      existing.studentNames.push(student.name);
    }

    parentMap.set(parentCode, existing);
  });

  const studentItems = students
    .map((student) => ({
      code: student.code,
      name: student.name || student.code,
      halaqaCode: normalizeHalaqaCode(student?.halaqa),
      halaqaLabel: halaqaLabelByCode.get(normalizeHalaqaCode(student?.halaqa)) || getHalaqaDisplayLabel(student?.halaqa),
      statusValue: isStudentActive(student) ? "active" : "inactive",
      statusLabel: isStudentActive(student) ? "نشط" : "غير نشط",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const activeStudentItems = studentItems.filter((student) => student.statusValue === "active");
  const inactiveStudentItems = studentItems.filter((student) => student.statusValue === "inactive");

  const teacherItems = [...teacherMap.values()]
    .map((teacher) => ({
      code: teacher.code,
      name: teacher.name || teacher.code,
      halaqaLabel: teacher.halaqaLabel || "غير مربوط",
      statusLabel: teacher.is_active === false ? "غير نشط" : "نشط",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const parentItems = [...parentMap.values()]
    .map((parent) => ({
      code: parent.code,
      name: parent.name || parent.code,
      linkedStudentLabel: parent.studentNames.length > 1
        ? `${parent.studentNames[0]} +${parent.studentNames.length - 1}`
        : (parent.studentNames[0] || "غير مرتبط"),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const directorItems = [...DEFAULT_DIRECTOR_CODES]
    .map((code) => ({
      code,
      name: code,
      statusLabel: "مدير",
    }));

  return {
    totalStudentAccounts: students.length,
    activeStudentAccounts: students.filter(isStudentActive).length,
    inactiveStudentAccounts: students.filter((student) => !isStudentActive(student)).length,
    totalParentAccounts: parentCodes.size,
    totalTeacherAccounts: teacherMap.size,
    totalDirectorAccounts: DEFAULT_DIRECTOR_CODES.length,
    teacherCodes: [...teacherMap.keys()],
    teachers: [...teacherMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    studentItems,
    activeStudentItems,
    inactiveStudentItems,
    teacherItems,
    parentItems,
    directorItems,
    halaqaOptions,
    directorCodes: [...DEFAULT_DIRECTOR_CODES],
  };
}

function buildDirectorReportsData(students = [], programs = [], halaqas = []) {
  const halaqaSummaries = buildDirectorHalaqaSummaries(students, halaqas);
  const activePrograms = selectActivePrograms(programs);
  const activeStudents = students.filter((student) => !student.is_archived);
  const periodKeys = ["today", "week", "month"];
  const halaqaRows = halaqaSummaries.map((summary) => {
    const halaqaStudents = activeStudents.filter(
      (student) => normalizeHalaqaCode(student?.halaqa) === summary.code
    );
    const periodStats = {};

    periodKeys.forEach((period) => {
      let tasksSentCount = 0;
      let tasksApprovedCount = 0;
      let attendanceCount = 0;
      const now = new Date();

      halaqaStudents.forEach((student) => {
        const tasks = getStudentTasks(student);
        let hasPeriodActivity = false;

        tasks.forEach((task) => {
          if (isTimestampInPeriod(task?.created_at, period, now)) {
            tasksSentCount += 1;
            hasPeriodActivity = true;
          }

          if (isTimestampInPeriod(task?.completed_at, period, now)) {
            tasksApprovedCount += 1;
            hasPeriodActivity = true;
          }
        });

        if (hasPeriodActivity) {
          attendanceCount += 1;
        }
      });

      periodStats[period] = {
        tasksSentCount,
        tasksApprovedCount,
        attendanceCount,
        activeStudentsCount: halaqaStudents.length,
      };
    });

    return {
      code: summary.code,
      halaqa: summary.halaqa,
      periodStats,
    };
  });

  const overallPeriodStats = periodKeys.reduce((acc, period) => {
    acc[period] = halaqaRows.reduce(
      (totals, row) => ({
        tasksSentCount: totals.tasksSentCount + (row.periodStats?.[period]?.tasksSentCount || 0),
        tasksApprovedCount: totals.tasksApprovedCount + (row.periodStats?.[period]?.tasksApprovedCount || 0),
        attendanceCount: totals.attendanceCount + (row.periodStats?.[period]?.attendanceCount || 0),
        activeStudentsCount: totals.activeStudentsCount + (row.periodStats?.[period]?.activeStudentsCount || 0),
      }),
      {
        tasksSentCount: 0,
        tasksApprovedCount: 0,
        attendanceCount: 0,
        activeStudentsCount: 0,
      }
    );

    return acc;
  }, {});

  return {
    activeProgramsCount: activePrograms.length,
    halaqaOptions: halaqaSummaries.map((summary) => ({
      code: summary.code,
      label: summary.halaqa,
    })),
    halaqaRows,
    overallPeriodStats,
  };
}

function buildDirectorSettingsData(programs = []) {
  const activePrograms = selectActivePrograms(programs);
  const dailyStreakProgram = programs.find((program) => program?.type === PROGRAM_TYPES.DAILY_STREAK) || null;
  const generalSettings = [
    { label: "المساعدون", value: CONFIG.ENABLE_ASSISTANTS ? "مفعل" : "غير مفعل" },
    { label: "الحفظ المرن", value: CONFIG.ENABLE_FLEXIBLE_HIFZ ? "مفعل" : "غير مفعل" },
    { label: "البرامج", value: CONFIG.ENABLE_PROGRAMS ? "مفعل" : "غير مفعل" },
    { label: "تتبع الأسبوع", value: CONFIG.ENABLE_WEEK_TRACKING ? "مفعل" : "غير مفعل" },
  ];

  const roleItems = [
    ROLES.DIRECTOR,
    ROLES.ASSISTANT,
    ROLES.TEACHER,
    ROLES.PARENT,
    ROLES.STUDENT,
  ].map((role) => ({
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
  }));

  const adminItems = [
    { label: "عدد البرامج النشطة", value: activePrograms.length },
    { label: "وجود دور المساعد", value: CONFIG.ENABLE_ASSISTANTS ? "مدعوم" : "غير مدعوم" },
  ];

  return {
    generalSettings,
    roleItems,
    adminItems,
    dailyStreak: {
      id: dailyStreakProgram?.id || "daily_streak_1",
      exists: Boolean(dailyStreakProgram),
      status: dailyStreakProgram?.status || PROGRAM_STATUSES.DRAFT,
      holidayDateKeys: Array.isArray(dailyStreakProgram?.config?.holiday_date_keys)
        ? dailyStreakProgram.config.holiday_date_keys
        : [],
    },
  };
}

function buildDirectorDashboardData(students = [], programs = [], halaqas = [], teachers = []) {
  return {
    overview: buildDirectorOverview(students, programs, halaqas),
    activePrograms: selectActivePrograms(programs),
    accounts: buildDirectorAccountsData(students, teachers, halaqas),
    reports: buildDirectorReportsData(students, programs, halaqas),
    dailySummary: buildDirectorDailySummary(students),
    halaqas: buildDirectorHalaqasData(students, halaqas, teachers),
    settings: buildDirectorSettingsData(programs),
  };
}

export {
  buildDirectorHalaqaSummaries,
  buildDirectorHalaqasData,
  buildDirectorOverview,
  buildDirectorDailySummary,
  buildDirectorAccountsData,
  buildDirectorReportsData,
  buildDirectorSettingsData,
  buildDirectorDashboardData,
};
