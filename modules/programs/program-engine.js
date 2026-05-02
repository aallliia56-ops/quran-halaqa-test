const PROGRAM_TYPES = {
  DAILY_STREAK: "daily_streak",
};

const PROGRAM_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  ENDED: "ended",
  ARCHIVED: "archived",
};

const DAILY_STREAK_STUDY_DAYS = [0, 1, 2, 3, 4];
const DAILY_STREAK_TODAY_STATUSES = {
  COMPLETED: "completed",
  PENDING: "pending",
  NOT_STUDY_DAY: "not_study_day",
};

function normalizeStudyDays(studyDays = DAILY_STREAK_STUDY_DAYS) {
  const normalizedStudyDays = Array.isArray(studyDays)
    ? studyDays
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : [];

  return normalizedStudyDays.length
    ? [...new Set(normalizedStudyDays)]
    : [...DAILY_STREAK_STUDY_DAYS];
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function toRiyadhDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey || "").split("-").map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function shiftDate(date, days) {
  const shiftedDate = new Date(date);
  shiftedDate.setDate(shiftedDate.getDate() + days);
  return shiftedDate;
}

function buildHolidayDateKeySet(holidayDateKeys = []) {
  return new Set(normalizeDateKeys(holidayDateKeys));
}

function isStudyDay(dateInput, options = {}) {
  const date = dateInput instanceof Date ? dateInput : parseDateKey(dateInput);
  if (!date) return false;

  const dateKey = toDateKey(date);
  const studyDays = normalizeStudyDays(options.studyDays);
  const holidayDateKeySet = options.holidayDateKeySet instanceof Set
    ? options.holidayDateKeySet
    : buildHolidayDateKeySet(options.holidayDateKeys);

  if (holidayDateKeySet.has(dateKey)) {
    return false;
  }

  return studyDays.includes(date.getDay());
}

function getPreviousStudyDayKey(dateInput, options = {}) {
  const initialDate = dateInput instanceof Date ? new Date(dateInput) : parseDateKey(dateInput);
  if (!initialDate) return null;

  let cursor = shiftDate(initialDate, -1);

  while (!isStudyDay(cursor, options)) {
    cursor = shiftDate(cursor, -1);
  }

  return toDateKey(cursor);
}

function getNextStudyDayKey(dateInput, options = {}) {
  const initialDate = dateInput instanceof Date ? new Date(dateInput) : parseDateKey(dateInput);
  if (!initialDate) return null;

  let cursor = shiftDate(initialDate, 1);

  while (!isStudyDay(cursor, options)) {
    cursor = shiftDate(cursor, 1);
  }

  return toDateKey(cursor);
}

function normalizeDateKeys(dateKeys = []) {
  const normalizedInput = Array.isArray(dateKeys)
    ? dateKeys
    : dateKeys && typeof dateKeys === "object"
    ? Object.keys(dateKeys).filter((dateKey) => Boolean(dateKeys[dateKey]))
    : [];

  return [...new Set(
    normalizedInput
      .map((dateKey) => parseDateKey(dateKey))
      .filter(Boolean)
      .map((date) => toDateKey(date))
      .filter(Boolean)
  )].sort();
}

function getCurrentStreakFromDateSet(completedDateSet, referenceDateKey, options = {}) {
  if (!referenceDateKey || !completedDateSet.has(referenceDateKey)) {
    return 0;
  }

  let streak = 1;
  let cursor = referenceDateKey;

  while (true) {
    const previousStudyDayKey = getPreviousStudyDayKey(cursor, options);
    if (!previousStudyDayKey || !completedDateSet.has(previousStudyDayKey)) {
      return streak;
    }

    streak += 1;
    cursor = previousStudyDayKey;
  }
}

function getLongestStreak(completedDateKeys, options = {}) {
  const completedDateSet = new Set(completedDateKeys);
  let longestStreak = 0;

  completedDateKeys.forEach((dateKey) => {
    const previousStudyDayKey = getPreviousStudyDayKey(dateKey, options);
    if (previousStudyDayKey && completedDateSet.has(previousStudyDayKey)) {
      return;
    }

    const streak = getCurrentStreakFromDateSet(completedDateSet, dateKey, options);
    if (streak > longestStreak) {
      longestStreak = streak;
    }
  });

  return longestStreak;
}

function getDailyStreakTodayStatus(completedDateSet, todayDateKey, todayIsStudyDay) {
  if (!todayIsStudyDay) {
    return DAILY_STREAK_TODAY_STATUSES.NOT_STUDY_DAY;
  }

  return completedDateSet.has(todayDateKey)
    ? DAILY_STREAK_TODAY_STATUSES.COMPLETED
    : DAILY_STREAK_TODAY_STATUSES.PENDING;
}

function calculateDailyStreakMetrics({
  completedDateKeys = [],
  today = new Date(),
  studyDays = DAILY_STREAK_STUDY_DAYS,
  holidayDateKeys = [],
} = {}) {
  const normalizedDateKeys = normalizeDateKeys(completedDateKeys);
  const completedDateSet = new Set(normalizedDateKeys);
  const holidayDateKeySet = buildHolidayDateKeySet(holidayDateKeys);
  const todayDateKey = toRiyadhDateKey(today);
  const todayDate = parseDateKey(todayDateKey);
  const streakOptions = {
    studyDays,
    holidayDateKeySet,
  };
  const todayIsStudyDay = isStudyDay(todayDate, streakOptions);
  const completedToday = completedDateSet.has(todayDateKey);
  const referenceDateKey = todayIsStudyDay && completedToday
    ? todayDateKey
    : getPreviousStudyDayKey(todayDateKey, streakOptions);

  return {
    currentStreak: getCurrentStreakFromDateSet(completedDateSet, referenceDateKey, streakOptions),
    longestStreak: getLongestStreak(normalizedDateKeys, streakOptions),
    todayStatus: getDailyStreakTodayStatus(completedDateSet, todayDateKey, todayIsStudyDay),
    completedDateKeys: normalizedDateKeys,
    lastQualifiedStudyDayKey: referenceDateKey,
    holidayDateKeys: [...holidayDateKeySet],
  };
}

function evaluateDailyStreakProgram(program, participation = {}, options = {}) {
  const programConfig = program?.config || {};

  return {
    ...calculateDailyStreakMetrics({
      completedDateKeys: participation.completed_date_keys,
      today: options.today,
      studyDays: programConfig.study_days,
      holidayDateKeys: programConfig.holiday_date_keys,
    }),
    programId: program?.id || null,
    programType: PROGRAM_TYPES.DAILY_STREAK,
  };
}

const PROGRAM_EVALUATORS = {
  [PROGRAM_TYPES.DAILY_STREAK]: evaluateDailyStreakProgram,
};

function supportsProgramType(programType) {
  return Boolean(PROGRAM_EVALUATORS[programType]);
}

function evaluateProgram(program, participation = {}, options = {}) {
  const evaluator = PROGRAM_EVALUATORS[program?.type];
  if (!evaluator) return null;

  return evaluator(program, participation, options);
}

export {
  PROGRAM_TYPES,
  PROGRAM_STATUSES,
  DAILY_STREAK_STUDY_DAYS,
  DAILY_STREAK_TODAY_STATUSES,
  toDateKey,
  parseDateKey,
  isStudyDay,
  getPreviousStudyDayKey,
  getNextStudyDayKey,
  normalizeDateKeys,
  calculateDailyStreakMetrics,
  supportsProgramType,
  evaluateProgram,
};
