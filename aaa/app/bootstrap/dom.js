export function createAppDom() {
  const $ = (selector) => document.querySelector(selector);

  const dom = {
    authScreen: $("#auth-screen"),
    userCodeInput: $("#user-code"),
    loginButton: $("#login-button"),
    authMessage: $("#auth-message"),

    tabButtons: document.querySelectorAll(".tab-button"),

    halaqaOnsiteBtn: $("#halaqa-onsite-btn"),
    halaqaOnlineBtn: $("#halaqa-online-btn"),

    studentScreen: $("#student-screen"),
    welcomeStudent: $("#welcome-student"),
    studentPlanStrip: $("#student-plan-strip"),
    stripPlan: $("#strip-plan"),
    stripPoints: $("#strip-points"),
    stripRank: $("#strip-rank"),
    studentPlanLine: $("#student-plan-line"),
    studentHifzNextLabel: $("#student-hifz-next-label"),
    studentMurajaaNextLabel: $("#student-murajaa-next-label"),
    studentHifzProgressLabel: $("#student-hifz-progress-label"),
    studentMurajaaProgressLabel: $("#student-murajaa-progress-label"),
    studentHifzProgressBar: $("#student-hifz-progress-bar"),
    studentMurajaaProgressBar: $("#student-murajaa-progress-bar"),
    studentHifzProgressPercent: $("#student-hifz-progress-percent"),
    studentMurajaaProgressPercent: $("#student-murajaa-progress-percent"),
    studentMurajaaLevelLabel: $("#student-murajaa-level-label"),
    studentTotalPoints: $("#student-total-points"),
    studentRankText: $("#student-rank-text"),
    studentTasksDiv: $("#student-tasks"),
    logoutButtonStudent: $("#logout-button-student"),
    refreshStudentButton: $("#refresh-student-button"),
    studentWeekStrip: $("#student-week-strip"),
    studentMainTasksSection: $("#student-main-tasks"),
    studentAssistantTabSection: $("#student-assistant-tab"),
    studentTabButtons: document.querySelectorAll(".student-tab-button"),
    studentAssistantTasksList: $("#student-assistant-tasks"),

    teacherScreen: $("#teacher-screen"),
    logoutButtonTeacher: $("#logout-button-teacher"),
    refreshTeacherButton: $("#refresh-teacher-button"),

    assignTaskStudentCode: $("#assign-task-student-code"),
    assignTaskType: $("#assign-task-type"),
    assignTaskDescription: $("#assign-task-description"),
    assignTaskPoints: $("#assign-task-points"),
    assignIndividualTaskButton: $("#assign-individual-task-button"),
    assignGroupTaskButton: $("#assign-group-task-button"),
    assignTaskMessage: $("#assign-task-message"),

    studentList: $("#student-list"),
    studentFormTitle: $("#student-form-title"),
    newStudentCodeInput: $("#new-student-code"),
    newStudentNameInput: $("#new-student-name"),
    newStudentParentNameInput: $("#new-student-parent-name"),
    newStudentParentCodeInput: $("#new-student-parent-code"),
    newStudentHifzStart: $("#new-student-hifz-start"),
    newStudentHifzEnd: $("#new-student-hifz-end"),
    newStudentHifzLevel: $("#new-student-hifz-level"),
    newStudentMurajaaLevel: $("#new-student-murajaa-level"),
    newStudentMurajaaStart: $("#new-student-murajaa-start"),
    newStudentHalaqa: $("#new-student-halaqa"),
    registerStudentButton: $("#register-student-button"),
    registerStudentMessage: $("#register-student-message"),
    newStudentHifzType: $("#new-student-hifz-type"),
    newStudentFlexibleSurah: $("#new-student-flexible-surah"),
    fixedHifzGroup: $("#fixed-hifz-group"),
    flexibleSurahGroup: $("#flexible-surah-group"),
    STUDENT_HIFZ_PHASE_SELECT_ID: "new-student-hifz-phase",
    STUDENT_FLEXIBLE_AYAH_SELECT_ID: "new-student-flexible-ayah",

    btnOpenStudentForm: document.getElementById("open-student-form"),
    btnCloseStudentForm: document.getElementById("close-student-form"),
    studentFormWrapper: document.getElementById("student-form-wrapper"),
    halaqaSegment: document.getElementById("halaqa-segment"),

    hifzCurriculumDisplay: $("#hifz-curriculum-display"),
    murajaaCurriculumDisplay: $("#murajaa-curriculum-display"),
    pendingTasksList: $("#pending-tasks-list"),
    honorBoardDiv: $("#honor-board"),

    parentScreen: $("#parent-screen"),
    welcomeParent: $("#welcome-parent"),
    logoutButtonParent: $("#logout-button-parent"),
    parentChildrenList: $("#parent-children-list"),

    halaqaScreen: $("#halaqa-screen"),
    halaqaTitle: $("#halaqa-title"),
    halaqaSubtitle: $("#halaqa-subtitle"),
    halaqaBackButton: $("#halaqa-back-button"),
    halaqaStudentsGrid: $("#halaqa-students-grid"),

    assistantScreen: $("#assistant-screen"),
    directorScreen: $("#director-screen"),
  };

  dom.teacherHalaqaToggle = dom.teacherScreen?.querySelector(".dashboard-header .halaqa-toggle");
  dom.initialTeacherHalaqaToggleHtml = dom.teacherHalaqaToggle?.innerHTML || "";

  return dom;
}

export function getStudentElsFromDom(dom) {
  return {
    welcome: dom.welcomeStudent,
    hifzLabel: dom.studentHifzProgressLabel,
    murLabel: dom.studentMurajaaProgressLabel,
    hifzBar: dom.studentHifzProgressBar,
    murBar: dom.studentMurajaaProgressBar,
    hifzPct: dom.studentHifzProgressPercent,
    murPct: dom.studentMurajaaProgressPercent,
    murLevel: dom.studentMurajaaLevelLabel,
    totalPoints: dom.studentTotalPoints,
    rankText: dom.studentRankText,
    studentHifzNextLabel: dom.studentHifzNextLabel,
    studentMurajaaNextLabel: dom.studentMurajaaNextLabel,
  };
}

export function getScreenElements(dom) {
  return [
    dom.authScreen,
    dom.studentScreen,
    dom.teacherScreen,
    dom.parentScreen,
    dom.halaqaScreen,
    document.querySelector("#assistant-screen"),
    document.querySelector("#director-screen"),
  ];
}
