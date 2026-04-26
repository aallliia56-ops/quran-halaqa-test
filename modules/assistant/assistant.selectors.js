import { buildHalaqaSummaries } from "../halaqas/halaqa.selectors.js";
import { selectActivePrograms } from "../programs/programs.selectors.js";

function buildAssistantHalaqaSummaries(students = []) {
  return buildHalaqaSummaries(students);
}

function buildAssistantOverview(students = [], programs = []) {
  const halaqaSummaries = buildAssistantHalaqaSummaries(students);
  const activePrograms = selectActivePrograms(programs);
  const activeStudentsCount = students.filter((student) => !student.is_archived).length;

  return {
    totalStudents: students.length,
    activeStudentsCount,
    totalHalaqas: halaqaSummaries.length,
    activeProgramsCount: activePrograms.length,
    halaqaSummaries,
  };
}

function buildAssistantDashboardData(students = [], programs = []) {
  const activePrograms = selectActivePrograms(programs);

  return {
    overview: buildAssistantOverview(students, programs),
    halaqas: buildAssistantHalaqaSummaries(students),
    activePrograms,
  };
}

export {
  buildAssistantHalaqaSummaries,
  buildAssistantOverview,
  buildAssistantDashboardData,
};
