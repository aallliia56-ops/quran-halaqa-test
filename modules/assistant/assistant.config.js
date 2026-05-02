const ASSISTANT_TAB_IDS = {
  OVERVIEW: "assistant-overview",
  HALAQAS: "assistant-halaqas",
  PROGRAMS: "assistant-programs",
};

const ASSISTANT_DEFAULT_TAB_ID = ASSISTANT_TAB_IDS.OVERVIEW;

function buildAssistantTabDefinitions() {
  return [
    { id: ASSISTANT_TAB_IDS.OVERVIEW, label: "Overview" },
    { id: ASSISTANT_TAB_IDS.HALAQAS, label: "Halaqas" },
    { id: ASSISTANT_TAB_IDS.PROGRAMS, label: "Programs" },
  ];
}

export {
  ASSISTANT_TAB_IDS,
  ASSISTANT_DEFAULT_TAB_ID,
  buildAssistantTabDefinitions,
};
