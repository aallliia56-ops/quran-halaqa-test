import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const DAILY_STREAK_PROGRAM_ID = "daily_streak_1";
const DAILY_STREAK_PROGRAM_TYPE = "daily_streak";
const DAILY_STREAK_ALLOWED_TASK_TYPES = new Set(["hifz", "murajaa", "hifz_flexible"]);

function buildRiyadhDateKey(value = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeProgramStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeProgramType(value) {
  return String(value || "").trim().toLowerCase();
}

function isDailyStreakProgramEnabled(programDoc) {
  const program = programDoc?.data?.() || {};
  const matchesId = String(programDoc?.id || "").trim() === DAILY_STREAK_PROGRAM_ID;
  const matchesType = normalizeProgramType(program?.type) === DAILY_STREAK_PROGRAM_TYPE;

  if (!matchesId && !matchesType) {
    return false;
  }

  return normalizeProgramStatus(program?.status) === "active";
}

function isApprovedDailyStreakSubmission(submission = {}, studentCode = "", todayDateKey = "") {
  const submissionStudentId = String(submission?.student_id || "").trim();
  const submissionStudentCode = String(submission?.student_code || "").trim();
  const normalizedStudentCode = String(studentCode || "").trim();

  if (!normalizedStudentCode) {
    return false;
  }

  if (
    submissionStudentId !== normalizedStudentCode &&
    submissionStudentCode !== normalizedStudentCode
  ) {
    return false;
  }

  if (String(submission?.status || "").trim().toLowerCase() !== "approved") {
    return false;
  }

  if (!DAILY_STREAK_ALLOWED_TASK_TYPES.has(String(submission?.type || "").trim())) {
    return false;
  }

  const completedAt = submission?.completed_at;
  if (!Number.isFinite(completedAt)) {
    return false;
  }

  return buildRiyadhDateKey(completedAt) === todayDateKey;
}

async function hasApprovedDailyStreakActivityForStudent(db, studentCode) {
  const todayDateKey = buildRiyadhDateKey();
  const normalizedStudentCode = String(studentCode || "").trim();

  if (!normalizedStudentCode) {
    return {
      enabled: false,
      todayDateKey,
      hasApprovedActivityToday: false,
      matchedSubmissionId: null,
    };
  }

  const dailyStreakProgramSnapshot = await getDoc(doc(db, "programs", DAILY_STREAK_PROGRAM_ID));
  const enabled = dailyStreakProgramSnapshot.exists()
    ? isDailyStreakProgramEnabled(dailyStreakProgramSnapshot)
    : false;

  if (!enabled) {
    return {
      enabled: false,
      todayDateKey,
      hasApprovedActivityToday: false,
      matchedSubmissionId: null,
    };
  }

  const submissionsByStudentCodeSnapshot = await getDocs(query(
    collection(db, "task_submissions"),
    where("student_code", "==", normalizedStudentCode),
    where("status", "==", "approved"),
    limit(50)
  ));
  const matchedSubmissionByCode = submissionsByStudentCodeSnapshot.docs.find((docSnapshot) =>
    isApprovedDailyStreakSubmission(docSnapshot.data(), normalizedStudentCode, todayDateKey)
  );

  let matchedSubmission = matchedSubmissionByCode || null;

  if (!matchedSubmission) {
    const submissionsByStudentIdSnapshot = await getDocs(query(
      collection(db, "task_submissions"),
      where("student_id", "==", normalizedStudentCode),
      where("status", "==", "approved"),
      limit(50)
    ));
    matchedSubmission = submissionsByStudentIdSnapshot.docs.find((docSnapshot) =>
      isApprovedDailyStreakSubmission(docSnapshot.data(), normalizedStudentCode, todayDateKey)
    ) || null;
  }

  return {
    enabled: true,
    todayDateKey,
    hasApprovedActivityToday: Boolean(matchedSubmission),
    matchedSubmissionId: matchedSubmission?.id || null,
  };
}

export { hasApprovedDailyStreakActivityForStudent };
