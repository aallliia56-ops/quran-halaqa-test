
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

import { HIFZ_CURRICULUM, FLEXIBLE_HIFZ, FLEXIBLE_POINTS, REVIEW_CURRICULUM } from "../data/curriculum.js";
import {
  getLastFullSurahNumber,
  chooseMurajaaStartIndexFromLastSurah,
} from "../modules/curriculum/curriculum-helpers.js";
import {
  hasExternalCurriculumRuntime,
  getApprovedExternalHifzState,
  getFlexibleApprovedExternalHifzState,
  getPhaseForProgressIndex,
  getPhaseUnitRange,
  HIFZ_ACTIVE_STATUS,
  HIFZ_NOMINATED_FOR_TEST_STATUS,
  HIFZ_TEST_FAILED_STATUS,
  getNextAyahPosition,
} from "../modules/curriculum/curriculum-runtime.js";
import { invalidateStudentsSnapshotCache } from "../modules/students/students.service.js";
const getReviewArrayForLevel = (level) => REVIEW_CURRICULUM[level] || [];
function buildRiyadhDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildTaskSubmissionRecord({ task, studentCode, student = {}, halaqa = {} }) {
  const studentId = String(student?.code || studentCode || "").trim() || null;
  const halaqaCode = String(student?.halaqa || "").trim() || null;
  const teacherId = String(halaqa?.teacher_id || "").trim() || null;

  return {
    task_id: task.id,
    student_id: studentId,
    student_code: studentId,
    halaqa_id: halaqaCode,
    halaqa_code: halaqaCode,
    teacher_id: teacherId,
    teacher_code: teacherId,
    type: task.type,
    title: task.description || "",
    status: task.status,
    created_at: task.created_at,
    completed_at: null,
    reviewed_at: null,
  };
}

export async function submitCurriculumTask({
  db,
  studentCode,
  mission,
  showMessage,
  displayStudentDashboard,
  generateUniqueId,
  authMessage
}) {
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;
    const student = snap.data();

    const tasks = Array.isArray(student.tasks) ? student.tasks : [];
    if (
      tasks.some(
        (t) =>
          t.type === "hifz" &&
          (t.status === "pending" || t.status === "pending_assistant") &&
          t.mission_start === mission.startIndex
      )
    ) {
      showMessage(authMessage, "المهمة قيد المراجعة بالفعل.", "info");
      return;
    }

    const task = {
      id: generateUniqueId(),
      type: "hifz",
      description: mission.description,
      points: mission.points,
      status: "pending",
      mission_start: mission.startIndex,
      mission_last: mission.lastIndex,
      created_at: Date.now(),
    };
    tasks.push(task);

    const halaqaRef = student.halaqa ? doc(db, "halaqas", student.halaqa) : null;
    const halaqaSnap = halaqaRef ? await getDoc(halaqaRef) : null;
    const halaqa = halaqaSnap?.exists() ? halaqaSnap.data() : {};
    const submissionRef = doc(db, "task_submissions", task.id);
    const batch = writeBatch(db);

    batch.update(studentRef, { tasks });
    batch.set(submissionRef, buildTaskSubmissionRecord({ task, studentCode, student, halaqa }));
    await batch.commit();
    invalidateStudentsSnapshotCache();
    await displayStudentDashboard({ code: studentCode, ...student, tasks });
    showMessage(authMessage, "تم إرسال مهمة الحفظ للمراجعة.", "success");
  } catch (e) {
    console.error("Error submitCurriculumTask:", e);
    showMessage(authMessage, `حدث خطأ: ${e.message}`, "error");
  }
}
export async function submitFlexibleHifzTask({
  db,
  studentCode,
  mission,
  endAyah,
  showMessage,
  displayStudentDashboard,
  generateUniqueId,
  authMessage
}) {
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;
    const student = snap.data();

    const tasks = Array.isArray(student.tasks) ? student.tasks : [];

    const task = {
      id: generateUniqueId(),
      type: "hifz_flexible",
      status: "pending",
      points: mission.points || FLEXIBLE_POINTS,
      created_at: Date.now(),

      flex_surah_index: mission.surahIdx,
      flex_surah_number: mission.surah_number,
      flex_surah_name_ar: mission.surah_name_ar,
      flex_start_ayah: mission.startAyah,
      flex_end_ayah: endAyah,

      description: `${mission.surah_name_ar} (${mission.startAyah}-${endAyah})`,
    };
    tasks.push(task);

    const halaqaRef = student.halaqa ? doc(db, "halaqas", student.halaqa) : null;
    const halaqaSnap = halaqaRef ? await getDoc(halaqaRef) : null;
    const halaqa = halaqaSnap?.exists() ? halaqaSnap.data() : {};
    const submissionRef = doc(db, "task_submissions", task.id);
    const batch = writeBatch(db);

    batch.update(studentRef, { tasks });
    batch.set(submissionRef, buildTaskSubmissionRecord({ task, studentCode, student, halaqa }));
    await batch.commit();
    invalidateStudentsSnapshotCache();
    await displayStudentDashboard({ code: studentCode, ...student, tasks });
    showMessage(authMessage, "تم إرسال مهمة الحفظ (المنهج المرن) للمراجعة.", "success");
  } catch (e) {
    console.error("Error submitFlexibleHifzTask:", e);
    showMessage(authMessage, `حدث خطأ: ${e.message}`, "error");
  }
}
export async function cancelCurriculumTask({
  db,
  studentCode,
  type,   // ? مهم
  key,    // ? مهم
  showMessage,
  displayStudentDashboard,
  authMessage
}){
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;
    const student = snap.data();

    let tasks = Array.isArray(student.tasks) ? student.tasks : [];
    const matchedTask = type === "hifz"
      ? tasks.find((t) => t.type === "hifz" && t.status === "pending" && t.mission_start === key)
      : type === "hifz_flexible"
      ? tasks.find((t) => t.type === "hifz_flexible" && t.status === "pending" && t.id === key)
      : null;

    // type = "hifz" => key = mission_start
    // type = "hifz_flexible" => key = task.id
    if (type === "hifz") {
      tasks = tasks.filter(
        (t) => !(t.type === "hifz" && t.status === "pending" && t.mission_start === key)
      );
    } else if (type === "hifz_flexible") {
      tasks = tasks.filter((t) => !(t.type === "hifz_flexible" && t.status === "pending" && t.id === key));
    }

    const batch = writeBatch(db);
    batch.update(studentRef, { tasks });
    if (matchedTask?.id) {
      batch.delete(doc(db, "task_submissions", matchedTask.id));
    }
    await batch.commit();
    invalidateStudentsSnapshotCache();
    await displayStudentDashboard({ code: studentCode, ...student, tasks });
    showMessage(authMessage, "تم إلغاء إرسال المهمة وإعادتها لك.", "success");
  } catch (e) {
    console.error("Error cancelCurriculumTask:", e);
    showMessage(authMessage, `حدث خطأ: ${e.message}`, "error");
  }
}


export async function submitMurajaaTask({
  db,
  studentCode,
  mission,
  showMessage,
  displayStudentDashboard,
  generateUniqueId,
  authMessage
}) {
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;
    const student = snap.data();

    const tasks = Array.isArray(student.tasks) ? student.tasks : [];
    if (
      tasks.some(
        (t) =>
          t.type === "murajaa" &&
          (t.status === "pending" || t.status === "pending_assistant") &&
          t.murajaa_index === mission.index &&
          t.murajaa_level === mission.level
      )
    ) {
      showMessage(authMessage, "مهمة المراجعة قيد المراجعة بالفعل.", "info");
      return;
    }

    const task = {
      id: generateUniqueId(),
      type: "murajaa",
      description: mission.description,
      points: mission.points,
      status: "pending",
      murajaa_level: mission.level,
      murajaa_index: mission.index,
      created_at: Date.now(),
    };
    tasks.push(task);

    const halaqaRef = student.halaqa ? doc(db, "halaqas", student.halaqa) : null;
    const halaqaSnap = halaqaRef ? await getDoc(halaqaRef) : null;
    const halaqa = halaqaSnap?.exists() ? halaqaSnap.data() : {};
    const submissionRef = doc(db, "task_submissions", task.id);
    const batch = writeBatch(db);

    batch.update(studentRef, { tasks });
    batch.set(submissionRef, buildTaskSubmissionRecord({ task, studentCode, student, halaqa }));
    await batch.commit();
    invalidateStudentsSnapshotCache();
    await displayStudentDashboard({ code: studentCode, ...student, tasks });
    showMessage(authMessage, "تم إرسال مهمة المراجعة للمراجعة.", "success");
  } catch (e) {
    console.error("Error submitMurajaaTask:", e);
    showMessage(authMessage, `حدث خطأ: ${e.message}`, "error");
  }
}

export async function cancelMurajaaTask({
  db,
  studentCode,
  mission,
  showMessage,
  displayStudentDashboard,
  generateUniqueId,
  authMessage
}) {
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;
    const student = snap.data();

    const currentTasks = Array.isArray(student.tasks) ? student.tasks : [];
    const matchedTask = currentTasks.find(
      (t) =>
        t.type === "murajaa" &&
        t.status === "pending" &&
        t.murajaa_level === mission.level &&
        t.murajaa_index === mission.index
    );
    const tasks = currentTasks.filter(
      (t) =>
        !(
          t.type === "murajaa" &&
          t.status === "pending" &&
          t.murajaa_level === mission.level &&
          t.murajaa_index === mission.index
        )
    );

    const batch = writeBatch(db);
    batch.update(studentRef, { tasks });
    if (matchedTask?.id) {
      batch.delete(doc(db, "task_submissions", matchedTask.id));
    }
    await batch.commit();
    invalidateStudentsSnapshotCache();
    await displayStudentDashboard({ code: studentCode, ...student, tasks });
    showMessage(authMessage, "تم إلغاء إرسال مهمة المراجعة وإعادتها لك.", "success");
  } catch (e) {
    console.error("Error cancelMurajaaTask:", e);
    showMessage(authMessage, `حدث خطأ: ${e.message}`, "error");
  }
}

export async function submitGeneralTask({
  db,
  studentCode,
  taskId,
  showMessage,
  displayStudentDashboard,
  authMessage
}) {
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;
    const student = snap.data();

    const tasks = Array.isArray(student.tasks) ? student.tasks : [];
    const i = tasks.findIndex((t) => t.id === taskId);
    if (i === -1) return;

    if (tasks[i].status === "pending" || tasks[i].status === "pending_assistant") {
      showMessage(authMessage, "المهمة قيد المراجعة بالفعل.", "info");
      return;
    }

    tasks[i].status = "pending";
    const task = tasks[i];
    const halaqaRef = student.halaqa ? doc(db, "halaqas", student.halaqa) : null;
    const halaqaSnap = halaqaRef ? await getDoc(halaqaRef) : null;
    const halaqa = halaqaSnap?.exists() ? halaqaSnap.data() : {};
    const submissionRef = doc(db, "task_submissions", task.id);
    const batch = writeBatch(db);

    batch.update(studentRef, { tasks });
    batch.set(submissionRef, buildTaskSubmissionRecord({ task, studentCode, student, halaqa }));
    await batch.commit();
    invalidateStudentsSnapshotCache();
    await displayStudentDashboard({ code: studentCode, ...student, tasks });
    showMessage(authMessage, "تم إرسال المهمة العامة للمراجعة.", "success");
  } catch (e) {
    console.error("Error submitGeneralTask:", e);
    showMessage(authMessage, `حدث خطأ: ${e.message}`, "error");
  }
}

export async function cancelGeneralTask({
  db,
  studentCode,
  taskId,
  showMessage,
  displayStudentDashboard,
  authMessage
}) {
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;
    const student = snap.data();

    const tasks = Array.isArray(student.tasks) ? student.tasks : [];
    const i = tasks.findIndex((t) => t.id === taskId);
    if (i === -1) return;

    const task = tasks[i];
    if (tasks[i].status === "pending") tasks[i].status = "assigned";
    const batch = writeBatch(db);
    batch.update(studentRef, { tasks });
    if (task?.id) {
      batch.delete(doc(db, "task_submissions", task.id));
    }
    await batch.commit();
    invalidateStudentsSnapshotCache();
    await displayStudentDashboard({ code: studentCode, ...student, tasks });
    showMessage(authMessage, "تم إلغاء إرسال المهمة العامة.", "success");
  } catch (e) {
    console.error("Error cancelGeneralTask:", e);
    showMessage(authMessage, `حدث خطأ: ${e.message}`, "error");
  }
}
export async function reviewTask({
  db,
  studentCode,
  taskId,
  action,
  showMessage,
  authMessage
}) {
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;

    const student = snap.data();
    const tasks = Array.isArray(student.tasks) ? student.tasks : [];
    const i = tasks.findIndex((t) => t.id === taskId);

    if (i === -1) {
      showMessage(authMessage, "المهمة غير موجودة.", "error");
      return;
    }

    const task = tasks[i];
    if (task.status !== "pending" && task.status !== "pending_assistant") {
      showMessage(authMessage, "المهمة ليست بانتظار المراجعة.", "error");
      return;
    }

    if (action === "approve") {
      // 1) نقاط
      student.total_points = (student.total_points || 0) + (task.points || 0);

      // 2) تحديث التقدم حسب نوع المهمة
      if (task.type === "hifz_flexible") {
        const approvedEnd = {
          surah: Number.isFinite(task.flex_surah_number) ? task.flex_surah_number : null,
          surah_name: task.flex_surah_name_ar || "",
          ayah: Number.isFinite(task.flex_end_ayah) ? task.flex_end_ayah : null,
        };
        if (hasExternalCurriculumRuntime() && student.hifz_current_phase_id) {
          const approvedState = getFlexibleApprovedExternalHifzState(student, approvedEnd);
          if (!approvedState) {
            showMessage(authMessage, "تعذر تحديث المنهج المرن داخل المرحلية الحالية.", "error");
            return;
          }

          student.hifz_mode = approvedState.hifz_mode;
          student.last_approved_hifz_end = approvedState.last_approved_hifz_end;
          student.flexible_start = approvedState.flexible_start;
          student.flex_surah_number = approvedState.flex_surah_number;
          student.flex_next_ayah = approvedState.flex_next_ayah;
          student.hifz_progress = approvedState.hifz_progress;
          student.hifz_status = approvedState.hifz_status;
          student.hifz_pending_phase_id = approvedState.hifz_pending_phase_id;
          student.hifz_current_phase_id = approvedState.hifz_current_phase_id;
          student.hifz_current_track_id = approvedState.hifz_current_track_id;
          student.last_completed_hifz_unit_id = approvedState.last_completed_hifz_unit_id;
          student.last_completed_hifz_surah = approvedState.last_completed_hifz_surah;
        } else {
          const surahIdx = Number.isFinite(task.flex_surah_index) ? task.flex_surah_index : 0;
          const surah = FLEXIBLE_HIFZ[surahIdx];

          if (!surah) {
            showMessage(authMessage, "بيانات السورة غير موجودة في FLEXIBLE_HIFZ", "error");
            return;
          }

          const safeApprovedEnd = {
            surah: Number.isFinite(task.flex_surah_number) ? task.flex_surah_number : surah.surah_number,
            surah_name: task.flex_surah_name_ar || surah.surah_name_ar || "",
            ayah: Number.isFinite(task.flex_end_ayah) ? task.flex_end_ayah : (surah.start_ayah || 1),
          };
          const nextStart = getNextAyahPosition(safeApprovedEnd) || safeApprovedEnd;

          student.hifz_mode = "flexible";
          student.last_approved_hifz_end = safeApprovedEnd;
          student.flexible_start = nextStart;
          student.flex_surah_index = nextStart.surah === safeApprovedEnd.surah ? surahIdx : (surahIdx + 1);
          student.flex_surah_number = nextStart.surah;
          student.flex_next_ayah = nextStart.ayah;
        }

      } else if (task.type === "hifz") {
        const last = task.mission_last ?? task.mission_start ?? 0;
        if (hasExternalCurriculumRuntime()) {
          const approvedState = getApprovedExternalHifzState(student, {
            startIndex: task.mission_start ?? 0,
            lastIndex: last,
          });

          if (approvedState) {
            student.hifz_progress = approvedState.hifz_progress;
            student.hifz_status = approvedState.hifz_status;
            student.hifz_pending_phase_id = approvedState.hifz_pending_phase_id;
            student.hifz_current_track_id = approvedState.hifz_current_track_id;
            student.hifz_current_phase_id = approvedState.hifz_current_phase_id;
            student.last_completed_hifz_unit_id = approvedState.last_completed_hifz_unit_id;
            student.last_completed_hifz_surah = approvedState.last_completed_hifz_surah;
          } else {
            student.hifz_progress = last + 1;
          }
        } else {
          student.hifz_progress = last + 1;
        }

      } else if (task.type === "murajaa") {
        const level = student.murajaa_level || task.murajaa_level || "BUILDING";
        const arr = getReviewArrayForLevel(level);
        const len = arr.length;

        let start = student.murajaa_start_index ?? task.murajaa_index ?? 0;
        start = len ? ((start % len) + len) % len : 0;

        let cur = student.murajaa_progress_index ?? task.murajaa_index ?? start;
        cur = len ? ((cur % len) + len) % len : start;

        let next = len ? (cur + 1) % len : start;
        let cycles = student.murajaa_cycles || 0;

        if (len && next === start) {
          cycles += 1;

          const lastFullSurahNumber = getLastFullSurahNumber(student);
          const dynamicStart = chooseMurajaaStartIndexFromLastSurah(
            level,
            lastFullSurahNumber,
            start
          );

          start = dynamicStart;
          next = dynamicStart;
        }

        student.murajaa_level = level;
        student.murajaa_start_index = start;
        student.murajaa_progress_index = next;
        student.murajaa_cycles = cycles;
      }

      // 3) اعتماد المهمة
      const completedAt = Date.now();
      tasks[i].status = "completed";
      tasks[i].completed_at = completedAt;
      delete tasks[i].assistant_type;
      delete tasks[i].assistant_code;

      if (["hifz", "hifz_flexible", "murajaa"].includes(task.type)) {
        try {
          const dailyStreakProgramRef = doc(db, "programs", "daily_streak_1");
          const dailyStreakProgramSnap = await getDoc(dailyStreakProgramRef);
          const dailyStreakProgram = dailyStreakProgramSnap.exists() ? dailyStreakProgramSnap.data() : null;
          const isDailyStreakEnabled = String(dailyStreakProgram?.status || "").trim().toLowerCase() === "active";

          if (isDailyStreakEnabled) {
            const todayDateKey = buildRiyadhDateKey(completedAt);
            const programParticipation = student.program_participation && typeof student.program_participation === "object"
              ? student.program_participation
              : {};
            const dailyStreakParticipation = programParticipation.daily_streak_1
              && typeof programParticipation.daily_streak_1 === "object"
              ? programParticipation.daily_streak_1
              : {};
            const rawCompletedDateKeys = dailyStreakParticipation.completed_date_keys;
            const completedDateKeys = Array.isArray(rawCompletedDateKeys)
              ? rawCompletedDateKeys.reduce((dateKeyMap, dateKey) => {
                if (typeof dateKey === "string" && dateKey.trim()) {
                  dateKeyMap[dateKey] = true;
                }
                return dateKeyMap;
              }, {})
              : rawCompletedDateKeys && typeof rawCompletedDateKeys === "object"
              ? { ...rawCompletedDateKeys }
              : {};

            completedDateKeys[todayDateKey] = true;

            student.program_participation = {
              ...programParticipation,
              daily_streak_1: {
                ...dailyStreakParticipation,
                completed_date_keys: completedDateKeys,
              },
            };
          }
        } catch (streakError) {
          console.warn("Daily streak recording skipped:", streakError);
        }
      }

      // 4) حفظ
      const submissionRef = doc(db, "task_submissions", task.id);
      const reviewedAt = Date.now();
      const batch = writeBatch(db);
      batch.update(studentRef, {
        tasks,
        total_points: student.total_points,
        program_participation: student.program_participation ?? {},

        // الثابت
        hifz_start_id: student.hifz_start_id ?? 0,
        hifz_end_id: student.hifz_end_id ?? HIFZ_CURRICULUM.length - 1,
        hifz_progress: student.hifz_progress ?? 0,
        hifz_level: student.hifz_level ?? 1,
        hifz_status: student.hifz_status || HIFZ_ACTIVE_STATUS,
        hifz_pending_phase_id: student.hifz_pending_phase_id ?? null,
        hifz_current_track_id: student.hifz_current_track_id ?? null,
        hifz_current_phase_id: student.hifz_current_phase_id ?? null,
        last_completed_hifz_unit_id: student.last_completed_hifz_unit_id ?? null,
        last_completed_hifz_surah: student.last_completed_hifz_surah ?? null,

        // المرن (النظام الجديد)
        hifz_mode: student.hifz_mode || "fixed",
        flex_surah_index: student.flex_surah_index ?? 0,
        flex_next_ayah: student.flex_next_ayah ?? 1,
        flex_surah_number: student.flex_surah_number ?? null,
        flexible_start: student.flexible_start ?? null,
        flexible_plan_start: student.flexible_plan_start ?? null,
        last_approved_hifz_end: student.last_approved_hifz_end ?? null,

        // المراجعة
        murajaa_level: student.murajaa_level || "BUILDING",
        murajaa_start_index: student.murajaa_start_index ?? 0,
        murajaa_progress_index: student.murajaa_progress_index ?? 0,
        murajaa_cycles: student.murajaa_cycles || 0,
      });
      batch.update(submissionRef, {
        status: "approved",
        completed_at: completedAt,
        reviewed_at: reviewedAt,
      });
      await batch.commit();
      invalidateStudentsSnapshotCache();

      showMessage(
        authMessage,
        `تم قبول المهمة وإضافة ${task.points} نقطة للطالب ${student.name}.`,
        "success"
      );

    } else {
      // رفض
      if (task.type === "general") {
        tasks[i].status = "assigned";
        delete tasks[i].assistant_type;
        delete tasks[i].assistant_code;
      } else {
        tasks.splice(i, 1);
      }

      const submissionRef = doc(db, "task_submissions", task.id);
      const batch = writeBatch(db);
      batch.update(studentRef, { tasks });
      batch.update(submissionRef, {
        status: "rejected",
        reviewed_at: Date.now(),
      });
      await batch.commit();
      invalidateStudentsSnapshotCache();
      showMessage(authMessage, `تم رفض المهمة وإعادتها للطالب ${student.name}.`, "info");
    }

  } catch (e) {
    console.error("Error reviewTask:", e);
    showMessage(authMessage, `خطأ في مراجعة المهمة: ${e.message}`, "error");
  }
}

export async function nominateStudentHifzForTest({
  db,
  studentCode,
  showMessage,
  authMessage,
}) {
  try {
    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;

    const student = snap.data();
    const nextPhase = hasExternalCurriculumRuntime()
      ? getPhaseForProgressIndex(student.hifz_progress ?? 0)
      : null;

    await updateDoc(studentRef, {
      hifz_status: HIFZ_NOMINATED_FOR_TEST_STATUS,
      hifz_pending_phase_id: student.hifz_pending_phase_id ?? null,
      hifz_current_phase_id: nextPhase?.id || student.hifz_current_phase_id || null,
      hifz_current_track_id: nextPhase?.track_id || student.hifz_current_track_id || null,
      hifz_test_destination: "director",
      hifz_test_nominated_at: Date.now(),
    });
    invalidateStudentsSnapshotCache();

    showMessage(authMessage, `تم اعتماد اختبار المرحلة للطالب ${student.name}.`, "success");
  } catch (e) {
    console.error("Error nominateStudentHifzForTest:", e);
    showMessage(authMessage, `خطأ في اعتماد اختبار المرحلة: ${e.message}`, "error");
  }
}

export async function approveStudentHifzPhaseTest({
  db,
  studentCode,
  score,
  passed,
  showMessage,
  authMessage,
}) {
  try {
    const normalizedScore = Number(score);
    if (!Number.isFinite(normalizedScore) || normalizedScore < 0 || normalizedScore > 100) {
      showMessage(authMessage, "أدخل درجة صحيحة بين 0 و100.", "error");
      return;
    }

    const studentRef = doc(db, "students", studentCode);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;

    const student = snap.data();
    if (student.hifz_status !== HIFZ_NOMINATED_FOR_TEST_STATUS) {
      showMessage(authMessage, "الطالب ليس ضمن مسار اختبار نشط.", "error");
      return;
    }

    const resumedPhase = passed && hasExternalCurriculumRuntime()
      ? getPhaseForProgressIndex(student.hifz_progress ?? 0)
      : null;
    const resumedPhaseRange = passed && resumedPhase
      ? getPhaseUnitRange(resumedPhase.id)
      : null;
    const resumedStartUnit = resumedPhaseRange?.startUnit || null;
    const resumedEndUnit = resumedPhaseRange?.endUnit || null;

    await updateDoc(studentRef, {
      hifz_status: passed ? HIFZ_ACTIVE_STATUS : HIFZ_TEST_FAILED_STATUS,
      hifz_pending_phase_id: passed ? null : (student.hifz_pending_phase_id ?? null),
      hifz_current_phase_id: passed
        ? (resumedPhase?.id || null)
        : (student.hifz_current_phase_id ?? null),
      hifz_current_track_id: passed
        ? (resumedPhase?.track_id || null)
        : (student.hifz_current_track_id ?? null),
      hifz_start_id: passed
        ? (resumedStartUnit?.index ?? student.hifz_start_id ?? 0)
        : (student.hifz_start_id ?? 0),
      hifz_end_id: passed
        ? (resumedEndUnit?.index ?? student.hifz_end_id ?? 0)
        : (student.hifz_end_id ?? 0),
      hifz_test_score: normalizedScore,
      hifz_test_passed: Boolean(passed),
      hifz_test_recorded_at: Date.now(),
      hifz_test_destination: passed ? null : (student.hifz_test_destination || "director"),
    });
    invalidateStudentsSnapshotCache();

    showMessage(
      authMessage,
      passed
        ? `تم اعتماد نتيجة الاختبار وفتح الانتقال للمرحلة التالية للطالب ${student.name}.`
        : `تم تسجيل رسوب الطالب ${student.name} في اختبار المرحلة.`,
      passed ? "success" : "info"
    );
  } catch (e) {
    console.error("Error approveStudentHifzPhaseTest:", e);
    showMessage(authMessage, `خطأ في تسجيل نتيجة الاختبار: ${e.message}`, "error");
  }
}



