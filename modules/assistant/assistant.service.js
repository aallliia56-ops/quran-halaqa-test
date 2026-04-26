import { fetchAllProgramsSnapshot } from "../programs/programs.service.js";
import { fetchAllStudentsSnapshot } from "../students/students.service.js";
import { buildAssistantDashboardData } from "./assistant.selectors.js";

async function fetchAssistantDashboardData(db, options = {}) {
  const [students, programs] = await Promise.all([
    fetchAllStudentsSnapshot(db, options),
    fetchAllProgramsSnapshot(db, options),
  ]);

  return buildAssistantDashboardData(students, programs);
}

export { fetchAssistantDashboardData };
