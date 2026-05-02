import {
  ensureStudentProgramParticipation,
  fetchAllProgramsSnapshot,
} from "../../modules/programs/programs.service.js";
import {
  DAILY_STREAK_TODAY_STATUSES,
  PROGRAM_STATUSES,
  evaluateProgram,
} from "../../modules/programs/program-engine.js";
import { DEFAULT_HALAQA } from "../../app/halaqa-utils.js";

const studentScreen = document.querySelector("#student-screen");

export function ensureStudentProgramsSection() {
  let programsSection = document.querySelector("#student-programs-section");
  if (programsSection) return programsSection;

  programsSection = document.createElement("section");
  programsSection.id = "student-programs-section";
  programsSection.className = "tasks-section";
  programsSection.innerHTML = `
    <h3>البرامج النشطة</h3>
    <div id="student-programs-list" class="tasks-list"></div>
  `;

  const progressSection = studentScreen?.querySelector(".progress-section");
  if (progressSection?.parentNode) {
    progressSection.parentNode.insertBefore(programsSection, progressSection.nextSibling);
  } else {
    studentScreen?.appendChild(programsSection);
  }

  return programsSection;
}

export function ensureStudentDailyStreakBadge() {
  const planStrip = document.querySelector("#student-plan-strip");
  if (!planStrip) return null;

  let streakBadge = document.querySelector("#student-daily-streak-badge");
  if (streakBadge) return streakBadge;

  streakBadge = document.createElement("span");
  streakBadge.id = "student-daily-streak-badge";
  streakBadge.className = "badge badge-rank hidden";

  const separator = document.createElement("span");
  separator.className = "dot hidden";
  separator.id = "student-daily-streak-dot";
  separator.textContent = "•";

  planStrip.appendChild(separator);
  planStrip.appendChild(streakBadge);

  return streakBadge;
}

export function hideStudentDailyStreakBadge() {
  const streakBadge = document.querySelector("#student-daily-streak-badge");
  const separator = document.querySelector("#student-daily-streak-dot");

  streakBadge?.classList.add("hidden");
  separator?.classList.add("hidden");
}

export function renderStudentDailyStreakBadge(program, participation) {
  const streakBadge = ensureStudentDailyStreakBadge();
  const separator = document.querySelector("#student-daily-streak-dot");
  if (!streakBadge || !separator) return;

  const evaluation = evaluateProgram(program, participation);
  if (!evaluation) {
    hideStudentDailyStreakBadge();
    return;
  }

  streakBadge.textContent = `🔥 ${evaluation.currentStreak}`;
  streakBadge.classList.remove("hidden");
  separator.classList.remove("hidden");
}

export function buildProgramStatusText(programEvaluation) {
  if (!programEvaluation) return "";

  if (programEvaluation.todayStatus === DAILY_STREAK_TODAY_STATUSES.COMPLETED) {
    return "تم الحفاظ على السلسلة اليوم";
  }

  if (programEvaluation.todayStatus === DAILY_STREAK_TODAY_STATUSES.NOT_STUDY_DAY) {
    return "اليوم غير محسوب ضمن أيام الدراسة";
  }

  return "اليوم الدراسي الحالي لم يكتمل بعد";
}

export function createDailyStreakProgramCard(program, programEvaluation) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.innerHTML = `
    <div class="task-header">
      <div class="task-title">${program.name || "Daily Streak"}</div>
      <span class="task-type-tag general">برنامج</span>
    </div>
    <div class="task-body mission-text" style="line-height:1.9">
      <div>السلسلة الحالية: <strong>${programEvaluation.currentStreak}</strong></div>
      <div>أطول سلسلة: <strong>${programEvaluation.longestStreak}</strong></div>
      <div>${buildProgramStatusText(programEvaluation)}</div>
    </div>
  `;

  return card;
}

export function createProgramCard(program, participation) {
  const programEvaluation = evaluateProgram(program, participation);
  if (!programEvaluation) return null;

  if (program.type === "daily_streak") {
    return createDailyStreakProgramCard(program, programEvaluation);
  }

  return null;
}

export async function renderStudentPrograms({ student, db, CONFIG }) {
  document.querySelector("#student-programs-section")?.remove();

  if (!CONFIG?.ENABLE_PROGRAMS) {
    hideStudentDailyStreakBadge();
    return;
  }

  console.log("[programs] before resolving daily streak for student", {
    projectId: db?.app?.options?.projectId || null,
    hasDb: Boolean(db),
    halaqa: student.halaqa || DEFAULT_HALAQA,
    role: "student",
    programParticipation: student.program_participation || {},
  });
  console.log("[programs] student daily streak context", {
    contextRole: "student",
    contextHalaqa: student.halaqa || DEFAULT_HALAQA,
    contextJson: JSON.stringify({
      role: "student",
      halaqa: student.halaqa || DEFAULT_HALAQA,
    }),
  });

  const programs = await fetchAllProgramsSnapshot(db);
  const dailyStreakProgram = programs.find(
    (program) => program.type === "daily_streak" && program.status === PROGRAM_STATUSES.ACTIVE
  );

  if (!dailyStreakProgram) {
    hideStudentDailyStreakBadge();
    return;
  }

  const participation = await ensureStudentProgramParticipation(db, student, dailyStreakProgram);
  if (!participation) {
    hideStudentDailyStreakBadge();
    return;
  }

  renderStudentDailyStreakBadge(dailyStreakProgram, participation);

  console.log("[programs] render daily streak badge", {
    programsLength: programs.length,
    docIds: programs.map((program) => program.id),
    activeProgramId: dailyStreakProgram.id,
    programParticipation: student.program_participation || {},
  });
}
