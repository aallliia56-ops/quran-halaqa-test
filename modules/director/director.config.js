const DIRECTOR_TAB_IDS = {
  OVERVIEW: "director-overview",
  HALAQAS: "director-halaqas",
  ACCOUNTS: "director-accounts",
  REPORTS: "director-reports",
  SETTINGS: "director-settings",
};

const DIRECTOR_DEFAULT_TAB_ID = DIRECTOR_TAB_IDS.OVERVIEW;

function buildDirectorTabDefinitions() {
  return [
    { id: DIRECTOR_TAB_IDS.OVERVIEW, label: "Overview" },
    { id: DIRECTOR_TAB_IDS.HALAQAS, label: "Halaqas" },
    { id: DIRECTOR_TAB_IDS.ACCOUNTS, label: "Accounts" },
    { id: DIRECTOR_TAB_IDS.REPORTS, label: "Reports" },
    { id: DIRECTOR_TAB_IDS.SETTINGS, label: "Settings" },
  ];
}

export {
  DIRECTOR_TAB_IDS,
  DIRECTOR_DEFAULT_TAB_ID,
  buildDirectorTabDefinitions,
};
