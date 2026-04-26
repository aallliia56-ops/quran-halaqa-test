export function createAuthFlow(options) {
  const {
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
    getCurrentUser,
    isStudentUser,
    getLastStudentEntrySource,
    getLastHalaqaLoginCode,
    getLastHalaqaType,
    clearCurrentSession,
    hideAllScreens,
    displayHalaqaScreen,
    goToAuthScreen,
  } = options;

  function readLoginCodeInput() {
    return dom.userCodeInput.value.trim();
  }

  function getLoginCodeValidationMessage(rawCode) {
    if (rawCode) return null;
    return "الرجاء إدخال رمز الدخول";
  }

  function showLoginCodeValidationError(message) {
    showMessage(authMessage, message, "error");
  }

  function buildLoginActionContext(rawCode, loginContext) {
    return {
      rawCode,
      loginContext,
      loginKind: loginContext.kind,
    };
  }

  async function runLoginAction(actionContext) {
    const { rawCode, loginContext, loginKind } = actionContext;

    if (loginKind === "halaqa") {
      await handleHalaqaLoginContext(loginContext);
      return;
    }

    if (loginKind === "teacher") {
      await handleTeacherLoginContext(loginContext);
      return;
    }

    if (loginKind === "director") {
      await handleDirectorLoginContext(loginContext);
      return;
    }

    if (loginKind === "assistant") {
      await handleAssistantLoginContext(loginContext);
      return;
    }

    if (loginKind === "parent") {
      await handleParentLoginContext(rawCode, loginContext);
      return;
    }

    if (loginKind === "not_found") {
      handleNotFoundLoginContext();
      return;
    }

    await handleStudentLoginContext(loginContext);
  }

  function showLoginRuntimeError() {
    showMessage(authMessage, "حدث خطأ أثناء تسجيل الدخول", "error");
  }

  async function handleLoginButtonClick() {
    const rawCode = readLoginCodeInput();
    const validationMessage = getLoginCodeValidationMessage(rawCode);
    if (validationMessage) {
      showLoginCodeValidationError(validationMessage);
      return;
    }

    try {
      const loginContext = await resolveAppLoginContext(rawCode);
      await runLoginAction(buildLoginActionContext(rawCode, loginContext));
    } catch (error) {
      console.error("login error:", error);
      showLoginRuntimeError();
    }
  }

  function bindLoginButton() {
    dom.loginButton.addEventListener("click", handleLoginButtonClick);
  }

  function shouldReturnToHalaqaAfterLogout() {
    return (
      isStudentUser(getCurrentUser()) &&
      getLastStudentEntrySource() === "HALAQA" &&
      getLastHalaqaLoginCode() &&
      getLastHalaqaType()
    );
  }

  function logoutToHalaqaScreen() {
    clearCurrentSession();
    hideAllScreens();
    displayHalaqaScreen(getLastHalaqaLoginCode(), getLastHalaqaType());
  }

  function logoutToAuthScreen() {
    clearCurrentSession();
    goToAuthScreen({ message: "تم تسجيل الخروج بنجاح.", messageType: "success" });
  }

  function buildLogoutActionContext() {
    return {
      shouldReturnToHalaqa: shouldReturnToHalaqaAfterLogout(),
    };
  }

  function runLogoutAction(actionContext) {
    if (actionContext.shouldReturnToHalaqa) {
      return logoutToHalaqaScreen();
    }

    logoutToAuthScreen();
  }

  function logout() {
    return runLogoutAction(buildLogoutActionContext());
  }

  function bindLogoutButtons() {
    dom.logoutButtonStudent?.addEventListener("click", logout);
    dom.logoutButtonTeacher?.addEventListener("click", logout);
    dom.logoutButtonParent?.addEventListener("click", logout);
  }

  return {
    handleLoginButtonClick,
    bindLoginButton,
    logout,
    bindLogoutButtons,
  };
}
