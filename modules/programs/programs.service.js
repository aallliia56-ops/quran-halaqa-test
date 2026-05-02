import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { invalidateStudentsSnapshotCache } from "../students/students.service.js";
import { buildDailyStreakProgram } from "./program-factory.js";
import { selectVisibleActivePrograms } from "./programs.selectors.js";
import { normalizeDateKeys, PROGRAM_STATUSES, PROGRAM_TYPES, supportsProgramType } from "./program-engine.js";

console.log("PROGRAMS_SERVICE_VERSION_2026_04_08_A");

let programsSnapshotCache = null;
let programsSnapshotPromise = null;

function normalizeProgramType(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeProgramStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function clonePrograms(programs) {
  return programs.map((program) => ({
    ...program,
    halaqas: Array.isArray(program.halaqas) ? [...program.halaqas] : [],
    visible_roles: Array.isArray(program.visible_roles) ? [...program.visible_roles] : [],
    config: program?.config ? {
      ...program.config,
      study_days: Array.isArray(program.config.study_days) ? [...program.config.study_days] : undefined,
      holiday_date_keys: Array.isArray(program.config.holiday_date_keys) ? [...program.config.holiday_date_keys] : [],
    } : {},
  }));
}

function normalizeProgramConfig(config = {}) {
  return {
    ...config,
    study_days: Array.isArray(config?.study_days) ? [...config.study_days] : undefined,
    holiday_date_keys: normalizeDateKeys(config?.holiday_date_keys),
  };
}

function normalizeProgramRecord(programDoc) {
  const program = programDoc.data();

  return {
    id: programDoc.id,
    ...program,
    status: normalizeProgramStatus(program?.status || PROGRAM_STATUSES.DRAFT),
    halaqas: Array.isArray(program?.halaqas) ? program.halaqas : [],
    visible_roles: Array.isArray(program?.visible_roles) ? program.visible_roles : [],
    config: normalizeProgramConfig(program?.config),
    type: supportsProgramType(normalizeProgramType(program?.type))
      ? normalizeProgramType(program?.type)
      : normalizeProgramType(program?.type) || null,
  };
}

function findProgramByType(programs = [], programType) {
  return programs.find((program) => normalizeProgramType(program?.type) === normalizeProgramType(programType)) || null;
}

function buildDefaultParticipationRecord() {
  return {
    completed_date_keys: [],
    created_at: Date.now(),
  };
}

async function loadAllProgramsSnapshot(db) {
  const snap = await getDocs(collection(db, "programs"));
  console.log("[programs] getDocs(projectId, hasDb, docsCount)", {
    projectId: db?.app?.options?.projectId || null,
    hasDb: Boolean(db),
    docsCount: snap.size,
    docIds: snap.docs.map((docItem) => docItem.id),
    hasDailyStreak1: snap.docs.some((docItem) => docItem.id === "daily_streak_1"),
  });
  const programs = [];

  snap.forEach((programDoc) => {
    const rawProgram = programDoc.data();
    console.log("[programs] raw Firestore document before normalize", {
      programId: programDoc.id,
      rawStatus: rawProgram?.status,
      rawStatusType: typeof rawProgram?.status,
    });
    programs.push(normalizeProgramRecord(programDoc));
  });

  console.log("[programs] normalized docs", {
    docsCount: programs.length,
    docIds: programs.map((program) => program.id),
    hasDailyStreak1: programs.some((program) => program.id === "daily_streak_1"),
  });

  return programs;
}

async function fetchAllProgramsSnapshot(db, { forceRefresh = false } = {}) {
  if (forceRefresh) {
    programsSnapshotCache = null;
    programsSnapshotPromise = null;
  }

  if (programsSnapshotCache) {
    return clonePrograms(programsSnapshotCache);
  }

  if (!programsSnapshotPromise) {
    programsSnapshotPromise = loadAllProgramsSnapshot(db).then((programs) => {
      programsSnapshotCache = programs;
      programsSnapshotPromise = null;
      return programs;
    });
  }

  const programs = await programsSnapshotPromise;
  return clonePrograms(programs);
}

async function fetchVisibleActivePrograms(db, context = {}, options) {
  console.log("[programs] fetchVisibleActivePrograms received", {
    contextRole: context?.role,
    contextHalaqa: context?.halaqa,
    contextJson: JSON.stringify(context),
  });
  const programs = await fetchAllProgramsSnapshot(db, options);
  const visiblePrograms = selectVisibleActivePrograms(programs, context);
  console.log("[programs] visible active programs after filtering", {
    projectId: db?.app?.options?.projectId || null,
    context,
    programsLength: visiblePrograms.length,
    docIds: visiblePrograms.map((program) => program.id),
    hasDailyStreak1: visiblePrograms.some((program) => program.id === "daily_streak_1"),
  });
  return visiblePrograms;
}

async function ensureStudentProgramParticipation(db, student = {}, program = {}) {
  const studentCode = String(student?.code || "").trim();
  const programId = String(program?.id || "").trim();
  if (!studentCode || !programId) {
    return null;
  }

  const existingParticipation = student?.program_participation?.[programId];
  if (existingParticipation && typeof existingParticipation === "object") {
    return existingParticipation;
  }

  const nextParticipation = buildDefaultParticipationRecord();
  await updateDoc(doc(db, "students", studentCode), {
    [`program_participation.${programId}`]: nextParticipation,
  });

  student.program_participation = {
    ...(student.program_participation || {}),
    [programId]: nextParticipation,
  };
  invalidateStudentsSnapshotCache();
  return nextParticipation;
}

async function saveDailyStreakProgramSettings(db, input = {}) {
  const programId = String(input?.id || "daily_streak_1").trim() || "daily_streak_1";
  const programRef = doc(db, "programs", programId);
  const existingSnapshot = await getDoc(programRef);
  const existingProgram = existingSnapshot.exists()
    ? normalizeProgramRecord(existingSnapshot)
    : null;
  const nextStatus = normalizeProgramStatus(input?.status || existingProgram?.status || PROGRAM_STATUSES.ACTIVE);
  const nextHolidayDateKeys = normalizeDateKeys(input?.holiday_date_keys);

  if (!existingProgram) {
    const createdProgram = buildDailyStreakProgram({
      id: programId,
      status: nextStatus,
      visibleRoles: ["student", "assistant", "director"],
      config: {
        holiday_date_keys: nextHolidayDateKeys,
      },
    });

    await setDoc(programRef, {
      ...createdProgram,
      updated_at: serverTimestamp(),
    }, { merge: true });
    invalidateProgramsSnapshotCache();
    return {
      ...createdProgram,
      config: normalizeProgramConfig(createdProgram.config),
    };
  }

  const nextProgram = {
    status: nextStatus,
    type: existingProgram.type || PROGRAM_TYPES.DAILY_STREAK,
    name: existingProgram.name || "Daily Streak",
    halaqas: Array.isArray(existingProgram.halaqas) ? existingProgram.halaqas : [],
    visible_roles: Array.isArray(existingProgram.visible_roles) && existingProgram.visible_roles.length
      ? existingProgram.visible_roles
      : ["student", "assistant", "director"],
    config: {
      ...(existingProgram.config || {}),
      holiday_date_keys: nextHolidayDateKeys,
    },
    updated_at: serverTimestamp(),
  };

  await setDoc(programRef, nextProgram, { merge: true });
  invalidateProgramsSnapshotCache();
  return {
    ...existingProgram,
    ...nextProgram,
    config: normalizeProgramConfig(nextProgram.config),
  };
}

function invalidateProgramsSnapshotCache() {
  programsSnapshotCache = null;
  programsSnapshotPromise = null;
}

export {
  ensureStudentProgramParticipation,
  fetchAllProgramsSnapshot,
  fetchVisibleActivePrograms,
  findProgramByType,
  invalidateProgramsSnapshotCache,
  saveDailyStreakProgramSettings,
};
