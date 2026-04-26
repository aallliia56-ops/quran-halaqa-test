import { getScreenElements } from "./dom.js";

export function createRoleRouter(options) {
  const {
    dom,
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
    buildStudentDashboardParams,
    ROLES,
    setCurrentUser,
    setCurrentHalaqa,
    setLastStudentEntrySource,
    setLastHalaqaLoginCode,
    setLastHalaqaType,
  } = options;

  function hideAllScreens() {
    hideElements(getScreenElements(dom));
  }

  function goToAuthScreen({ clearInput = true, message = null, messageType = "success" } = {}) {
    hideAllScreens();
    dom.authScreen.classList.remove("hidden");

    if (clearInput) {
      dom.userCodeInput.value = "";
    }

    if (message) {
      showMessage(authMessage, message, messageType);
    }
  }

  function clearStudentEntrySource() {
    setLastStudentEntrySource(null);
  }

  function buildOpenStudentDashboardContext(student) {
    return {
      student,
      dashboardParams: buildStudentDashboardParams(student),
    };
  }

  async function openStudentDashboard(student) {
    const { dashboardParams } = buildOpenStudentDashboardContext(student);
    await displayStudentDashboard(dashboardParams);
  }

  async function openStudentDashboardFromContext(studentDashboardContext) {
    await displayStudentDashboard(studentDashboardContext.dashboardParams);
  }

  async function openTeacherDashboard() {
    await initializeTeacherHalaqaState();
    hideAllScreens();
    dom.teacherScreen.classList.remove("hidden");
    await refreshTeacherView?.();
  }

  async function openDirectorDashboard(user) {
    setCurrentUser(user);
    clearStudentEntrySource();
    await displayDirectorDashboard({
      ...options.directorDashboardParams(),
      hideAllScreens,
      onLogout: options.getLogout(),
    });
  }

  async function openAssistantDashboard(user) {
    setCurrentUser(user);
    clearStudentEntrySource();
    await displayAssistantDashboard({
      db: options.db,
      hideAllScreens,
      onLogout: options.getLogout(),
    });
  }

  async function openHalaqaDashboard(loginCode, halaqaType) {
    setCurrentHalaqa(halaqaType);
    setLastHalaqaLoginCode(loginCode);
    setLastHalaqaType(halaqaType);
    clearStudentEntrySource();
    await displayHalaqaScreen(loginCode, halaqaType);
  }

  async function openParentDashboard(parentCode, user) {
    setCurrentUser(user);
    clearStudentEntrySource();
    await displayParentDashboard(parentCode);
  }

  function buildStudentUserSession(student, entrySource) {
    return {
      currentUser: { role: ROLES.STUDENT, code: student.code },
      lastStudentEntrySource: entrySource,
    };
  }

  function applyStudentUserSession(studentSession) {
    setCurrentUser(studentSession.currentUser);
    setLastStudentEntrySource(studentSession.lastStudentEntrySource);
  }

  function buildOpenStudentDashboardForUserContext(student, entrySource) {
    return {
      studentSession: buildStudentUserSession(student, entrySource),
      studentDashboardContext: buildOpenStudentDashboardContext(student),
    };
  }

  async function openStudentDashboardForUser(student, entrySource) {
    const { studentSession, studentDashboardContext } = buildOpenStudentDashboardForUserContext(student, entrySource);
    applyStudentUserSession(studentSession);
    await openStudentDashboardFromContext(studentDashboardContext);
  }

  function showStudentNotFoundMessage() {
    showMessage(authMessage, "لم يتم العثور على طالب بهذا الرمز", "error");
  }

  function alertStudentOpenError(message) {
    alert(message);
  }

  async function handleHalaqaLoginContext(loginContext) {
    await openHalaqaDashboard(loginContext.halaqaCode, loginContext.halaqaType);
  }

  async function handleTeacherLoginContext(loginContext) {
    setCurrentUser(loginContext.user);
    if (loginContext.user?.halaqa) {
      setCurrentHalaqa(loginContext.user.halaqa);
      updateHalaqaToggleUI();
    }
    clearStudentEntrySource();
    await openTeacherDashboard();
  }

  async function handleDirectorLoginContext(loginContext) {
    await openDirectorDashboard(loginContext.user);
  }

  async function handleAssistantLoginContext(loginContext) {
    await openAssistantDashboard(loginContext.user);
  }

  async function handleParentLoginContext(rawCode, loginContext) {
    await openParentDashboard(rawCode, loginContext.user);
  }

  function handleNotFoundLoginContext() {
    showStudentNotFoundMessage();
  }

  async function handleStudentLoginContext(loginContext) {
    await openStudentDashboardForUser(loginContext.student, "DIRECT");
  }

  return {
    hideAllScreens,
    goToAuthScreen,
    clearStudentEntrySource,
    buildOpenStudentDashboardContext,
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
  };
}
