// app.js
// =====================================================
// 1) Firebase + المناهج (Curriculum)
// =====================================================
import { testMessage } from "./core/test.js";

testMessage();
import { computeHifzPercent } from "./core/progress.js";
import { computeMurajaaPercent } from "./core/progress.js";
import {
  getCurrentMurajaaMission,
  getNextMurajaaMission,
  getCurrentHifzMission,
  getNextHifzMission
} from "./core/missions.js";
import { renderStudentTasks } from "./ui/studentView.js";
import {
  submitCurriculumTask,
  cancelCurriculumTask,
  submitMurajaaTask,
  cancelMurajaaTask,
  submitFlexibleHifzTask,
  submitGeneralTask,
  cancelGeneralTask,
  nominateStudentHifzForTest,
  approveStudentHifzPhaseTest,
} from "./core/actions.js";

import { reviewTask } from "./core/actions.js";
import { loadPendingTasksForReview } from "./ui/teacherView.js";
import { displayStudentDashboard } from "./ui/studentView.js";
import { loadAssistantTasksForCurrentUser } from "./ui/teacherView.js";
import { renderAssistantTasksList } from "./ui/teacherView.js";
import { displayAssistantDashboard } from "./ui/assistantView.js";
import { displayDirectorDashboard } from "./ui/directorView.js";
import { CONFIG, HALAQA_LOGIN_CODES } from "./app/config.js";
import { createAppDom, getStudentElsFromDom } from "./app/bootstrap/dom.js";
import { createRoleRouter } from "./app/bootstrap/role-router.js";
import { createAuthFlow } from "./app/bootstrap/auth-flow.js";
import {
  safeSetText,
  showMessage,
  hideElements,
  generateUniqueId,
} from "./app/ui-utils.js";
import {
  getWeekStart as getWeekStartFromUtils,
  buildWeekStripHtml as buildWeekStripHtmlFromUtils,
} from "./app/week-utils.js";
import { buildGroupedRanks as buildGroupedRanksFromUtils } from "./app/ranking-utils.js";
import {
  DEFAULT_HALAQA,
  getHalaqaDisplayLabel as getHalaqaDisplayLabelFromUtils,
  getStudentHalaqa,
  isStudentInHalaqa,
  normalizeHalaqaCode,
} from "./app/halaqa-utils.js";
import { ROLES, isStudentUser } from "./app/permissions.js";
import {
  getReviewArrayForLevel as getReviewArrayForLevelFromHelpers,
  getLastFullSurahNumber as getLastFullSurahNumberFromHelpers,
  chooseMurajaaStartIndexFromLastSurah as chooseMurajaaStartIndexFromLastSurahFromHelpers,
} from "./modules/curriculum/curriculum-helpers.js";
import {
  hasExternalCurriculumRuntime,
  getAllCurriculumHifzUnits,
  getCurriculumUnitAt,
  getCurriculumUnitById,
  getPhaseForProgressIndex,
  getExternalHifzPlanBounds,
  getExternalHifzCurriculumGroups,
  resolveCurriculumPlanFromPhaseStart,
  HIFZ_ACTIVE_STATUS,
} from "./modules/curriculum/curriculum-runtime.js";
import { normalizeStudentsByHalaqa } from "./modules/halaqas/halaqa.selectors.js";
import { fetchAllHalaqasSnapshot, fetchHalaqasForTeacher } from "./modules/halaqas/halaqas.service.js";
import { db } from "./firebase/client.js";
import { resolveLoginContext } from "./modules/auth/auth.service.js";
import {
  fetchAllStudentsSnapshot as fetchAllStudentsSnapshotFromService,
  fetchStudentByCode as fetchStudentByCodeFromService,
  fetchAllStudentsSortedByPoints as fetchAllStudentsSortedByPointsFromService,
  fetchStudentsForHalaqa as fetchStudentsForHalaqaFromService,
  fetchStudentsSortedByPointsForHalaqa as fetchStudentsSortedByPointsForHalaqaFromService,
  invalidateStudentsSnapshotCache,
} from "./modules/students/students.service.js";
import { fetchTeacherByCode } from "./modules/teachers/teachers.service.js";
import {
  assignTaskToStudent,
  assignTaskToHalaqa,
} from "./modules/tasks/tasks.service.js";
import { buildAssignedTask } from "./modules/tasks/task-factory.js";
import { getDataIntegrityReport } from "./modules/reports/data-integrity.report.js";

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

import { HIFZ_CURRICULUM, REVIEW_CURRICULUM, FLEXIBLE_HIFZ, FLEXIBLE_POINTS } from "./data/curriculum.js";
// =====================================================
// Firebase Setup
// =====================================================

// =====================================================
// DOM Elements
// =====================================================
const dom = createAppDom();
const {
  authScreen,
  userCodeInput,
  loginButton,
  authMessage,
  tabButtons,
  halaqaOnsiteBtn,
  halaqaOnlineBtn,
  studentScreen,
  welcomeStudent,
  studentPlanStrip,
  stripPlan,
  stripPoints,
  stripRank,
  studentPlanLine,
  studentHifzNextLabel,
  studentMurajaaNextLabel,
  studentHifzProgressLabel,
  studentMurajaaProgressLabel,
  studentHifzProgressBar,
  studentMurajaaProgressBar,
  studentHifzProgressPercent,
  studentMurajaaProgressPercent,
  studentMurajaaLevelLabel,
  studentTotalPoints,
  studentRankText,
  studentTasksDiv,
  logoutButtonStudent,
  refreshStudentButton,
  studentWeekStrip,
  studentMainTasksSection,
  studentAssistantTabSection,
  studentTabButtons,
  studentAssistantTasksList,
  teacherScreen,
  logoutButtonTeacher,
  refreshTeacherButton,
  teacherHalaqaToggle,
  initialTeacherHalaqaToggleHtml,
  assignTaskStudentCode,
  assignTaskType,
  assignTaskDescription,
  assignTaskPoints,
  assignIndividualTaskButton,
  assignGroupTaskButton,
  assignTaskMessage,
  studentList,
  studentFormTitle,
  newStudentCodeInput,
  newStudentNameInput,
  newStudentParentNameInput,
  newStudentParentCodeInput,
  newStudentHifzStart,
  newStudentHifzEnd,
  newStudentHifzLevel,
  newStudentMurajaaLevel,
  newStudentMurajaaStart,
  newStudentHalaqa,
  registerStudentButton,
  registerStudentMessage,
  newStudentHifzType,
  newStudentFlexibleSurah,
  fixedHifzGroup,
  flexibleSurahGroup,
  STUDENT_HIFZ_PHASE_SELECT_ID,
  STUDENT_FLEXIBLE_AYAH_SELECT_ID,
  btnOpenStudentForm,
  btnCloseStudentForm,
  studentFormWrapper,
  halaqaSegment,
  hifzCurriculumDisplay,
  murajaaCurriculumDisplay,
  pendingTasksList,
  honorBoardDiv,
  parentScreen,
  welcomeParent,
  logoutButtonParent,
  parentChildrenList,
  halaqaScreen,
  halaqaTitle,
  halaqaSubtitle,
  halaqaBackButton,
  halaqaStudentsGrid,
} = dom;
// =====================================================
// Global State
// =====================================================
let currentUser = null;
let editingStudentCode = null;
let currentTeacherHalaqas = [];

// =====================================================
// ✅ Student Form (Open/Close) + Halaqa Segment
// =====================================================

function openStudentForm() {
  studentFormWrapper?.classList.remove("hidden");
  btnOpenStudentForm?.classList.add("hidden");
  btnCloseStudentForm?.classList.remove("hidden");

  // افتح كل الأقسام (details)
  studentFormWrapper?.querySelectorAll("details.form-section")
    .forEach(d => d.open = true);
}

function closeStudentForm() {
  studentFormWrapper?.classList.add("hidden");
  btnOpenStudentForm?.classList.remove("hidden");
  btnCloseStudentForm?.classList.add("hidden");
}

function setHalaqaSegment(value) {
  const v = normalizeHalaqaCode(value || "") || "";
  if (newStudentHalaqa) newStudentHalaqa.value = v;

  halaqaSegment?.querySelectorAll(".seg-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.value === v);
  });
}

function buildStudentFormHalaqaOptions(halaqas = []) {
  const optionsMap = new Map();

  halaqas.forEach((halaqa) => {
    const code = normalizeHalaqaCode(halaqa?.code || halaqa?.id || halaqa?.halaqa);
    if (!code) return;

    optionsMap.set(code, {
      code,
      label: String(halaqa?.label || halaqa?.name || getHalaqaDisplayLabelFromUtils(code)).trim(),
    });
  });

  return [...optionsMap.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function getTeacherScopedStudentFormHalaqas() {
  if (currentUser?.role !== ROLES.TEACHER) {
    return [];
  }

  if (Array.isArray(currentTeacherHalaqas) && currentTeacherHalaqas.length) {
    return currentTeacherHalaqas;
  }

  return [];
}

function getStudentFormAllowedHalaqaOptions(allHalaqas = []) {
  if (currentUser?.role === ROLES.TEACHER) {
    const teacherScopedHalaqas = getTeacherScopedStudentFormHalaqas();
    if (teacherScopedHalaqas.length) {
      return buildStudentFormHalaqaOptions(teacherScopedHalaqas);
    }

    const fallbackTeacherHalaqa = normalizeHalaqaCode(currentUser?.halaqa);
    if (!fallbackTeacherHalaqa) {
      return [];
    }

    return buildStudentFormHalaqaOptions(
      allHalaqas.filter((halaqa) => normalizeHalaqaCode(halaqa?.code || halaqa?.id) === fallbackTeacherHalaqa)
    );
  }

  return buildStudentFormHalaqaOptions(allHalaqas);
}

function getDefaultStudentFormHalaqaCode(options = []) {
  if (currentUser?.role === ROLES.TEACHER) {
    const currentTeacherHalaqaCode = normalizeHalaqaCode(currentHalaqa);
    if (currentTeacherHalaqaCode && options.some((option) => option.code === currentTeacherHalaqaCode)) {
      return currentTeacherHalaqaCode;
    }

    const fallbackTeacherHalaqa = normalizeHalaqaCode(currentUser?.halaqa);
    if (fallbackTeacherHalaqa && options.some((option) => option.code === fallbackTeacherHalaqa)) {
      return fallbackTeacherHalaqa;
    }
  }

  return options[0]?.code || "";
}

function canCurrentTeacherManageStudentHalaqa(halaqaCode) {
  if (currentUser?.role !== ROLES.TEACHER) {
    return true;
  }

  const normalizedTarget = normalizeHalaqaCode(halaqaCode);
  const teacherScopedHalaqas = getTeacherScopedStudentFormHalaqas().map((halaqa) =>
    normalizeHalaqaCode(halaqa?.code || halaqa?.id || halaqa?.halaqa)
  );

  if (!teacherScopedHalaqas.length) {
    const fallbackTeacherHalaqa = normalizeHalaqaCode(currentUser?.halaqa);
    return Boolean(fallbackTeacherHalaqa) && fallbackTeacherHalaqa === normalizedTarget;
  }

  return teacherScopedHalaqas.includes(normalizedTarget);
}

function renderStudentFormHalaqaOptions(options = []) {
  if (newStudentHalaqa) {
    newStudentHalaqa.innerHTML = options
      .map((option) => `<option value="${option.code}">${option.label}</option>`)
      .join("");
  }

  if (halaqaSegment) {
    halaqaSegment.innerHTML = options
      .map((option, index) => `
        <button
          type="button"
          class="halaqa-btn seg-btn${index === 0 ? " active" : ""}"
          data-value="${option.code}"
        >
          ${option.label}
        </button>
      `)
      .join("");
  }
}

async function populateStudentHalaqaOptions() {
  let options = [];

  try {
    const halaqas = await fetchAllHalaqasSnapshot(db);
    options = getStudentFormAllowedHalaqaOptions(halaqas);
    renderStudentFormHalaqaOptions(options);
  } catch (error) {
    console.error("Error populateStudentHalaqaOptions:", error);
    options = [];
    renderStudentFormHalaqaOptions(options);
  }

  setHalaqaSegment(newStudentHalaqa?.value || getDefaultStudentFormHalaqaCode(options));
}

// زر + إضافة طالب
btnOpenStudentForm?.addEventListener("click", async () => {
  editingStudentCode = null;
  if (studentFormTitle) studentFormTitle.textContent = "إضافة طالب";
  await ensureStudentFormOptionsReady();
  setHalaqaSegment(getDefaultStudentFormHalaqaCode(getStudentFormAllowedHalaqaOptions()));
  openStudentForm();
});

// زر إغلاق
btnCloseStudentForm?.addEventListener("click", closeStudentForm);

// اختيار نوع الحلقة (حضوري/إلكتروني)
halaqaSegment?.addEventListener("click", (e) => {
  const b = e.target.closest(".seg-btn");
  if (!b) return;

  halaqaSegment.querySelectorAll(".seg-btn").forEach(x => x.classList.remove("active"));
  b.classList.add("active");

  if (newStudentHalaqa) newStudentHalaqa.value = b.dataset.value; // ONSITE / ONLINE
});


let currentHalaqa = DEFAULT_HALAQA;
const TEACHER_REVIEW_TAB_ID = "review-tasks-tab";
const TEACHER_MANAGE_STUDENTS_TAB_ID = "manage-students-tab";
const TEACHER_CURRICULUM_TAB_ID = "curriculum-tab";
const STUDENT_MAIN_TAB_ID = "student-main-tasks";
const STUDENT_ASSISTANT_TAB_ID = "student-assistant-tab";

let lastStudentEntrySource = null; // DIRECT / HALAQA / null
let lastHalaqaLoginCode = null;
let lastHalaqaType = null;

const roleRouter = createRoleRouter({
  dom,
  db,
  hideElements,
  showMessage,
  authMessage,
  displayStudentDashboard,
  displayAssistantDashboard,
  displayDirectorDashboard,
  displayHalaqaScreen,
  displayParentDashboard,
  initializeTeacherHalaqaState,
  updateHalaqaToggleUI,
  refreshTeacherView,
  approveStudentHifzPhaseTest,
  getStudentByCode,
  buildStudentDashboardParams,
  directorDashboardParams: () => ({
    db,
    approveStudentHifzPhaseTest,
    showMessage,
    authMessage,
  }),
  getLogout: () => logout,
  ROLES,
  getCurrentUser: () => currentUser,
  setCurrentUser: (value) => {
    currentUser = value;
  },
  getCurrentHalaqa: () => currentHalaqa,
  setCurrentHalaqa: (value) => {
    currentHalaqa = value;
  },
  getLastStudentEntrySource: () => lastStudentEntrySource,
  setLastStudentEntrySource: (value) => {
    lastStudentEntrySource = value;
  },
  getLastHalaqaLoginCode: () => lastHalaqaLoginCode,
  setLastHalaqaLoginCode: (value) => {
    lastHalaqaLoginCode = value;
  },
  getLastHalaqaType: () => lastHalaqaType,
  setLastHalaqaType: (value) => {
    lastHalaqaType = value;
  },
});

const {
  hideAllScreens,
  goToAuthScreen,
  openStudentDashboard,
  openStudentDashboardFromContext,
  openTeacherDashboard,
  openDirectorDashboard,
  openAssistantDashboard,
  openHalaqaDashboard,
  openParentDashboard,
  buildStudentUserSession,
  applyStudentUserSession,
  buildOpenStudentDashboardForUserContext,
  openStudentDashboardForUser,
  showStudentNotFoundMessage,
  alertStudentOpenError,
  handleHalaqaLoginContext,
  handleTeacherLoginContext,
  handleDirectorLoginContext,
  handleAssistantLoginContext,
  handleParentLoginContext,
  handleNotFoundLoginContext,
  handleStudentLoginContext,
} = roleRouter;

const authFlow = createAuthFlow({
  dom,
  showMessage,
  authMessage,
  resolveAppLoginContext,
  handleHalaqaLoginContext,
  handleTeacherLoginContext,
  handleDirectorLoginContext,
  handleAssistantLoginContext,
  handleParentLoginContext,
  handleNotFoundLoginContext,
  handleStudentLoginContext,
  getCurrentUser: () => currentUser,
  isStudentUser,
  getLastStudentEntrySource: () => lastStudentEntrySource,
  getLastHalaqaLoginCode: () => lastHalaqaLoginCode,
  getLastHalaqaType: () => lastHalaqaType,
  clearCurrentSession,
  hideAllScreens,
  displayHalaqaScreen,
  goToAuthScreen,
});

const { bindLoginButton, logout, bindLogoutButtons } = authFlow;

// =====================================================
// 4) أدوات مساعدة عامة (Helpers)
// =====================================================

const getStudentEls = () => getStudentElsFromDom(dom);
// =====================================================
// Helpers
// =====================================================

const getReviewArrayForLevel = (level) => getReviewArrayForLevelFromHelpers(level);

// بداية الأسبوع (الأحد)
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 أحد
  d.setDate(d.getDate() - day);
  return d;
}

// شريط التزام الأسبوع (أحد-خميس) — HTML جاهز
function buildWeekStripHtml(tasks) {
  const weekStart = getWeekStart(new Date());

  const daysMeta = [
    { offset: 0, label: "احد" },
    { offset: 1, label: "اثنين" },
    { offset: 2, label: "ثلاثاء" },
    { offset: 3, label: "اربعاء" },
    { offset: 4, label: "خميس" },
  ];

  return daysMeta
    .map(({ offset, label }) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + offset);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const hasCompleted = (Array.isArray(tasks) ? tasks : []).some((t) => {
        if (t.status !== "completed" || !t.completed_at) return false;
        const ts = t.completed_at;
        return ts >= dayStart.getTime() && ts <= dayEnd.getTime();
      });

      const cls = hasCompleted ? "week-day done" : "week-day";
      const icon = hasCompleted ? "✔" : "•";

      return `
        <div class="${cls}">
          <span class="week-day-label">${label}</span>
          <span class="week-day-icon">${icon}</span>
        </div>
      `;
    })
    .join("");
}

// رسم شريط الأسبوع في واجهة الطالب
function renderStudentWeekStrip(student) {
  if (!studentWeekStrip) return;
  const tasks = Array.isArray(student.tasks) ? student.tasks : [];
  studentWeekStrip.innerHTML = buildWeekStripHtmlFromUtils(tasks);
}

/** جلب جميع الطلاب مرتبين بالنقاط مع فلتر اختياري */
async function getStudentsSortedByPoints(filterFn) {
  return fetchAllStudentsSortedByPointsFromService(db, filterFn);
}

function isInCurrentHalaqa(student) {
  return isStudentInHalaqa(student, currentHalaqa);
}

function buildTeacherHalaqaDisplayName(halaqa) {
  return String(halaqa?.name || halaqa?.label || halaqa?.code || "").trim();
}



function renderTeacherHalaqaTabs() {
  if (!teacherHalaqaToggle) return;

  if (currentTeacherHalaqas.length <= 1) {
    teacherHalaqaToggle.classList.add("hidden");
    return;
  }

  teacherHalaqaToggle.classList.remove("hidden");
  teacherHalaqaToggle.innerHTML = "";

  currentTeacherHalaqas.forEach((halaqa) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "halaqa-btn";
    button.dataset.halaqaValue = halaqa.code;
    button.textContent = buildTeacherHalaqaDisplayName(halaqa);
    teacherHalaqaToggle.appendChild(button);
  });
}

function updateHalaqaToggleUI() {
  if (teacherHalaqaToggle) {
    teacherHalaqaToggle.querySelectorAll(".halaqa-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.halaqaValue === currentHalaqa);
    });
  }
}

function setCurrentHalaqa(halaqa) {
  currentHalaqa = halaqa;
  updateHalaqaToggleUI();
  refreshTeacherView();
}

async function initializeTeacherHalaqaState() {
  const teacherCode = String(currentUser?.code || "").trim();
  if (!teacherCode) return;

  try {
    const halaqas = await fetchHalaqasForTeacher(db, teacherCode);
    currentTeacherHalaqas = halaqas;

    if (halaqas.length > 1) {
      const hasCurrent = halaqas.some((halaqa) => halaqa.code === currentHalaqa);
      currentHalaqa = hasCurrent ? currentHalaqa : halaqas[0].code;
      renderTeacherHalaqaTabs();
      updateHalaqaToggleUI();
      return;
    }

    if (halaqas.length === 1) {
      currentHalaqa = halaqas[0].code;
      renderTeacherHalaqaTabs();
      updateHalaqaToggleUI();
      return;
    }
  } catch (error) {
    console.error("Error initializeTeacherHalaqaState:", error);
  }

  currentTeacherHalaqas = [];
  if (teacherHalaqaToggle) {
    teacherHalaqaToggle.innerHTML = "";
    teacherHalaqaToggle.classList.add("hidden");
  }
  updateHalaqaToggleUI();
}

function computeRankMapForGroup(students) {
  const sorted = [...students].sort(
    (a, b) => (b.total_points || 0) - (a.total_points || 0)
  );
  const rankMap = {};
  let lastPts = null;
  let currentRank = 0;

  sorted.forEach((s, i) => {
    const pts = s.total_points || 0;
    if (lastPts === null) currentRank = 1;
    else if (pts < lastPts) currentRank = i + 1;
    rankMap[s.code] = currentRank;
    lastPts = pts;
  });

  return { sorted, rankMap };
}

function buildGroupedRanks(students) {
  const building = [];
  const devAdv = [];

  students.forEach((s) => {
    const level = s.murajaa_level || "BUILDING";
    if (level === "BUILDING") building.push(s);
    else devAdv.push(s);
  });

  const { sorted: buildingSorted, rankMap: buildingRankMap } =
    computeRankMapForGroup(building);
  const { sorted: devAdvSorted, rankMap: devAdvRankMap } =
    computeRankMapForGroup(devAdv);

  return { buildingSorted, buildingRankMap, devAdvSorted, devAdvRankMap };
}

function updatePlanStrip({ startSurah = "—", endSurah = "—", points = 0, rank = "—" }) {
  if (studentPlanLine) {
    studentPlanLine.textContent = `الخطة: من ${startSurah} إلى ${endSurah} • النقاط: ${points} • الترتيب: ${rank}`;
  }
  safeSetText(stripPlan, `الخطة: من ${startSurah} إلى ${endSurah}`);
  safeSetText(stripPoints, `النقاط: ${points}`);
  safeSetText(stripRank, `الترتيب: ${rank}`);
}

// =====================================================
// 5) منهج الحفظ والمراجعة (Missions / Percent)
// =====================================================


const getLastFullSurahNumber = (student) => getLastFullSurahNumberFromHelpers(student);

const chooseMurajaaStartIndexFromLastSurah = (level, lastSurahNumber, fallbackStart) =>
  chooseMurajaaStartIndexFromLastSurahFromHelpers(level, lastSurahNumber, fallbackStart);

// =====================================================
// 6) مهام المساعد (Student/Parent Assistants)
// =====================================================

// =====================================================
// 7) بناء كروت الطالب (Student Tasks Cards)
// =====================================================

// =====================================================
// 8) لوحات الطالب / ولي الأمر / الحلقة
// =====================================================

function getHalaqaDisplayLabel(halaqaType) {
  return getHalaqaDisplayLabelFromUtils(halaqaType);
}

function buildRanksByHalaqa(students) {
  const halaqaBuckets = normalizeStudentsByHalaqa(students);

  const ranksByHalaqa = {};
  Object.keys(halaqaBuckets).forEach((halaqa) => {
    const studentsInHalaqa = halaqaBuckets[halaqa];
    if (!studentsInHalaqa.length) return;
    ranksByHalaqa[halaqa] = buildGroupedRanksFromUtils(studentsInHalaqa);
  });

  return ranksByHalaqa;
}

function getParentChildRankDetails(student, ranksByHalaqa) {
  const halaqa = getStudentHalaqa(student);
  const { buildingRankMap = {}, devAdvRankMap = {} } = ranksByHalaqa[halaqa] || {};

  if ((student.murajaa_level || "BUILDING") === "BUILDING") {
    return {
      groupTitle: "مجموعة البناء (نفس الحلقة)",
      childRank: buildingRankMap[student.code] != null ? String(buildingRankMap[student.code]) : "-",
      halaqa,
    };
  }

  return {
    groupTitle: "مجموعة التطوير/المتقدم (نفس الحلقة)",
    childRank: devAdvRankMap[student.code] != null ? String(devAdvRankMap[student.code]) : "-",
    halaqa,
  };
}

function getStudentPlanSurahNames(student) {
  if (hasExternalCurriculumRuntime()) {
    const bounds = getExternalHifzPlanBounds(student);
    return {
      startSurah: bounds.startLabel || "غير محددة",
      endSurah: bounds.endLabel || "غير محددة",
    };
  }

  const startIndex = Number.isFinite(student.hifz_start_id) ? student.hifz_start_id : 0;
  const endIndex = Number.isFinite(student.hifz_end_id) ? student.hifz_end_id : HIFZ_CURRICULUM.length - 1;
  const startItem = HIFZ_CURRICULUM[startIndex] || null;
  const endItem = HIFZ_CURRICULUM[endIndex] || null;

  return {
    startSurah: startItem ? startItem.surah_name_ar : "غير محددة",
    endSurah: endItem ? endItem.surah_name_ar : "غير محددة",
  };
}

function getStudentMotivationText(hifzPercent) {
  let motivation = "🔵 في بداية الطريق";
  if (hifzPercent >= 75) motivation = "🟢 قارب على إنهاء خطته";
  else if (hifzPercent >= 30) motivation = "🟠 في منتصف الخطة";
  return motivation;
}

function createParentChildCard(student, ranksByHalaqa) {
  const { groupTitle, childRank, halaqa } = getParentChildRankDetails(student, ranksByHalaqa);
  const { startSurah, endSurah } = getStudentPlanSurahNames(student);
  const hifzPercent = computeHifzPercent(student);
  const motivation = getStudentMotivationText(hifzPercent);
  const hifzMission = getCurrentHifzMission(student);
  const murMission = getCurrentMurajaaMission(student);
  const halaqaLabel = getHalaqaDisplayLabelFromUtils(halaqa);

  const el = document.createElement("div");
  el.className = "child-card";
  el.innerHTML = `
    <div class="child-name">${student.name} (${student.code})</div>
    <div class="child-line"><strong>${halaqaLabel}</strong></div>
    <div class="child-line">خطة الحفظ: من سورة <strong>${startSurah}</strong> إلى سورة <strong>${endSurah}</strong></div>
    <div class="child-line">إنجاز الحفظ: <strong>${hifzPercent}%</strong></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${hifzPercent}%"></div></div>
    <div class="child-line">${motivation}</div>
    <div class="child-line">مجموع النقاط: <strong>${student.total_points || 0}</strong></div>
    <div class="child-line">الترتيب داخل ${groupTitle}: <strong>${childRank}</strong></div>
    <div class="child-line">مهمة الحفظ الحالية: <span>${hifzMission ? hifzMission.description : "لا توجد"}</span></div>
    <div class="child-line">مهمة المراجعة الحالية: <span>${murMission ? murMission.description : "لا توجد"}</span></div>
    <div class="week-strip"></div>
  `;

  const weekDiv = el.querySelector(".week-strip");
  weekDiv.innerHTML = buildWeekStripHtmlFromUtils(Array.isArray(student.tasks) ? student.tasks : []);
  return el;
}

function sortStudentsByCode(students) {
  students.sort((a, b) => {
    const aCode = a.code || "";
    const bCode = b.code || "";
    const aNum = parseInt(aCode, 10);
    const bNum = parseInt(bCode, 10);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    return String(aCode).localeCompare(String(bCode), "ar");
  });

  return students;
}

function createHalaqaStudentTile(student) {
  const tile = document.createElement("div");
  tile.className = "halaqa-tile";
  tile.dataset.code = student.code;
  tile.innerHTML = `
    <div class="halaqa-tile-code">${student.code}</div>
    <div class="halaqa-tile-line">${student.name}</div>
  `;

  return tile;
}

function buildParentWelcomeText(parentKey) {
  return `مرحبًا بك يا ولي الأمر (${parentKey})`;
}

function buildNoParentChildrenMessage() {
  return '<p class="message info">لا يوجد أبناء مربوطون بهذا الرمز.</p>';
}

function renderParentChildrenList(children, ranksByHalaqa) {
  parentChildrenList.innerHTML = "";
  children.forEach((student) => {
    parentChildrenList.appendChild(createParentChildCard(student, ranksByHalaqa));
  });
}

function renderParentDashboardContent(children, ranksByHalaqa) {
  if (!children.length) {
    parentChildrenList.innerHTML = buildNoParentChildrenMessage();
    return;
  }

  renderParentChildrenList(children, ranksByHalaqa);
}

function buildParentDashboardData(allStudents, parentCode) {
  const parentKey = String(parentCode || "");
  const children = allStudents.filter((student) => String(student.parent_code || "") === parentKey);
  const ranksByHalaqa = buildRanksByHalaqa(allStudents);

  return {
    parentKey,
    children,
    ranksByHalaqa,
  };
}

async function loadAllStudentsSnapshot() {
  return fetchAllStudentsSnapshotFromService(db);
}

function showParentDashboardScreen() {
  hideAllScreens();
  parentScreen.classList.remove("hidden");
}

function showParentDashboardLoadError(error) {
  parentChildrenList.innerHTML = `<p class="message error">خطأ في تحميل بيانات الأبناء: ${error.message}</p>`;
}

function prepareParentDashboardView(parentKey) {
  welcomeParent.textContent = buildParentWelcomeText(parentKey);
  parentChildrenList.innerHTML = "";
}

function renderParentDashboard({ parentKey, children, ranksByHalaqa }) {
  prepareParentDashboardView(parentKey);
  renderParentDashboardContent(children, ranksByHalaqa);
  showParentDashboardScreen();
}

async function buildParentDashboardContext(parentCode) {
  const allStudents = await loadAllStudentsSnapshot();
  return buildParentDashboardData(allStudents, parentCode);
}

async function displayParentDashboard(parentCode) {
  try {
    const { parentKey, children, ranksByHalaqa } = await buildParentDashboardContext(parentCode);
    renderParentDashboard({ parentKey, children, ranksByHalaqa });
  } catch (e) {
    console.error("Error displayParentDashboard:", e);
    return showParentDashboardLoadError(e);
  }
}

async function loadStudentsForHalaqa(halaqaType) {
  return fetchStudentsForHalaqaFromService(db, halaqaType);
}

function buildEmptyHalaqaMessage() {
  return '<p class="message info">لا يوجد طلاب مسجلون في هذه الحلقة.</p>';
}

function renderHalaqaStudentsGrid(students) {
  halaqaStudentsGrid.innerHTML = "";
  students.forEach((student) => {
    halaqaStudentsGrid.appendChild(createHalaqaStudentTile(student));
  });
}

function buildHalaqaScreenHeaderData(loginCode, halaqaType) {
  const halaqaLabel = getHalaqaDisplayLabel(halaqaType);

  return {
    title: `حسابات ${halaqaLabel}`,
    subtitle: `: ${loginCode}`,
  };
}

function setHalaqaScreenHeader(loginCode, halaqaType) {
  const { title, subtitle } = buildHalaqaScreenHeaderData(loginCode, halaqaType);
  safeSetText(halaqaTitle, title);
  safeSetText(halaqaSubtitle, subtitle);
}

function showHalaqaLoadError(error) {
  halaqaStudentsGrid.innerHTML = `<p class="message error">حدث خطأ في تحميل طلاب الحلقة: ${error.message}</p>`;
}

function showHalaqaScreen() {
  hideAllScreens();
  halaqaScreen.classList.remove("hidden");
}

function renderHalaqaDashboardContent(students) {
  if (!students.length) {
    halaqaStudentsGrid.innerHTML = buildEmptyHalaqaMessage();
    return;
  }

  sortStudentsByCode(students);
  renderHalaqaStudentsGrid(students);
}

function buildHalaqaDashboardParams(loginCode, halaqaType, students) {
  return { loginCode, halaqaType, students };
}

function renderHalaqaDashboard({ loginCode, halaqaType, students }) {
  showHalaqaScreen();
  setHalaqaScreenHeader(loginCode, halaqaType);
  renderHalaqaDashboardContent(students);
}

async function buildHalaqaScreenContext(loginCode, halaqaType) {
  const students = await loadStudentsForHalaqa(halaqaType);
  return {
    dashboardParams: buildHalaqaDashboardParams(loginCode, halaqaType, students),
  };
}

async function displayHalaqaScreen(loginCode, halaqaType) {
  try {
    const { dashboardParams } = await buildHalaqaScreenContext(loginCode, halaqaType);
    renderHalaqaDashboard(dashboardParams);
  } catch (e) {
    console.error("displayHalaqaScreen error:", e);
    showHalaqaLoadError(e);
  }
}

// =====================================================
// 9) لوحة الشرف (Honor Board)
// =====================================================

function getMurajaaLevelLabel(level) {
  if (level === "DEVELOPMENT") return "التطوير";
  if (level === "ADVANCED") return "المتقدم";
  return "البناء";
}

function createHonorBoardItem(student, rank) {
  const li = document.createElement("li");
  const rankClass = rank <= 3 ? `rank-${rank}` : "rank-other";
  li.className = `honor-item ${rankClass}`;

  const levelName = getMurajaaLevelLabel(student.murajaa_level || "BUILDING");
  li.innerHTML = `
    <span>#${rank} - ${student.name || "طالب"} (${student.code})</span>
    <span>${student.total_points || 0} نقطة – ${levelName}</span>
  `;

  return li;
}

function createHonorBoardSection(title, studentsList) {
  const section = document.createElement("div");
  const h = document.createElement("h4");
  h.textContent = title;
  section.appendChild(h);

  if (!studentsList.length) {
    const p = document.createElement("p");
    p.className = "info-text";
    p.textContent = "لا يوجد طلاب في هذا المستوى حتى الآن.";
    section.appendChild(p);
    return section;
  }

  const ul = document.createElement("ul");
  ul.className = "honor-list";

  studentsList.forEach((student, idx) => {
    ul.appendChild(createHonorBoardItem(student, idx + 1));
  });

  section.appendChild(ul);
  return section;
}

function buildEmptyHonorBoardMessage() {
  return '<p class="message info">لا يوجد طلاب في هذه الحلقة حتى الآن.</p>';
}

function showHonorBoardLoadingState() {
  honorBoardDiv.innerHTML = '<p class="message info">جارٍ تحميل لوحة الشرف...</p>';
}

function showHonorBoardLoadError(error) {
  honorBoardDiv.innerHTML = `<p class="message error">خطأ في تحميل لوحة الشرف: ${error.message}</p>`;
}

function renderHonorBoardContent({ topBuilding, topDevAdv }) {
  const container = document.createElement("div");
  container.appendChild(createHonorBoardSection("مستوى البناء", topBuilding));
  container.appendChild(createHonorBoardSection("مستوى التطوير / المتقدم", topDevAdv));

  honorBoardDiv.innerHTML = "";
  honorBoardDiv.appendChild(container);
}

function buildHonorBoardContext(students) {
  const { buildingSorted, devAdvSorted } = buildGroupedRanksFromUtils(students);

  return {
    topBuilding: buildingSorted.slice(0, 5),
    topDevAdv: devAdvSorted.slice(0, 5),
  };
}

async function loadHonorBoard() {
  if (!honorBoardDiv) return;

  showHonorBoardLoadingState();

  try {
    const all = await fetchAllStudentsSortedByPointsFromService(db, isInCurrentHalaqa);

    if (!all.length) {
      honorBoardDiv.innerHTML = buildEmptyHonorBoardMessage();
      return;
    }

    renderHonorBoardContent(buildHonorBoardContext(all));
  } catch (e) {
    console.error("Error loadHonorBoard:", e);
    showHonorBoardLoadError(e);
  }
}

// =====================================================
// Teacher System
// =====================================================
async function loadStudentsForTeacher() {
  studentList.innerHTML = "<li>جارٍ تحميل الطلاب...</li>";

  try {
    const students = await getStudentsSortedByPoints(isInCurrentHalaqa);

    if (!students.length) {
      studentList.innerHTML = "<li>لا يوجد طلاب مسجلون بعد.</li>";
      return;
    }

    studentList.innerHTML = "";

    students.forEach((s, i) => {
      const hifzPercent = computeHifzPercent(s);
      const murPercent  = computeMurajaaPercent(s);

      const hifzPaused = !!s.pause_hifz;
      const murPaused  = !!s.pause_murajaa;

      const isStudentAssistant = !!s.is_student_assistant;
      const progressSummary = buildTeacherStudentProgressSummary({
        hifzPercent,
        murPercent,
        hifzPaused,
        murPaused,
        totalPoints: s.total_points,
      });
      const parentSummary = buildTeacherStudentParentSummary(s);
      const assistantSummary = buildTeacherStudentAssistantSummary(isStudentAssistant);
      const {
        hifzChipButton,
        murajaaChipButton,
        studentAssistantChipButton,
      } = buildTeacherStudentChipButtons({
        code: s.code,
        hifzPaused,
        murPaused,
        isStudentAssistant,
      });
      const studentActionsHtml = buildTeacherStudentActionsHtml({
        code: s.code,
        hifzChipButton,
        murajaaChipButton,
        studentAssistantChipButton,
      });
      const li = createTeacherStudentListItem({
        index: i,
        student: s,
        studentActionsHtml,
        progressSummary,
        parentSummary,
        assistantSummary,
      });
      studentList.appendChild(li);
    });

    bindTeacherStudentListActions();

  } catch (e) {
    console.error("Error loadStudentsForTeacher:", e);
    studentList.innerHTML = "<li>حدث خطأ أثناء تحميل قائمة الطلاب.</li>";
  }
}

function bindTeacherStudentListActions() {
  bindStudentEditButtons(".btn-edit-student");
  bindStudentFlagToggleButtons(".btn-toggle-hifz", "pause_hifz");
  bindStudentFlagToggleButtons(".btn-toggle-murajaa", "pause_murajaa");
  bindStudentFlagToggleButtons(".btn-toggle-student-assistant", "is_student_assistant");
}

function bindStudentEditButtons(selector) {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener("click", (e) => loadStudentIntoForm(e.currentTarget.dataset.code));
  });
}

function bindStudentFlagToggleButtons(selector, fieldName) {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStudentFlag(e.currentTarget.dataset.code, fieldName);
    });
  });
}

function buildTeacherStudentProgressSummary({ hifzPercent, murPercent, hifzPaused, murPaused, totalPoints }) {
  return `حفظ: ${hifzPercent}% ${hifzPaused ? " (موقوف)" : ""} | مراجعة: ${murPercent}% ${murPaused ? " (موقوف)" : ""} | نقاط: ${totalPoints || 0}`;
}

function buildTeacherStudentParentSummary(student) {
  return `ولي الأمر: ${student.parent_name || "غير مسجل"} (${student.parent_code || "—"})`;
}

function buildTeacherStudentAssistantSummary(isStudentAssistant) {
  return `مساعد طالب: ${isStudentAssistant ? "✅ مفعّل" : "❌ غير مفعّل"}`;
}

function buildTeacherStudentChipButton({ isOn, buttonClass, code, ariaPressed, title, label }) {
  return `
    <button type="button"
      class="chip-toggle ${isOn ? "on" : ""} ${buttonClass}"
      data-code="${code}"
      aria-pressed="${ariaPressed}"
      title="${title}">
      <span class="ico">${label}</span>
    </button>
  `;
}

function buildTeacherStudentChipButtons({
  code,
  hifzPaused,
  murPaused,
  isStudentAssistant,
}) {
  return {
    hifzChipButton: buildTeacherStudentChipButton({
      isOn: !hifzPaused,
      buttonClass: "btn-toggle-hifz",
      code,
      ariaPressed: hifzPaused ? "false" : "true",
      title: hifzPaused ? "الحفظ: موقوف" : "الحفظ: شغال",
      label: "حفظ",
    }),
    murajaaChipButton: buildTeacherStudentChipButton({
      isOn: !murPaused,
      buttonClass: "btn-toggle-murajaa",
      code,
      ariaPressed: murPaused ? "false" : "true",
      title: murPaused ? "المراجعة: موقوفة" : "المراجعة: شغالة",
      label: "مراجعة",
    }),
    studentAssistantChipButton: buildTeacherStudentChipButton({
      isOn: isStudentAssistant,
      buttonClass: "btn-toggle-student-assistant",
      code,
      ariaPressed: isStudentAssistant ? "true" : "false",
      title: isStudentAssistant ? "مساعد طالب: مفعّل" : "مساعد طالب: غير مفعّل",
      label: "طالب",
    }),
  };
}

function buildTeacherStudentActionsHtml({
  code,
  hifzChipButton,
  murajaaChipButton,
  studentAssistantChipButton,
}) {
  return `
    <div class="student-actions">
      <button class="button primary btn-edit-student" data-code="${code}">تعديل</button>
      ${hifzChipButton}
      ${murajaaChipButton}
      ${studentAssistantChipButton}
    </div>
  `;
}

function buildTeacherStudentCardHtml({
  index,
  student,
  studentActionsHtml,
  progressSummary,
  parentSummary,
  assistantSummary,
}) {
  return `
    <div class="student-card">
      <div class="student-top">
        <div class="student-name">#${index + 1} - ${student.name} (${student.code})</div>
      </div>

      <div class="student-week week-strip"></div>

      ${studentActionsHtml}

      <div class="card-notch toggle-details" aria-expanded="false">
        <span class="chev">▾</span>
      </div>

      <div class="student-details hidden">
        <div class="student-sub">${progressSummary}</div>
        <div class="student-sub">${parentSummary}</div>
        <div class="student-sub">${assistantSummary}</div>
      </div>
    </div>
  `;
}

function buildTeacherStudentSearchText(student) {
  return `${student.code || ""} ${student.name || ""} ${student.parent_name || ""} ${student.parent_code || ""}`.toLowerCase();
}

function createTeacherStudentListItem({
  index,
  student,
  studentActionsHtml,
  progressSummary,
  parentSummary,
  assistantSummary,
}) {
  const li = document.createElement("li");
  li.innerHTML = buildTeacherStudentCardHtml({
    index,
    student,
    studentActionsHtml,
    progressSummary,
    parentSummary,
    assistantSummary,
  });

  const weekDiv = li.querySelector(".week-strip");
  weekDiv.innerHTML = buildWeekStripHtmlFromUtils(Array.isArray(student.tasks) ? student.tasks : []);
  li.dataset.search = buildTeacherStudentSearchText(student);

  return li;
}

async function toggleStudentFlag(code, fieldName) {
  try {
    const studentRef = doc(db, "students", code);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;

    const s = snap.data();
    const current = !!s[fieldName];

    await updateDoc(studentRef, { [fieldName]: !current });
    invalidateStudentsSnapshotCache();
    await loadStudentsForTeacher();

    const msg = getToggleStudentFlagMessage(fieldName, current);

    if (msg) showMessage(registerStudentMessage, msg, "success");
  } catch (e) {
    console.error("Error toggleStudentFlag:", e);
    showMessage(registerStudentMessage, `خطأ في تحديث حالة الطالب: ${e.message}`, "error");
  }
}

function getToggleStudentFlagMessage(fieldName, currentValue) {
  if (fieldName === "pause_hifz") {
    return !currentValue ? "تم إيقاف مهام الحفظ لهذا الطالب." : "تم تشغيل مهام الحفظ لهذا الطالب.";
  }

  if (fieldName === "pause_murajaa") {
    return !currentValue ? "تم إيقاف مهام المراجعة لهذا الطالب." : "تم تشغيل مهام المراجعة لهذا الطالب.";
  }

  if (fieldName === "is_student_assistant") {
    return !currentValue ? "تم تفعيل هذا الطالب كمساعد." : "تم إلغاء تفعيل هذا الطالب كمساعد.";
  }

  return "";
}

async function loadStudentIntoForm(code) {
  try {
    const snap = await getDoc(doc(db, "students", code));
    if (!snap.exists()) return;
    const s = snap.data();

    if (!canCurrentTeacherManageStudentHalaqa(getStudentHalaqa(s))) {
      showMessage(registerStudentMessage, "لا يمكن تعديل هذا الطالب خارج الحلقة التابعة للمعلم الحالي.", "error");
      return;
    }

    editingStudentCode = s.code;
    setStudentFormTitleForEdit(s.name);
    await ensureStudentFormOptionsReady();
    populateStudentFormFields(s);
    openStudentForm();

    activateTab(TEACHER_MANAGE_STUDENTS_TAB_ID);
  } catch (e) {
    console.error("Error loadStudentIntoForm:", e);
  }
}

function buildTeacherHifzCurriculumHtml() {
  if (hasExternalCurriculumRuntime()) {
    return getExternalHifzCurriculumGroups()
      .map((group) => {
        const items = group.units
          .map(
            (unit, i) =>
              `<div class="curriculum-item">(${unit.index}) ${unit.label} - نقاط: ${unit.points || 0}</div>`
          )
          .join("");

        return `<h4>${group.title}</h4>${items}`;
      })
      .join("<hr />");
  }

  return HIFZ_CURRICULUM.map(
    (it, i) =>
      `<div class="curriculum-item">(${i}) ${it.surah_name_ar} (${it.start_ayah}-${it.end_ayah}) - نقاط: ${it.points || 0}</div>`
  ).join("");
}

function buildTeacherMurajaaCurriculumSection(level, items) {
  const title = getMurajaaLevelLabel(level);
  const list = items
    .map((it, i) => `<div class="curriculum-item">(${i}) ${it.name} – نقاط: ${it.points || 0}</div>`)
    .join("");

  return `<h4>${title}</h4>${list}`;
}

function buildTeacherMurajaaCurriculumHtml() {
  return Object.entries(REVIEW_CURRICULUM)
    .map(([level, items]) => buildTeacherMurajaaCurriculumSection(level, items))
    .join("<hr />");
}

function displayCurriculumsInTeacherPanel() {
  hifzCurriculumDisplay.innerHTML = buildTeacherHifzCurriculumHtml();
  murajaaCurriculumDisplay.innerHTML = buildTeacherMurajaaCurriculumHtml();
}

// =====================================================
// 12) إضافة / تعديل طالب (Register/Update)
// =====================================================

function populateHifzSelects() {
  if (!newStudentHifzStart || !newStudentHifzEnd) return;
  const options = hasExternalCurriculumRuntime()
    ? getAllCurriculumHifzUnits()
        .map((unit, i) => `<option value="${i}">(${i}) ${unit.label}</option>`)
        .join("")
    : HIFZ_CURRICULUM.map(
        (item, i) =>
          `<option value="${i}">(${i}) ${item.surah_name_ar} (${item.start_ayah}-${item.end_ayah})</option>`
      ).join("");
  newStudentHifzStart.innerHTML = options;
  newStudentHifzEnd.innerHTML = options;
}

function getStudentHifzPhaseSelect() {
  return document.getElementById(STUDENT_HIFZ_PHASE_SELECT_ID);
}

function getStudentFieldGroup(field) {
  return field?.closest(".input-group") || null;
}

function getStudentHifzStartGroup() {
  return getStudentFieldGroup(newStudentHifzStart);
}

function getStudentHifzEndGroup() {
  return getStudentFieldGroup(newStudentHifzEnd);
}

function getStudentHifzStartLabel() {
  return getStudentHifzStartGroup()?.querySelector("label") || null;
}

function getStudentFlexibleSurahLabel() {
  return flexibleSurahGroup?.querySelector('label[for="new-student-flexible-surah"]') || null;
}

function ensureStudentFlexibleAyahField() {
  if (!flexibleSurahGroup) return null;

  let wrapper = document.getElementById("student-flexible-ayah-group");
  if (wrapper) return wrapper;

  wrapper = document.createElement("div");
  wrapper.id = "student-flexible-ayah-group";
  wrapper.style.marginTop = "12px";
  wrapper.innerHTML = `
    <label for="${STUDENT_FLEXIBLE_AYAH_SELECT_ID}">آية البداية</label>
    <select id="${STUDENT_FLEXIBLE_AYAH_SELECT_ID}"></select>
  `;

  flexibleSurahGroup.appendChild(wrapper);
  return wrapper;
}

function getStudentFlexibleAyahSelect() {
  return document.getElementById(STUDENT_FLEXIBLE_AYAH_SELECT_ID);
}

function getFlexiblePhaseSurahRanges(phaseId) {
  if (!phaseId || !hasExternalCurriculumRuntime()) return [];

  const cache = getFlexiblePhaseSurahRanges.cache || (getFlexiblePhaseSurahRanges.cache = new Map());
  if (cache.has(phaseId)) {
    return cache.get(phaseId) || [];
  }

  const phaseGroup = getExternalHifzPhaseGroups().find((group) => group.phaseId === phaseId) || null;
  const rangesBySurah = new Map();

  (phaseGroup?.units || []).forEach((unit) => {
    const surah = unit?.start?.surah ?? unit?.end?.surah ?? null;
    const surahName = unit?.start?.name || unit?.end?.name || "";
    const startAyah = unit?.start?.ayah ?? null;
    const endAyah = unit?.end?.ayah ?? null;
    if (!Number.isFinite(surah) || !Number.isFinite(startAyah) || !Number.isFinite(endAyah)) return;

    const existing = rangesBySurah.get(surah) || {
      surah,
      surahName,
      startAyah,
      endAyah,
      unitIndices: [],
    };

    existing.surahName = existing.surahName || surahName;
    existing.startAyah = Math.min(existing.startAyah, startAyah);
    existing.endAyah = Math.max(existing.endAyah, endAyah);
    if (Number.isFinite(unit.index)) {
      existing.unitIndices.push(unit.index);
    }

    rangesBySurah.set(surah, existing);
  });

  const ranges = [...rangesBySurah.values()].sort((a, b) => b.surah - a.surah);
  cache.set(phaseId, ranges);
  return ranges;
}

function findFlexibleStartIndexForPosition(phaseId, surahNumber, ayahNumber) {
  const phaseGroup = getExternalHifzPhaseGroups().find((group) => group.phaseId === phaseId) || null;
  return (
    phaseGroup?.units?.find(
      (unit) =>
        (unit?.start?.surah ?? unit?.end?.surah ?? null) === surahNumber &&
        Number.isFinite(unit?.start?.ayah) &&
        Number.isFinite(unit?.end?.ayah) &&
        ayahNumber >= unit.start.ayah &&
        ayahNumber <= unit.end.ayah
    )?.index ?? null
  );
}

function syncFlexibleExternalStartIndex() {
  if (!hasExternalCurriculumRuntime() || (newStudentHifzType?.value || "fixed") !== "flexible") return;

  const phaseId = getStudentHifzPhaseSelect()?.value || "";
  const surahNumber = parseInt(newStudentFlexibleSurah?.value || "", 10);
  const ayahNumber = parseInt(getStudentFlexibleAyahSelect()?.value || "", 10);
  const startIndex = findFlexibleStartIndexForPosition(phaseId, surahNumber, ayahNumber);
  if (Number.isFinite(startIndex) && newStudentHifzStart) {
    newStudentHifzStart.value = String(startIndex);
  }
}

function ensureStudentDerivedPlanHint() {
  if (!fixedHifzGroup) return null;

  let hint = document.getElementById("student-hifz-plan-hint");
  if (hint) return hint;

  hint = document.createElement("div");
  hint.id = "student-hifz-plan-hint";
  hint.className = "message info hidden";
  hint.style.marginTop = "8px";
  fixedHifzGroup.appendChild(hint);
  return hint;
}

function ensureStudentHifzPhaseField() {
  if (!fixedHifzGroup) return null;

  let wrapper = document.getElementById("student-hifz-phase-group");
  if (wrapper) return wrapper;

  wrapper = document.createElement("div");
  wrapper.id = "student-hifz-phase-group";
  wrapper.style.marginBottom = "12px";
  wrapper.innerHTML = `
    <label for="${STUDENT_HIFZ_PHASE_SELECT_ID}">المرحلية</label>
    <select id="${STUDENT_HIFZ_PHASE_SELECT_ID}"></select>
  `;

  fixedHifzGroup.insertBefore(wrapper, fixedHifzGroup.firstChild || null);
  return wrapper;
}

function getExternalHifzPhaseGroups() {
  if (!hasExternalCurriculumRuntime()) return [];

  if (!getExternalHifzPhaseGroups.cache) {
    getExternalHifzPhaseGroups.cache = getExternalHifzCurriculumGroups().filter(
      (group) => group?.phaseId && Array.isArray(group.units) && group.units.length
    );
  }

  return getExternalHifzPhaseGroups.cache;
}

function populateStudentHifzPhaseSelect(selectedPhaseId = null) {
  const wrapper = ensureStudentHifzPhaseField();
  const phaseSelect = getStudentHifzPhaseSelect();
  if (!wrapper || !phaseSelect) return;

  if (!hasExternalCurriculumRuntime()) {
    wrapper.classList.add("hidden");
    phaseSelect.innerHTML = "";
    return;
  }

  const groups = getExternalHifzPhaseGroups();
  const optionsHtml =
    populateStudentHifzPhaseSelect.cache ||
    groups.map((group) => `<option value="${group.phaseId}">${group.title}</option>`).join("");
  populateStudentHifzPhaseSelect.cache = optionsHtml;
  if (phaseSelect.innerHTML !== optionsHtml) {
    phaseSelect.innerHTML = optionsHtml;
  }

  const fallbackPhaseId = groups[0]?.phaseId || "";
  phaseSelect.value = selectedPhaseId && groups.some((group) => group.phaseId === selectedPhaseId)
    ? selectedPhaseId
    : fallbackPhaseId;
  wrapper.classList.toggle("hidden", false);
}

function populateStudentHifzStartOptionsForPhase(phaseId, selectedStartIndex = null) {
  if (!newStudentHifzStart) return;

  if (!hasExternalCurriculumRuntime()) {
    populateHifzSelects();
    if (selectedStartIndex != null) {
      newStudentHifzStart.value = String(selectedStartIndex);
    }
    return;
  }

  const phaseGroups = getExternalHifzPhaseGroups();
  const phaseGroup = phaseGroups.find((group) => group.phaseId === phaseId) || null;
  const units = phaseGroup?.units || [];
  const optionsCache = populateStudentHifzStartOptionsForPhase.cache || (populateStudentHifzStartOptionsForPhase.cache = new Map());
  const cachedOptions = optionsCache.get(phaseId);
  if (cachedOptions) {
    newStudentHifzStart.innerHTML = cachedOptions;
  } else {
    const optionsHtml = units
      .map((unit) => `<option value="${unit.index}">(${unit.index}) ${unit.label}</option>`)
      .join("");
    optionsCache.set(phaseId, optionsHtml);
    newStudentHifzStart.innerHTML = optionsHtml;
  }

  const fallbackStartIndex = units[0]?.index ?? "";
  const normalizedSelectedStart = selectedStartIndex != null ? String(selectedStartIndex) : null;
  const hasSelectedStart = normalizedSelectedStart != null && units.some((unit) => String(unit.index) === normalizedSelectedStart);
  newStudentHifzStart.value = hasSelectedStart ? normalizedSelectedStart : String(fallbackStartIndex);
}

function syncStudentDerivedPlanEnd() {
  if (!newStudentHifzEnd) return;

  const phaseSelect = getStudentHifzPhaseSelect();
  const selectedPhaseId = phaseSelect?.value || "";
  const selectedStartIndex = parseInt(newStudentHifzStart?.value || "", 10);

  if (hasExternalCurriculumRuntime() && selectedPhaseId) {
    const resolvedPlan = resolveCurriculumPlanFromPhaseStart(selectedPhaseId, selectedStartIndex);
    if (resolvedPlan) {
      newStudentHifzEnd.value = String(resolvedPlan.hifz_end_id);
    }
    newStudentHifzEnd.disabled = true;
    return;
  }

  newStudentHifzEnd.disabled = false;
}

function syncStudentHifzPlanUIState() {
  const mode = newStudentHifzType?.value || "fixed";
  const isExternalPhaseBoundMode = hasExternalCurriculumRuntime() && (mode === "fixed" || mode === "flexible");
  const isExternalFixedMode = hasExternalCurriculumRuntime() && mode === "fixed";
  const startLabel = getStudentHifzStartLabel();
  const endGroup = getStudentHifzEndGroup();
  const hint = ensureStudentDerivedPlanHint();
  const selectedEndText = newStudentHifzEnd?.selectedOptions?.[0]?.textContent || "";

  if (startLabel) {
    startLabel.textContent = isExternalFixedMode
      ? "نقطة البداية داخل المرحلية:"
      : "نقطة بداية الحفظ:";
  }

  if (endGroup) {
    endGroup.classList.toggle("hidden", isExternalPhaseBoundMode);
  }

  if (hint) {
    if (isExternalPhaseBoundMode) {
      hint.textContent = selectedEndText
        ? `نهاية الخطة تُحدد تلقائيًا من نهاية المرحلية: ${selectedEndText}`
        : "نهاية الخطة تُحدد تلقائيًا من نهاية المرحلية.";
      hint.classList.remove("hidden");
    } else {
      hint.classList.add("hidden");
      hint.textContent = "";
    }
  }
}

function handleStudentHifzPhaseChange(selectedStartIndex = null) {
  const phaseSelect = getStudentHifzPhaseSelect();
  const selectedPhaseId = phaseSelect?.value || "";
  populateStudentHifzStartOptionsForPhase(selectedPhaseId, selectedStartIndex);
  if ((newStudentHifzType?.value || "fixed") === "flexible") {
    populateFlexibleSurahSelect();
    populateFlexibleAyahSelect();
  }
  syncStudentDerivedPlanEnd();
  syncStudentHifzPlanUIState();
}

function bindStudentHifzPhaseField() {
  ensureStudentFlexibleAyahField();
  const phaseSelect = getStudentHifzPhaseSelect();
  if (!phaseSelect || phaseSelect.dataset.bound === "true") return;

  phaseSelect.addEventListener("change", () => handleStudentHifzPhaseChange());
  newStudentHifzStart?.addEventListener("change", () => {
    syncStudentDerivedPlanEnd();
    syncStudentHifzPlanUIState();
  });
  newStudentFlexibleSurah?.addEventListener("change", () => {
    populateFlexibleAyahSelect();
    syncFlexibleExternalStartIndex();
    syncStudentDerivedPlanEnd();
    syncStudentHifzPlanUIState();
  });
  getStudentFlexibleAyahSelect()?.addEventListener("change", () => {
    syncFlexibleExternalStartIndex();
    syncStudentDerivedPlanEnd();
    syncStudentHifzPlanUIState();
  });
  phaseSelect.dataset.bound = "true";
}

function populateFlexibleSurahSelect() {
  if (!newStudentFlexibleSurah) return;
  if (hasExternalCurriculumRuntime()) {
    const phaseId = getStudentHifzPhaseSelect()?.value || "";
    const ranges = getFlexiblePhaseSurahRanges(phaseId);
    newStudentFlexibleSurah.innerHTML = ranges
      .map((range) => `<option value="${range.surah}">${range.surahName}</option>`)
      .join("");
    return;
  }

  newStudentFlexibleSurah.innerHTML = FLEXIBLE_HIFZ.map((s, i) =>
    `<option value="${i}">${s.surah_name_ar} (${s.start_ayah}-${s.end_ayah})</option>`
  ).join("");
}

function populateFlexibleAyahSelect(selectedAyah = null) {
  const ayahSelect = getStudentFlexibleAyahSelect();
  if (!ayahSelect) return;

  if (!hasExternalCurriculumRuntime()) {
    ayahSelect.innerHTML = "";
    return;
  }

  const phaseId = getStudentHifzPhaseSelect()?.value || "";
  const selectedSurah = parseInt(newStudentFlexibleSurah?.value || "", 10);
  const range = getFlexiblePhaseSurahRanges(phaseId).find((item) => item.surah === selectedSurah) || null;
  const options = [];

  if (range) {
    for (let ayah = range.startAyah; ayah <= range.endAyah; ayah += 1) {
      options.push(`<option value="${ayah}">${ayah}</option>`);
    }
  }

  ayahSelect.innerHTML = options.join("");
  const fallbackAyah = range?.startAyah ?? "";
  const normalizedSelectedAyah = selectedAyah != null ? String(selectedAyah) : null;
  ayahSelect.value =
    normalizedSelectedAyah && options.some((optionHtml) => optionHtml.includes(`value="${normalizedSelectedAyah}"`))
      ? normalizedSelectedAyah
      : String(fallbackAyah);
  syncFlexibleExternalStartIndex();
}

function syncHifzTypeUI() {
  const mode = newStudentHifzType?.value || "fixed";
  const isFlex = mode === "flexible";
  fixedHifzGroup?.classList.toggle("hidden", false);
  flexibleSurahGroup?.classList.toggle("hidden", !isFlex);
  getStudentHifzPhaseSelect()?.closest("#student-hifz-phase-group")?.classList.toggle(
    "hidden",
    !hasExternalCurriculumRuntime()
  );
  ensureStudentFlexibleAyahField()?.classList.toggle("hidden", !hasExternalCurriculumRuntime() || !isFlex);
  getStudentHifzStartGroup()?.classList.toggle("hidden", hasExternalCurriculumRuntime() && isFlex);
  const flexibleSurahLabel = getStudentFlexibleSurahLabel();
  if (flexibleSurahLabel) {
    flexibleSurahLabel.textContent = hasExternalCurriculumRuntime() && isFlex ? "السورة" : "سورة البداية";
  }
  if (isFlex) {
    const currentFlexibleSurah = newStudentFlexibleSurah?.value || "";
    const currentFlexibleAyah = getStudentFlexibleAyahSelect()?.value || "";
    populateFlexibleSurahSelect();
    if (currentFlexibleSurah && newStudentFlexibleSurah) {
      newStudentFlexibleSurah.value = currentFlexibleSurah;
    }
    populateFlexibleAyahSelect(currentFlexibleAyah ? parseInt(currentFlexibleAyah, 10) : null);
  }
  syncStudentDerivedPlanEnd();
  syncStudentHifzPlanUIState();
}

newStudentHifzType?.addEventListener("change", syncHifzTypeUI);

function populateMurajaaStartSelect() {
  if (!newStudentMurajaaLevel || !newStudentMurajaaStart) return;
  const arr = getReviewArrayForLevel(newStudentMurajaaLevel.value || "BUILDING");
  if (!arr?.length) {
    newStudentMurajaaStart.innerHTML = '<option value="0">لا توجد مهام لهذا المستوى</option>';
    return;
  }
  newStudentMurajaaStart.innerHTML = arr.map((it, i) => `<option value="${i}">(${i}) ${it.name}</option>`).join("");
}

newStudentMurajaaLevel?.addEventListener("change", populateMurajaaStartSelect);

function setStudentFormTitleForCreate() {
  if (studentFormTitle) studentFormTitle.textContent = "إضافة / تعديل طالب";
}

function setStudentFormTitleForEdit(studentName) {
  if (studentFormTitle) {
    studentFormTitle.textContent = `تعديل بيانات الطالب: ${studentName}`;
  }
}

async function ensureStudentFormOptionsReady() {
  if (!newStudentHifzStart?.options.length || !newStudentHifzEnd?.options.length) {
    populateHifzSelects();
  }

  populateStudentHifzPhaseSelect();
  bindStudentHifzPhaseField();
  if (hasExternalCurriculumRuntime()) {
    handleStudentHifzPhaseChange();
  }
  populateFlexibleSurahSelect();
  populateFlexibleAyahSelect();
  await populateStudentHalaqaOptions();
}

function populateStudentIdentityFields(student) {
  newStudentCodeInput.value = student.code;
  newStudentNameInput.value = student.name;
  newStudentParentNameInput.value = student.parent_name || "";
  newStudentParentCodeInput.value = student.parent_code || "";
}

function populateStudentHifzFields(student) {
  const defaultEndIndex = hasExternalCurriculumRuntime()
    ? Math.max(0, getAllCurriculumHifzUnits().length - 1)
    : HIFZ_CURRICULUM.length - 1;
  const startIndex = student.hifz_start_id ?? student.hifz_progress ?? 0;
  const phaseId = hasExternalCurriculumRuntime()
    ? (getCurriculumUnitAt(startIndex)?.phaseId || student.hifz_current_phase_id || "")
    : "";

  if (hasExternalCurriculumRuntime()) {
    populateStudentHifzPhaseSelect(phaseId);
    bindStudentHifzPhaseField();
    handleStudentHifzPhaseChange(startIndex);
  } else {
    newStudentHifzStart.value = startIndex;
  }

  newStudentHifzEnd.value = student.hifz_end_id ?? defaultEndIndex;
  newStudentHifzLevel.value = student.hifz_level || 1;

  const mode = student.hifz_mode || "fixed";
  if (newStudentHifzType) newStudentHifzType.value = mode;
  if (newStudentFlexibleSurah) {
    if (hasExternalCurriculumRuntime() && mode === "flexible") {
      populateFlexibleSurahSelect();
      const selectedSurah = student.flexible_start?.surah ?? student.flex_surah_number ?? currentExternalUnit?.start?.surah ?? "";
      newStudentFlexibleSurah.value = String(selectedSurah);
      populateFlexibleAyahSelect(student.flexible_start?.ayah ?? student.flex_next_ayah ?? currentExternalUnit?.start?.ayah ?? null);
    } else {
      newStudentFlexibleSurah.value = String(student.flex_surah_index ?? 0);
    }
  }

  syncHifzTypeUI();
  syncStudentDerivedPlanEnd();
  syncStudentHifzPlanUIState();
}

function populateStudentMurajaaFields(student) {
  newStudentMurajaaLevel.value = student.murajaa_level || "BUILDING";
  populateMurajaaStartSelect();

  const arr = getReviewArrayForLevel(newStudentMurajaaLevel.value);
  const defaultStartIndex = student.murajaa_start_index ?? student.murajaa_progress_index ?? 0;
  newStudentMurajaaStart.value = (arr?.length ? Math.min(defaultStartIndex, arr.length - 1) : 0).toString();
}

function populateStudentFormFields(student) {
  populateStudentIdentityFields(student);
  populateStudentHifzFields(student);
  populateStudentMurajaaFields(student);

  if (newStudentHalaqa) {
    newStudentHalaqa.value = getStudentHalaqa(student);
  }

  setHalaqaSegment(getStudentHalaqa(student));
}

function readStudentFormInput() {
  const phaseSelect = getStudentHifzPhaseSelect();
  return {
    code: newStudentCodeInput.value.trim(),
    name: newStudentNameInput.value.trim(),
    parentName: newStudentParentNameInput.value.trim() || null,
    parentCode: newStudentParentCodeInput.value.trim() || null,
    hifzPhaseId: phaseSelect?.value || "",
    hifzStartIndex: parseInt(newStudentHifzStart.value, 10),
    hifzEndIndex: parseInt(newStudentHifzEnd.value, 10),
    hifzLevel: parseInt(newStudentHifzLevel.value, 10),
    murajaaLevel: newStudentMurajaaLevel.value,
    murajaaStartIndex: parseInt(newStudentMurajaaStart.value, 10) || 0,
    halaqaValue: newStudentHalaqa?.value || "",
    hifzMode: newStudentHifzType?.value || "fixed",
    flexSurahIndex: parseInt(newStudentFlexibleSurah?.value || "0", 10) || 0,
    flexStartAyah: parseInt(getStudentFlexibleAyahSelect()?.value || "0", 10) || 0,
  };
}

function getStudentFormValidationError(studentInput) {
  const {
    code,
    name,
    hifzMode,
    hifzPhaseId,
    hifzStartIndex,
    hifzEndIndex,
    flexSurahIndex,
    flexStartAyah,
    halaqaValue,
  } = studentInput;

  if (!code || !name) {
    return "الرجاء تعبئة رمز الطالب والاسم.";
  }

  if (!halaqaValue) {
    return "الرجاء اختيار الحلقة.";
  }

  if (!canCurrentTeacherManageStudentHalaqa(halaqaValue)) {
    return "لا يمكن إضافة الطالب إلا داخل الحلقة التابعة للمعلم الحالي.";
  }

  if (hifzMode === "fixed") {
    if (isNaN(hifzStartIndex) || (!hasExternalCurriculumRuntime() && isNaN(hifzEndIndex))) {
      return hasExternalCurriculumRuntime()
        ? "الرجاء اختيار نقطة بداية الحفظ."
        : "الرجاء اختيار بداية ونهاية الحفظ للمنهج الثابت.";
    }

    if (!hasExternalCurriculumRuntime() && hifzEndIndex < hifzStartIndex) {
      return "نقطة نهاية الحفظ يجب أن تكون بعد نقطة البداية.";
    }

    if (hasExternalCurriculumRuntime()) {
      if (!hifzPhaseId) {
        return "الرجاء اختيار المرحلية.";
      }

      const resolvedPlan = resolveCurriculumPlanFromPhaseStart(hifzPhaseId, hifzStartIndex);

      if (!resolvedPlan) {
        return "تعذر ربط نقطة البداية بالمرحلية المحددة.";
      }
    }

    return null;
  }

  if (hasExternalCurriculumRuntime()) {
    if (!hifzPhaseId) {
      return "الرجاء اختيار المرحلية للمنهج المرن.";
    }

    const ranges = getFlexiblePhaseSurahRanges(hifzPhaseId);
    const selectedRange = ranges.find((range) => range.surah === flexSurahIndex) || null;
    if (!selectedRange) {
      return "الرجاء اختيار السورة داخل المرحلية.";
    }

    if (!Number.isFinite(flexStartAyah) || flexStartAyah < selectedRange.startAyah || flexStartAyah > selectedRange.endAyah) {
      return "الرجاء اختيار آية بداية صحيحة داخل السورة المحددة.";
    }

    const resolvedStartIndex = findFlexibleStartIndexForPosition(hifzPhaseId, flexSurahIndex, flexStartAyah);
    const resolvedPlan = Number.isFinite(resolvedStartIndex)
      ? resolveCurriculumPlanFromPhaseStart(hifzPhaseId, resolvedStartIndex)
      : null;
    if (!resolvedPlan || !Number.isFinite(resolvedStartIndex)) {
      return "تعذر ربط بداية المنهج المرن بالمرحلية المحددة.";
    }

    return null;
  }

  if (!Number.isFinite(flexSurahIndex) || !FLEXIBLE_HIFZ[flexSurahIndex]) {
    return "الرجاء اختيار سورة بداية صحيحة للمنهج المرن.";
  }

  return null;
}

function buildStudentBaseData(studentInput, existingStudent) {
  const {
    code,
    name,
    parentName,
    parentCode,
    hifzPhaseId,
    hifzStartIndex,
    hifzEndIndex,
    hifzLevel,
    murajaaLevel,
    murajaaStartIndex,
    halaqaValue,
    hifzMode,
    flexSurahIndex,
    flexStartAyah,
  } = studentInput;

  const flexSurah = FLEXIBLE_HIFZ[flexSurahIndex] || FLEXIBLE_HIFZ[0];
  const defaultExternalEndIndex = hasExternalCurriculumRuntime()
    ? Math.max(0, getAllCurriculumHifzUnits().length - 1)
    : HIFZ_CURRICULUM.length - 1;
  const resolvedExternalPlan = hasExternalCurriculumRuntime() && hifzMode === "fixed"
    ? resolveCurriculumPlanFromPhaseStart(hifzPhaseId, hifzStartIndex)
    : null;
  const resolvedFlexibleStartIndex = hasExternalCurriculumRuntime() && hifzMode === "flexible"
    ? findFlexibleStartIndexForPosition(hifzPhaseId, flexSurahIndex, flexStartAyah)
    : null;
  const resolvedFlexiblePlan = hasExternalCurriculumRuntime() && hifzMode === "flexible" && Number.isFinite(resolvedFlexibleStartIndex)
    ? resolveCurriculumPlanFromPhaseStart(hifzPhaseId, resolvedFlexibleStartIndex)
    : null;
  const resolvedPlan = resolvedExternalPlan || resolvedFlexiblePlan;
  const effectiveHifzStartIndex = resolvedPlan?.hifz_start_id ?? hifzStartIndex;
  const effectiveHifzEndIndex = resolvedPlan?.hifz_end_id ?? (
    Number.isFinite(hifzEndIndex) ? hifzEndIndex : defaultExternalEndIndex
  );
  const startingProgressIndex = resolvedPlan?.hifz_progress ?? (
    existingStudent ? (existingStudent.hifz_progress ?? effectiveHifzStartIndex) : effectiveHifzStartIndex
  );
  const currentExternalUnit = hasExternalCurriculumRuntime() ? getCurriculumUnitAt(startingProgressIndex) : null;
  const currentExternalPhase = hasExternalCurriculumRuntime() ? getPhaseForProgressIndex(startingProgressIndex) : null;
  const shouldResetExternalFlexible = hasExternalCurriculumRuntime() && hifzMode === "flexible";
  const selectedFlexibleSurahName = getFlexiblePhaseSurahRanges(hifzPhaseId).find((range) => range.surah === flexSurahIndex)?.surahName || "";
  const resetFlexibleSurahNumber = flexSurahIndex || currentExternalUnit?.start?.surah || null;
  const resetFlexibleStartAyah = flexStartAyah || currentExternalUnit?.start?.ayah || (flexSurah?.start_ayah || 1);

  return {
    code,
    name,
    role: ROLES.STUDENT,
    halaqa: halaqaValue,
    parent_name: parentName,
    parent_code: parentCode,
    hifz_mode: hifzMode,
    flex_surah_index: existingStudent ? (existingStudent.flex_surah_index ?? 0) : 0,
    flex_surah_number: shouldResetExternalFlexible
      ? resetFlexibleSurahNumber
      : existingStudent
      ? (existingStudent.flex_surah_number ?? currentExternalUnit?.start?.surah ?? null)
      : (currentExternalUnit?.start?.surah ?? null),
    flex_next_ayah: shouldResetExternalFlexible
      ? resetFlexibleStartAyah
      : existingStudent
      ? (existingStudent.flex_next_ayah ?? currentExternalUnit?.start?.ayah ?? (flexSurah?.start_ayah || 1))
      : (currentExternalUnit?.start?.ayah ?? (flexSurah?.start_ayah || 1)),
    flexible_start: shouldResetExternalFlexible
      ? ({
          surah: resetFlexibleSurahNumber,
          surah_name: selectedFlexibleSurahName || currentExternalUnit?.start?.name || "",
          ayah: resetFlexibleStartAyah,
          page: currentExternalUnit?.start?.page ?? null,
        })
      : existingStudent
      ? (existingStudent.flexible_start ?? currentExternalUnit?.start ?? null)
      : (currentExternalUnit?.start ?? null),
    flexible_plan_start: shouldResetExternalFlexible
      ? ({
          surah: resetFlexibleSurahNumber,
          surah_name: selectedFlexibleSurahName || currentExternalUnit?.start?.name || "",
          ayah: resetFlexibleStartAyah,
          page: currentExternalUnit?.start?.page ?? null,
        })
      : existingStudent
      ? (existingStudent.flexible_plan_start ?? existingStudent.flexible_start ?? currentExternalUnit?.start ?? null)
      : (currentExternalUnit?.start ?? null),
    last_approved_hifz_end: shouldResetExternalFlexible
      ? null
      : existingStudent ? (existingStudent.last_approved_hifz_end ?? null) : null,
    hifz_start_id: effectiveHifzStartIndex,
    hifz_end_id: effectiveHifzEndIndex,
    hifz_progress: startingProgressIndex,
    hifz_level: hifzLevel,
    hifz_status: existingStudent ? (existingStudent.hifz_status || HIFZ_ACTIVE_STATUS) : HIFZ_ACTIVE_STATUS,
    hifz_pending_phase_id: existingStudent ? (existingStudent.hifz_pending_phase_id ?? null) : null,
    hifz_current_track_id: shouldResetExternalFlexible
      ? (currentExternalUnit?.trackId ?? null)
      : existingStudent
      ? (existingStudent.hifz_current_track_id ?? currentExternalUnit?.trackId ?? null)
      : (currentExternalUnit?.trackId ?? null),
    hifz_current_phase_id: shouldResetExternalFlexible
      ? (currentExternalPhase?.id ?? null)
      : existingStudent
      ? (existingStudent.hifz_current_phase_id ?? currentExternalPhase?.id ?? null)
      : (currentExternalPhase?.id ?? null),
    last_completed_hifz_unit_id: existingStudent ? (existingStudent.last_completed_hifz_unit_id ?? null) : null,
    last_completed_hifz_surah: existingStudent ? (existingStudent.last_completed_hifz_surah ?? null) : null,
    murajaa_level: murajaaLevel,
    murajaa_start_index: murajaaStartIndex,
    murajaa_progress_index: murajaaStartIndex,
    murajaa_cycles: existingStudent ? existingStudent.murajaa_cycles || 0 : 0,
    total_points: existingStudent ? existingStudent.total_points || 0 : 0,
    tasks: existingStudent ? existingStudent.tasks || [] : [],
    pause_hifz: existingStudent ? !!existingStudent.pause_hifz : false,
    pause_murajaa: existingStudent ? !!existingStudent.pause_murajaa : false,
    is_student_assistant: existingStudent ? !!existingStudent.is_student_assistant : false,
    is_parent_assistant: false,
  };
}

registerStudentButton?.addEventListener("click", async () => {
  const studentInput = readStudentFormInput();
  const validationError = getStudentFormValidationError(studentInput);

  if (validationError) {
    showMessage(registerStudentMessage, validationError, "error");
    return;
  }

  try {
    const halaqaCode = normalizeHalaqaCode(studentInput.halaqaValue);
    const halaqaRef = doc(db, "halaqas", halaqaCode);
    const halaqaSnap = await getDoc(halaqaRef);
    if (!halaqaSnap.exists()) {
      showMessage(registerStudentMessage, "الحلقة المحددة غير موجودة.", "error");
      return;
    }

    const studentRef = doc(db, "students", studentInput.code);
    const snap = await getDoc(studentRef);
    const existing = snap.exists() ? snap.data() : null;
    const baseData = buildStudentBaseData(studentInput, existing);

    await setDoc(studentRef, baseData, { merge: true });
    invalidateStudentsSnapshotCache();

    showMessage(registerStudentMessage, "تم حفظ بيانات الطالب.", "success");
    editingStudentCode = null;
    setStudentFormTitleForCreate();

    await loadStudentsForTeacher();
    await loadHonorBoard();
  } catch (e) {
    console.error("Error registerStudent:", e);
    showMessage(registerStudentMessage, `حدث خطأ في حفظ بيانات الطالب: ${e.message}`, "error");
  }
});


// =====================================================
// 13) تبويبات المعلم + نوع الحلقة + التحديث
// =====================================================

function hideTeacherTabs() {
  document.querySelectorAll(".tab-content").forEach((el) => el.classList.add("hidden"));
}

function setActiveTeacherTabButton(tabId) {
  document.querySelectorAll(".tab-button").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.tab === tabId)
  );
}

function showTeacherTabContent(tabId) {
  const target = document.getElementById(tabId);
  target?.classList.remove("hidden");
}

function buildTeacherTabViewContext(tabId) {
  return { tabId };
}

function renderTeacherTabView(viewContext) {
  hideTeacherTabs();
  setActiveTeacherTabButton(viewContext.tabId);
  showTeacherTabContent(viewContext.tabId);
}

function buildTeacherTabActivationContext(tabId) {
  return {
    tabId,
    viewContext: buildTeacherTabViewContext(tabId),
  };
}

function activateTab(tabId) {
  const activationContext = buildTeacherTabActivationContext(tabId);
  renderTeacherTabView(activationContext.viewContext);
  runTeacherTabAction(activationContext.tabId);
}

function buildTeacherTabClickHandler(tabId) {
  return () => activateTab(tabId);
}

function bindTeacherTabButtons() {
  tabButtons.forEach((btn) => btn.addEventListener("click", buildTeacherTabClickHandler(btn.dataset.tab)));
}

bindTeacherTabButtons();

function buildHalaqaToggleHandler(halaqaType) {
  return () => setCurrentHalaqa(halaqaType);
}

function bindHalaqaToggleButtons() {
  teacherHalaqaToggle?.addEventListener("click", (event) => {
    const dynamicButton = event.target.closest("[data-halaqa-value]");
    if (!dynamicButton) return;
    setCurrentHalaqa(dynamicButton.dataset.halaqaValue);
  });
}

bindHalaqaToggleButtons();

// شبكة الحلقة (tiles)
halaqaStudentsGrid?.addEventListener("click", async (e) => {
  const tile = e.target.closest(".halaqa-tile");
  if (!tile) return;

  const code = tile.dataset.code;
  if (!code) return;

  try {
    const student = await getStudentByCode(code);
    if (!student) {
      alertStudentOpenError("لم يتم العثور على بيانات هذا الطالب.");
      return;
    }
    await openStudentDashboardForUser(student, "HALAQA");
  } catch (err) {
    console.error("login from halaqa tile error:", err);
    alertStudentOpenError("حدث خطأ أثناء فتح حساب الطالب.");
  }
});

halaqaBackButton?.addEventListener("click", () => {
  clearCurrentSession();
  goToAuthScreen();
});

// =====================================================
// 14) تسجيل الدخول / الخروج
// =====================================================

async function getStudentByCode(code) {
  return fetchStudentByCodeFromService(db, code);
}

function buildStudentDashboardParams(student) {
  return {
    student,
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
    loadAssistantTasksForCurrentUser: loadCurrentUserAssistantTasks,
    generateUniqueId,
    getStudentEls,
    safeSetText,
    fetchStudentsSortedByPointsForHalaqa: (halaqaType) =>
      fetchStudentsSortedByPointsForHalaqaFromService(db, halaqaType),
    fetchStudentByCode: (code) => fetchStudentByCodeFromService(db, code),
    updatePlanStrip,
    CONFIG,
    hideAllScreens,
  };
}

function buildTeacherReviewParams() {
  return {
    db,
    reviewTask,
    nominateStudentHifzForTest,
    showMessage,
    authMessage,
    pendingTasksList,
    isInCurrentHalaqa,
    currentHalaqa,
  };
}

function buildAssistantTasksParams() {
  return {
    db,
    currentUser,
    studentAssistantTasksList,
    renderAssistantTasksList,
    reviewTask,
    showMessage,
    authMessage,
    loadAssistantTasksForCurrentUser: loadCurrentUserAssistantTasks,
  };
}

async function loadCurrentUserAssistantTasks() {
  if (!currentUser) return;
  await loadAssistantTasksForCurrentUser(buildAssistantTasksParams());
}

async function loadTeacherReviewTab() {
  await loadPendingTasksForReview(buildTeacherReviewParams());
}

function runTeacherTabAction(tabId) {
  if (tabId === TEACHER_REVIEW_TAB_ID) {
    loadTeacherReviewTab();
    return;
  }

  if (tabId === TEACHER_MANAGE_STUDENTS_TAB_ID) {
    loadStudentsForTeacher();
    return;
  }

  if (tabId === TEACHER_CURRICULUM_TAB_ID) {
    displayCurriculumsInTeacherPanel();
    loadHonorBoard();
  }
}

function clearCurrentSession() {
  currentUser = null;
  lastStudentEntrySource = null;
}

async function resolveAppLoginContext(rawCode) {
  return resolveLoginContext({
    db,
    rawCode,
    halaqaLoginCodes: HALAQA_LOGIN_CODES,
    fetchTeacherByCode,
    fetchStudentByCode: getStudentByCode,
  });
}

bindLoginButton();

bindLogoutButtons();

// =====================================================
// 15) التحديث (Refresh)
// =====================================================

async function refreshStudentView() {
  if (!canRefreshCurrentStudent()) {
    return;
  }
  try {
    await performCurrentStudentRefresh();
  } catch (e) {
    console.error("Error refreshStudentView:", e);
    showStudentRefreshError(e);
  }
}

async function loadCurrentStudentForRefresh() {
  return getStudentByCode(currentUser.code);
}

async function buildCurrentStudentRefreshContext() {
  const student = await loadCurrentStudentForRefresh();
  const reopenParams = student ? buildReopenCurrentStudentParams(student) : null;
  return {
    student,
    studentDashboardContext: reopenParams ? buildOpenStudentDashboardContext(reopenParams) : null,
  };
}

function buildReopenCurrentStudentParams(student) {
  return { code: currentUser.code, ...student };
}

async function reopenCurrentStudentDashboard(student, studentDashboardContext = buildOpenStudentDashboardContext(buildReopenCurrentStudentParams(student))) {
  await openStudentDashboardFromContext(studentDashboardContext);
}

function showMissingStudentRefreshMessage() {
  showMessage(authMessage, "تعذر العثور على بيانات الطالب.", "error");
}

function showStudentRefreshError(error) {
  showMessage(authMessage, `خطأ في تحديث بيانات الطالب: ${error.message}`, "error");
}

function canRefreshCurrentStudent() {
  if (currentUser?.code) return true;
  console.warn("No currentUser/code at refresh:", currentUser);
  return false;
}

async function performCurrentStudentRefresh() {
  const { student, studentDashboardContext } = await buildCurrentStudentRefreshContext();
  if (!student) {
    showMissingStudentRefreshMessage();
    return;
  }

  await reopenCurrentStudentDashboard(student, studentDashboardContext);
}

function bindStudentRefreshButton() {
  refreshStudentButton?.addEventListener("click", refreshStudentView);
}

function bindTeacherRefreshButton() {
  refreshTeacherButton?.addEventListener("click", refreshTeacherView);
}

function bindRefreshButtons() {
  bindStudentRefreshButton();
  bindTeacherRefreshButton();
}

function getActiveTeacherTabId() {
  const activeButton = document.querySelector('.tab-button.active[data-tab]');
  if (activeButton?.dataset?.tab) {
    return activeButton.dataset.tab;
  }

  const active = document.querySelector(".tab-content:not(.hidden)");
  return active ? active.id : null;
}

function runActiveTeacherTabAction() {
  const id = getActiveTeacherTabId();
  if (!id) return;
  runTeacherTabAction(id);
}

function refreshTeacherView() {
  invalidateStudentsSnapshotCache();
  runActiveTeacherTabAction();
}

function readAssignmentFormInput() {
  return {
    type: assignTaskType.value,
    description: assignTaskDescription.value.trim(),
    points: parseInt(assignTaskPoints.value, 10),
  };
}

function readIndividualAssignmentInput() {
  return {
    code: assignTaskStudentCode.value.trim(),
    ...readAssignmentFormInput(),
  };
}

function readGroupAssignmentInput() {
  return readAssignmentFormInput();
}

function isValidAssignmentPayload({ description, points }) {
  return !!description && !isNaN(points) && points > 0;
}

function isValidIndividualAssignmentPayload({ code, description, points }) {
  return !!code && isValidAssignmentPayload({ description, points });
}

function showAssignmentValidationError(message) {
  showMessage(assignTaskMessage, message, "error");
}

function showAssignmentSuccess(message) {
  showMessage(assignTaskMessage, message, "success");
}

function showAssignmentFailure(message) {
  showMessage(assignTaskMessage, message, "error");
}

function buildAssignmentTaskPayload({ type, description, points }) {
  return buildAssignedTask({
    id: generateUniqueId(),
    type,
    description,
    points,
    createdAt: Date.now(),
  });
}

function handleIndividualAssignmentResult(result) {
  if (!result.ok) {
    showAssignmentFailure("الطالب غير موجود.");
    return false;
  }

  showAssignmentSuccess("تم تعيين المهمة للطالب.");
  return true;
}

function handleGroupAssignmentSuccess() {
  showAssignmentSuccess("تم تعيين المهمة لجميع الطلاب.");
}

function handleAssignmentRuntimeError(error, logLabel, failureMessage) {
  console.error(logLabel, error);
  showAssignmentFailure(`${failureMessage}: ${error.message}`);
}

function buildAssignmentRuntimeErrorContext(logLabel, failureMessage) {
  return { logLabel, failureMessage };
}

function handleAssignmentActionError(error, errorContext) {
  handleAssignmentRuntimeError(error, errorContext.logLabel, errorContext.failureMessage);
}

function buildIndividualAssignmentActionContext() {
  const { code, type, description, points } = readIndividualAssignmentInput();

  return {
    code,
    type,
    description,
    points,
    validationMessage: isValidIndividualAssignmentPayload({ code, description, points })
      ? null
      : "الرجاء تعبئة رمز الطالب والوصف والنقاط بشكل صحيح.",
    task: buildAssignmentTaskPayload({ type, description, points }),
  };
}

function buildGroupAssignmentActionContext() {
  const { type, description, points } = readGroupAssignmentInput();

  return {
    type,
    description,
    points,
    validationMessage: isValidAssignmentPayload({ description, points })
      ? null
      : "الرجاء تعبئة الوصف والنقاط بشكل صحيح.",
    task: buildAssignmentTaskPayload({ type, description, points }),
  };
}

function handleAssignmentValidationMessage(validationMessage) {
  if (!validationMessage) return false;
  showAssignmentValidationError(validationMessage);
  return true;
}

async function runIndividualAssignmentAction(actionContext) {
  if (handleAssignmentValidationMessage(actionContext.validationMessage)) {
    return;
  }

  try {
    const result = await assignTaskToStudent(db, actionContext.code, actionContext.task);
    handleIndividualAssignmentResult(result);
  } catch (e) {
    handleAssignmentActionError(
      e,
      buildAssignmentRuntimeErrorContext("Error assignIndividualTask:", "حدث خطأ في تعيين المهمة")
    );
  }
}

async function runGroupAssignmentAction(actionContext) {
  if (handleAssignmentValidationMessage(actionContext.validationMessage)) {
    return;
  }

  try {
    await assignTaskToHalaqa(db, currentHalaqa, actionContext.task);
    handleGroupAssignmentSuccess();
  } catch (e) {
    handleAssignmentActionError(
      e,
      buildAssignmentRuntimeErrorContext("Error assignGroupTask:", "حدث خطأ في تعيين المهمة الجماعية")
    );
  }
}

bindRefreshButtons();

// =====================================================
// 16) تعيين مهام (Teacher Assign Buttons)
// =====================================================

assignIndividualTaskButton?.addEventListener("click", async () => {
  await runIndividualAssignmentAction(buildIndividualAssignmentActionContext());
});

assignGroupTaskButton?.addEventListener("click", async () => {
  await runGroupAssignmentAction(buildGroupAssignmentActionContext());
});

// =====================================================
// 17) تبويبات الطالب (مهامي / مهام المساعد)
// =====================================================

function setActiveStudentTabButton(tabId) {
  studentTabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));
}

function buildStudentTabViewState(tabId) {
  const isAssistantTab = isStudentAssistantTab(tabId);

  return {
    tabId,
    isAssistantTab,
    showMainTasks: tabId === STUDENT_MAIN_TAB_ID,
    showAssistantTasks: isAssistantTab,
    showProgress: !isAssistantTab,
  };
}

function toggleStudentTabSections(viewState) {
  if (!studentMainTasksSection || !studentAssistantTabSection) return;

  studentMainTasksSection.classList.toggle("hidden", !viewState.showMainTasks);
  studentAssistantTabSection.classList.toggle("hidden", !viewState.showAssistantTasks);
}

function toggleStudentProgressSection(viewState) {
  const progressSection = document.querySelector(".progress-section");
  if (!progressSection) return;

  progressSection.classList.toggle("hidden", !viewState.showProgress);
}

function renderStudentTabViewState(viewState) {
  toggleStudentTabSections(viewState);
  setActiveStudentTabButton(viewState.tabId);
  toggleStudentProgressSection(viewState);
}

function updateStudentTabUI(tabId) {
  renderStudentTabViewState(buildStudentTabViewState(tabId));
}

function isStudentAssistantTab(tabId) {
  return tabId === STUDENT_ASSISTANT_TAB_ID;
}

function loadStudentAssistantTab() {
  loadCurrentUserAssistantTasks();
}

function buildStudentTabActionContext(tabId) {
  return {
    tabId,
    shouldLoadAssistantTasks: isStudentAssistantTab(tabId),
  };
}

function runStudentTabAction(actionContext) {
  if (actionContext.shouldLoadAssistantTasks) {
    loadStudentAssistantTab();
  }
}

function buildStudentTabActivationContext(tabId) {
  return {
    tabId,
    viewState: buildStudentTabViewState(tabId),
    actionContext: buildStudentTabActionContext(tabId),
  };
}

function handleStudentTabActivation(tabId) {
  const { viewState, actionContext } = buildStudentTabActivationContext(tabId);
  renderStudentTabViewState(viewState);
  runStudentTabAction(actionContext);
}

function buildStudentTabClickHandler(tabId) {
  return () => handleStudentTabActivation(tabId);
}

function bindStudentTabButtons() {
  studentTabButtons.forEach((btn) => {
    btn.addEventListener("click", buildStudentTabClickHandler(btn.dataset.tab));
  });
}

function bindStudentUIActions() {
  bindStudentRefreshButton();
  bindStudentTabButtons();
}

bindStudentUIActions();

window.runDataIntegrityReport = async function () {
  const report = await getDataIntegrityReport(db);
  console.log("[data-integrity] project:", db.app.options.projectId);
  console.log("[data-integrity] report:", report);
  return report;
};

window.getDataIntegrityReport = getDataIntegrityReport;
// =====================================================
// 18) البحث في قائمة الطلاب (Teacher Search)
// =====================================================
let teacherSearchBound = false;

function filterTeacherStudentList(query) {
  const normalizedQuery = (query || "").trim().toLowerCase();

  document.querySelectorAll("#student-list li").forEach((li) => {
    const haystack = li.dataset.search || li.textContent.toLowerCase();
    li.style.display = !normalizedQuery || haystack.includes(normalizedQuery) ? "" : "none";
  });
}

function bindTeacherStudentSearch() {
  const input = document.getElementById("student-search");
  if (!input || teacherSearchBound) return;

  const applyFilter = () => filterTeacherStudentList(input.value || "");
  input.addEventListener("input", applyFilter);
  input.addEventListener("keyup", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      applyFilter();
    }
  });

  teacherSearchBound = true;
}
const _oldLoadStudentsForTeacher = loadStudentsForTeacher;
loadStudentsForTeacher = async function () {
  await _oldLoadStudentsForTeacher();
  bindTeacherStudentSearch();
};
// =====================================================
// 19) تفاعل بطاقة الطالب (السهم السفلي) + قلب chip-toggle بصرياً
// =====================================================
// فتح/إغلاق التفاصيل
document.addEventListener("click", (e) => {
  const notch = e.target.closest(".toggle-details");
  if (!notch) return;

  const card = notch.closest(".student-card");
  const details = card.querySelector(".student-details");
  const open = !details.classList.contains("hidden");

  details.classList.toggle("hidden", open);
  card.classList.toggle("details-open", !open);
  notch.setAttribute("aria-expanded", String(!open));
});
// =====================================================
// 20) تهيئة أولية
// =====================================================
populateHifzSelects();
populateMurajaaStartSelect();
updateHalaqaToggleUI();
populateFlexibleSurahSelect();
syncHifzTypeUI();
// =====================================================
// Init
// =====================================================
console.log("App ready. Curriculum loaded from external file with assistants & pause flags.");

