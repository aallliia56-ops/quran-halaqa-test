import { fetchAllHalaqasSnapshot } from "../halaqas/halaqas.service.js";
import { fetchAllProgramsSnapshot } from "../programs/programs.service.js";
import { fetchAllStudentsSnapshot } from "../students/students.service.js";
import { fetchAllTeachersSnapshot } from "../teachers/teachers.service.js";
import { buildDirectorDashboardData, buildDirectorOverview } from "./director.selectors.js";

async function fetchDirectorOverview(db, options = {}) {
  const [students, programs, halaqas, teachers] = await Promise.all([
    fetchAllStudentsSnapshot(db, options),
    fetchAllProgramsSnapshot(db, options),
    fetchAllHalaqasSnapshot(db, options),
    fetchAllTeachersSnapshot(db, options),
  ]);

  return {
    ...buildDirectorOverview(students, programs, halaqas),
    totalTeachers: teachers.length,
  };
}

async function fetchDirectorDashboardData(db, options = {}) {
  const [students, programs, halaqas, teachers] = await Promise.all([
    fetchAllStudentsSnapshot(db, options),
    fetchAllProgramsSnapshot(db, options),
    fetchAllHalaqasSnapshot(db, options),
    fetchAllTeachersSnapshot(db, options),
  ]);

  return buildDirectorDashboardData(students, programs, halaqas, teachers);
}

export {
  fetchDirectorDashboardData,
  fetchDirectorOverview,
};
