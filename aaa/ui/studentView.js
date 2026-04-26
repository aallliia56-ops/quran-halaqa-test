const studentHifzNextLabel = document.querySelector("#student-hifz-next-label");
const studentMurajaaNextLabel = document.querySelector("#student-murajaa-next-label");

console.log("STUDENT_VIEW_VERSION_2026_04_08_A");

const studentScreen = document.querySelector("#student-screen");
const studentAssistantTasksList = document.querySelector("#student-assistant-tasks");

import { getCurrentMurajaaMission, getNextMurajaaMission } from "../core/missions.js";
import { renderStudentProgress } from "./student/progress.js";
import { getStudentHifzPauseCardCopy, renderStudentTasks as renderStudentTasksFromTasks } from "./student/tasks.js";
import { renderStudentPrograms } from "./student/programs.js";
import { HIFZ_CURRICULUM } from "../data/curriculum.js";
import {
  hasExternalCurriculumRuntime,
  getExternalHifzPlanBounds,
} from "../modules/curriculum/curriculum-runtime.js";
import { DEFAULT_HALAQA } from "../app/halaqa-utils.js";

const $ = (s) => document.querySelector(s);
export { renderStudentTasksFromTasks as renderStudentTasks };
export async function displayStudentDashboard(params) {

  const {
    student,
    fetchStudentByCode,
    db,
    showMessage,
    authMessage,
    renderStudentTasks,
    submitCurriculumTask,
    cancelCurriculumTask,
    submitMurajaaTask,
    cancelMurajaaTask,
    submitFlexibleHifzTask,
    submitGeneralTask,
    cancelGeneralTask,
    loadAssistantTasksForCurrentUser,
    generateUniqueId,
    getStudentEls,
    safeSetText,
    fetchStudentsSortedByPointsForHalaqa,
    updatePlanStrip,
    CONFIG,
    hideAllScreens
  } = params; 
  try {
    const resolvedStudent = student?.code && typeof fetchStudentByCode === "function"
      ? (await fetchStudentByCode(student.code)) || student
      : student;

    const els = getStudentEls();
    safeSetText(els.welcome, `أهلاً بك يا ${resolvedStudent.name || "طالب"}`);

    const planBounds = hasExternalCurriculumRuntime()
      ? getExternalHifzPlanBounds(resolvedStudent)
      : (() => {
          const startIdx = resolvedStudent.hifz_start_id ?? 0;
          const endIdx = resolvedStudent.hifz_end_id ?? HIFZ_CURRICULUM.length - 1;
          const startItem = HIFZ_CURRICULUM[startIdx];
          const endItem = HIFZ_CURRICULUM[endIdx];
          return {
            startLabel: startItem ? startItem.surah_name_ar : "—",
            endLabel: endItem ? endItem.surah_name_ar : "—",
          };
        })();
    const points = resolvedStudent.total_points || 0;

    const studentHalaqa = resolvedStudent.halaqa || DEFAULT_HALAQA;
    const sameHalaqa = await fetchStudentsSortedByPointsForHalaqa(studentHalaqa);

    const level = resolvedStudent.murajaa_level || "BUILDING";
    let rankOnly = "—";

    if (level === "BUILDING") {
      const buildingGroup = sameHalaqa.filter((s) => (s.murajaa_level || "BUILDING") === "BUILDING");
      const idx = buildingGroup.findIndex((s) => s.code === resolvedStudent.code);
      if (idx !== -1) rankOnly = String(idx + 1);
    } else {
      const devAdvGroup = sameHalaqa.filter((s) => {
        const lv = s.murajaa_level || "BUILDING";
        return lv === "DEVELOPMENT" || lv === "ADVANCED";
      });
      const idx = devAdvGroup.findIndex((s) => s.code === resolvedStudent.code);
      if (idx !== -1) rankOnly = String(idx + 1);
    }

    updatePlanStrip({ startSurah: planBounds.startLabel, endSurah: planBounds.endLabel, points, rank: rankOnly });

    renderStudentProgress({
      student: resolvedStudent,
      els,
      safeSetText,
      getStudentHifzPauseCardCopy,
    });

    safeSetText(els.totalPoints, points);
    safeSetText(els.rankText, rankOnly);
    await renderStudentPrograms({ student: resolvedStudent, db, CONFIG });
    const refresh = (updatedStudent) =>
      displayStudentDashboard({
        ...params,
        student: updatedStudent
      });
    renderStudentTasks(resolvedStudent, {
  submitCurriculumTask: (code, mission) =>
    submitCurriculumTask({
      db,
      studentCode: code,
      mission,
      showMessage,
      displayStudentDashboard: refresh,
      generateUniqueId,
      authMessage
    }),

  cancelCurriculumTask: (code, type, key) =>
    cancelCurriculumTask({
      db,
      studentCode: code,
      type, // ? بدل mission
      key,  // ? بدل mission
      showMessage,
      displayStudentDashboard: refresh,
      authMessage
    }),

  submitMurajaaTask: (code, mission) =>
    submitMurajaaTask({
      db,
      studentCode: code,
      mission,
      showMessage,
      displayStudentDashboard: refresh,
      generateUniqueId,
      authMessage
    }),

  cancelMurajaaTask: (code, mission) =>
    cancelMurajaaTask({
      db,
      studentCode: code,
      mission,
      showMessage,
      displayStudentDashboard: refresh,
      authMessage
    }),

  submitFlexibleHifzTask: (code, mission, endAyah) =>
    submitFlexibleHifzTask({
      db,
      studentCode: code,
      mission,
      endAyah, // ? مهم
      showMessage,
      displayStudentDashboard: refresh,
      generateUniqueId,
      authMessage
    }),

  submitGeneralTask: (code, id) =>
    submitGeneralTask({
      db,
      studentCode: code,
      taskId: id, // ? بدل mission
      showMessage,
      displayStudentDashboard: refresh,
      generateUniqueId,
      authMessage
    }),

  cancelGeneralTask: (code, id) =>
    cancelGeneralTask({
      db,
      studentCode: code,
      taskId: id, // ? بدل mission
      showMessage,
      displayStudentDashboard: refresh,
      authMessage
    }),
});
  

    hideAllScreens();
    document.querySelector("#student-screen")?.classList.remove("hidden");

    if (CONFIG.ENABLE_ASSISTANTS && student.is_student_assistant) {
      await loadAssistantTasksForCurrentUser({
  db
});
    } else if (studentAssistantTasksList) {
      studentAssistantTasksList.innerHTML = "";
    }
  } catch (err) {
    console.error("displayStudentDashboard error:", err);
    showMessage(authMessage, `خطأ في عرض واجهة الطالب: ${err.message}`, "error");
  }
}








