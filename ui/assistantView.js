import {
  ASSISTANT_DEFAULT_TAB_ID,
  ASSISTANT_TAB_IDS,
  buildAssistantTabDefinitions,
} from "../modules/assistant/assistant.config.js";
import { PROGRAM_STATUSES, PROGRAM_TYPES } from "../modules/programs/program-engine.js";
import { fetchAssistantDashboardData } from "../modules/assistant/assistant.service.js";

function getAssistantTabLabel(label) {
  const labelMap = {
    Overview: "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629",
    Halaqas: "\u0627\u0644\u062d\u0644\u0642\u0627\u062a",
    Programs: "\u0627\u0644\u0628\u0631\u0627\u0645\u062c",
  };

  return labelMap[label] || label;
}

function getProgramTypeLabel(programType) {
  const labelMap = {
    [PROGRAM_TYPES.DAILY_STREAK]: "\u0633\u0644\u0633\u0644\u0629 \u064a\u0648\u0645\u064a\u0629",
  };

  return labelMap[programType] || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f";
}

function getProgramStatusLabel(programStatus) {
  const labelMap = {
    [PROGRAM_STATUSES.DRAFT]: "\u0645\u0633\u0648\u062f\u0629",
    [PROGRAM_STATUSES.ACTIVE]: "\u0646\u0634\u0637",
    [PROGRAM_STATUSES.PAUSED]: "\u0645\u062a\u0648\u0642\u0641",
    [PROGRAM_STATUSES.ENDED]: "\u0645\u0646\u062a\u0647\u064a",
    [PROGRAM_STATUSES.ARCHIVED]: "\u0645\u0624\u0631\u0634\u0641",
  };

  return labelMap[programStatus] || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f";
}

function buildAssistantTabButtonsHtml(activeTabId = ASSISTANT_DEFAULT_TAB_ID) {
  return buildAssistantTabDefinitions()
    .map(
      (tab) => `
        <button
          class="tab-button${tab.id === activeTabId ? " active" : ""}"
          data-assistant-tab="${tab.id}"
        >
          ${getAssistantTabLabel(tab.label)}
        </button>
      `
    )
    .join("");
}

function buildAssistantSummaryCard(title, value) {
  return `
    <div class="progress-card">
      <h3 style="text-align:right;">${title}</h3>
      <p class="progress-percent" style="margin-top:.5rem;">${value}</p>
    </div>
  `;
}

function buildAssistantHalaqaItem(summary) {
  return `
    <div class="task-card">
      <div class="task-header">
        <div class="task-title">${summary.halaqa}</div>
        <span class="task-type-tag general">\u062d\u0644\u0642\u0629</span>
      </div>
      <div class="task-body mission-text" style="line-height:1.9">
        <div>\u0627\u0644\u0637\u0644\u0627\u0628: <strong>${summary.studentCount}</strong></div>
        <div>\u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0646\u0634\u0637\u064a\u0646: <strong>${summary.activeStudentsCount}</strong></div>
        <div>\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0646\u0642\u0627\u0637: <strong>${summary.totalPoints}</strong></div>
      </div>
    </div>
  `;
}

function buildAssistantOverviewHtml(overview) {
  const halaqaCards = overview.halaqaSummaries.length
    ? overview.halaqaSummaries.map(buildAssistantHalaqaItem).join("")
    : '<p class="message info">\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0644\u0642\u0627\u062a \u0645\u062a\u0627\u062d\u0629 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646.</p>';

  return `
    <section class="tasks-section">
      <div class="progress-section">
        ${buildAssistantSummaryCard("\u0627\u0644\u0637\u0644\u0627\u0628", overview.totalStudents)}
        ${buildAssistantSummaryCard("\u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0646\u0634\u0637\u0648\u0646", overview.activeStudentsCount)}
        ${buildAssistantSummaryCard("\u0627\u0644\u062d\u0644\u0642\u0627\u062a", overview.totalHalaqas)}
        ${buildAssistantSummaryCard("\u0627\u0644\u0628\u0631\u0627\u0645\u062c \u0627\u0644\u0646\u0634\u0637\u0629", overview.activeProgramsCount)}
      </div>
    </section>

    <section class="tasks-section">
      <h3 style="text-align:right;">\u0645\u062a\u0627\u0628\u0639\u0629 \u0633\u0631\u064a\u0639\u0629 \u0644\u0644\u062d\u0644\u0642\u0627\u062a</h3>
      <div class="tasks-list">
        ${halaqaCards}
      </div>
    </section>
  `;
}

function buildAssistantProgramsHtml(activePrograms = []) {
  const programsHtml = activePrograms.length
    ? activePrograms.map((program) => `
        <div class="task-card">
          <div class="task-header">
            <div class="task-title">${program.name || "\u0628\u0631\u0646\u0627\u0645\u062c"}</div>
            <span class="task-type-tag general">\u0628\u0631\u0646\u0627\u0645\u062c</span>
          </div>
          <div class="task-body mission-text" style="line-height:1.9">
            <div>\u0627\u0644\u0646\u0648\u0639: <strong>${getProgramTypeLabel(program.type)}</strong></div>
            <div>\u0627\u0644\u062d\u0627\u0644\u0629: <strong>${getProgramStatusLabel(program.status)}</strong></div>
          </div>
        </div>
      `).join("")
    : '<p class="message info">\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u0631\u0627\u0645\u062c \u0646\u0634\u0637\u0629 \u062d\u0627\u0644\u064a\u064b\u0627.</p>';

  return `
    <section class="tasks-section">
      <div class="progress-section">
        ${buildAssistantSummaryCard("\u0627\u0644\u0628\u0631\u0627\u0645\u062c \u0627\u0644\u0646\u0634\u0637\u0629", activePrograms.length)}
      </div>
    </section>

    <section class="tasks-section">
      <h3 style="text-align:right;">\u0627\u0644\u0628\u0631\u0627\u0645\u062c</h3>
      <div class="tasks-list">
        ${programsHtml}
      </div>
    </section>
  `;
}

function buildAssistantHalaqasHtml(halaqas = []) {
  const content = halaqas.length
    ? halaqas.map(buildAssistantHalaqaItem).join("")
    : '<p class="message info">\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0644\u0642\u0627\u062a \u0645\u062a\u0627\u062d\u0629 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646.</p>';

  return `
    <section class="tasks-section">
      <h3 style="text-align:right;">\u0627\u0644\u062d\u0644\u0642\u0627\u062a</h3>
      <div class="tasks-list">
        ${content}
      </div>
    </section>
  `;
}

function ensureAssistantScreen() {
  let assistantScreen = document.querySelector("#assistant-screen");
  if (assistantScreen) return assistantScreen;

  assistantScreen = document.createElement("div");
  assistantScreen.id = "assistant-screen";
  assistantScreen.className = "container hidden";
  assistantScreen.dir = "rtl";
  assistantScreen.style.textAlign = "right";
  assistantScreen.innerHTML = `
    <header class="dashboard-header">
      <div>
        <div>
          <h2 id="assistant-title">\u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0633\u0627\u0639\u062f</h2>
          <p id="assistant-subtitle" class="subtitle">\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629\u060c \u0627\u0644\u062d\u0644\u0642\u0627\u062a\u060c \u0648\u0627\u0644\u0628\u0631\u0627\u0645\u062c</p>
        </div>
      </div>
      <div class="header-actions">
        <button id="assistant-refresh-button" class="button primary">\u062a\u062d\u062f\u064a\u062b</button>
        <button id="assistant-logout-button" class="button danger">\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c</button>
      </div>
    </header>

    <nav id="assistant-tabs" class="tabs"></nav>
    <section class="tab-content-container">
      <div id="assistant-content" class="tab-content"></div>
    </section>
  `;

  document.body.appendChild(assistantScreen);
  return assistantScreen;
}

function renderAssistantDashboardShell(activeTabId = ASSISTANT_DEFAULT_TAB_ID) {
  const assistantScreen = ensureAssistantScreen();
  const tabsContainer = assistantScreen.querySelector("#assistant-tabs");
  const contentContainer = assistantScreen.querySelector("#assistant-content");

  if (tabsContainer) {
    tabsContainer.innerHTML = buildAssistantTabButtonsHtml(activeTabId);
  }

  if (contentContainer) {
    contentContainer.innerHTML = '<p class="message info">\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0633\u0627\u0639\u062f...</p>';
  }

  return {
    assistantScreen,
    tabsContainer,
    contentContainer,
  };
}

function buildAssistantTabContentHtml(activeTabId, dashboardData) {
  if (activeTabId === ASSISTANT_TAB_IDS.HALAQAS) {
    return buildAssistantHalaqasHtml(dashboardData.halaqas);
  }

  if (activeTabId === ASSISTANT_TAB_IDS.PROGRAMS) {
    return buildAssistantProgramsHtml(dashboardData.activePrograms);
  }

  return buildAssistantOverviewHtml(dashboardData.overview);
}

function setActiveAssistantTab(tabsContainer, activeTabId) {
  tabsContainer?.querySelectorAll("[data-assistant-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.assistantTab === activeTabId);
  });
}

function renderAssistantTabContent(contentContainer, activeTabId, dashboardData) {
  if (!contentContainer) return;
  contentContainer.innerHTML = buildAssistantTabContentHtml(activeTabId, dashboardData);
}

function bindAssistantTabButtons({ tabsContainer, contentContainer, dashboardData }) {
  if (!tabsContainer) return;

  tabsContainer.onclick = (event) => {
    const tabButton = event.target.closest("[data-assistant-tab]");
    if (!tabButton) return;

    const activeTabId = tabButton.dataset.assistantTab || ASSISTANT_DEFAULT_TAB_ID;
    setActiveAssistantTab(tabsContainer, activeTabId);
    renderAssistantTabContent(contentContainer, activeTabId, dashboardData);
  };
}

export async function displayAssistantDashboard({
  db,
  hideAllScreens,
  onLogout,
  initialActiveTab = ASSISTANT_DEFAULT_TAB_ID,
}) {
  const { assistantScreen, tabsContainer, contentContainer } = renderAssistantDashboardShell(initialActiveTab);
  const logoutButton = assistantScreen.querySelector("#assistant-logout-button");
  const refreshButton = assistantScreen.querySelector("#assistant-refresh-button");

  try {
    const dashboardData = await fetchAssistantDashboardData(db);

    setActiveAssistantTab(tabsContainer, initialActiveTab);
    renderAssistantTabContent(contentContainer, initialActiveTab, dashboardData);
    bindAssistantTabButtons({ tabsContainer, contentContainer, dashboardData });
    if (refreshButton) {
      refreshButton.onclick = async () => {
        const activeTabId =
          assistantScreen.querySelector("[data-assistant-tab].active")?.dataset.assistantTab
          || initialActiveTab;
        await displayAssistantDashboard({ db, hideAllScreens, onLogout, initialActiveTab: activeTabId });
      };
    }
    if (logoutButton) {
      logoutButton.onclick = () => onLogout?.();
    }

    hideAllScreens?.();
    assistantScreen.classList.remove("hidden");
  } catch (error) {
    if (contentContainer) {
      contentContainer.innerHTML = `<p class="message error">\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0633\u0627\u0639\u062f: ${error.message}</p>`;
    }
  }
}

export {
  ensureAssistantScreen,
  renderAssistantDashboardShell,
  buildAssistantOverviewHtml,
};
