import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const APPROVED_TASK_TYPES = ["hifz", "murajaa", "hifz_flexible", "general"];

function buildRiyadhDateKey(value = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function getDailyApprovedTaskSubmissionsReport(db) {
  const todayDateKey = buildRiyadhDateKey();
  const report = {
    dateKey: todayDateKey,
    totalApprovedToday: 0,
    byType: {
      hifz: 0,
      murajaa: 0,
      hifz_flexible: 0,
      general: 0,
    },
    byHalaqa: {},
  };

  const approvedSubmissionsSnapshot = await getDocs(query(
    collection(db, "task_submissions"),
    where("status", "==", "approved")
  ));

  approvedSubmissionsSnapshot.forEach((submissionDoc) => {
    const submission = submissionDoc.data();
    const completedAt = submission?.completed_at;
    if (!Number.isFinite(completedAt)) {
      return;
    }

    if (buildRiyadhDateKey(completedAt) !== todayDateKey) {
      return;
    }

    report.totalApprovedToday += 1;

    const type = String(submission?.type || "").trim();
    if (APPROVED_TASK_TYPES.includes(type)) {
      report.byType[type] += 1;
    }

    const halaqaKey = String(submission?.halaqa_id || submission?.halaqa_code || "").trim() || "unknown";
    report.byHalaqa[halaqaKey] = (report.byHalaqa[halaqaKey] || 0) + 1;
  });

  return report;
}

export { getDailyApprovedTaskSubmissionsReport };
