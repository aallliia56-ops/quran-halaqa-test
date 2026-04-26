import { PROGRAM_STATUSES } from "./program-engine.js";

function normalizeRole(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeHalaqa(value) {
  return String(value || "").trim().toUpperCase();
}

function isProgramActive(program) {
  const result = normalizeRole(program?.status) === PROGRAM_STATUSES.ACTIVE;
  if (program?.id === "daily_streak_1") {
    console.log("[programs] isProgramActive check", {
      programId: program.id,
      rawStatus: program?.status,
      normalizedStatus: normalizeRole(program?.status),
      expectedStatus: PROGRAM_STATUSES.ACTIVE,
      result,
    });
  }
  return result;
}

function isProgramVisibleToRole(program, role) {
  const visibleRoles = Array.isArray(program?.visible_roles) ? program.visible_roles : [];
  if (!visibleRoles.length) {
    if (program?.id === "daily_streak_1") {
      console.log("[programs] isProgramVisibleToRole check", {
        programId: program.id,
        role,
        visibleRoles,
        result: true,
        reason: "no visible_roles restriction",
      });
    }
    return true;
  }

  const normalizedRole = normalizeRole(role);
  const normalizedVisibleRoles = visibleRoles.map(normalizeRole);
  const result = normalizedVisibleRoles.includes(normalizedRole);
  if (program?.id === "daily_streak_1") {
    console.log("[programs] isProgramVisibleToRole check", {
      programId: program.id,
      role,
      normalizedRole,
      visibleRoles,
      normalizedVisibleRoles,
      result,
    });
  }
  return result;
}

function isProgramVisibleToHalaqa(program, halaqa) {
  const halaqas = Array.isArray(program?.halaqas) ? program.halaqas : [];
  if (!halaqas.length) {
    if (program?.id === "daily_streak_1") {
      console.log("[programs] isProgramVisibleToHalaqa check", {
        programId: program.id,
        halaqa,
        halaqas,
        result: true,
        reason: "no halaqa restriction",
      });
    }
    return true;
  }

  const normalizedHalaqa = normalizeHalaqa(halaqa);
  const normalizedHalaqas = halaqas.map(normalizeHalaqa);
  const result = normalizedHalaqas.includes(normalizedHalaqa);
  if (program?.id === "daily_streak_1") {
    console.log("[programs] isProgramVisibleToHalaqa check", {
      programId: program.id,
      halaqa,
      normalizedHalaqa,
      halaqas,
      normalizedHalaqas,
      result,
    });
  }
  return result;
}

function filterVisiblePrograms(programs = [], context = {}) {
  return programs.filter((program) => {
    const roleVisible = isProgramVisibleToRole(program, context.role);
    const halaqaVisible = isProgramVisibleToHalaqa(program, context.halaqa);
    const result = roleVisible && halaqaVisible;

    if (program?.id === "daily_streak_1") {
      console.log("[programs] filterVisiblePrograms final check", {
        programId: program.id,
        contextRole: context.role,
        contextHalaqa: context.halaqa,
        roleVisible,
        halaqaVisible,
        result,
      });
    }

    return result;
  });
}

function selectActivePrograms(programs = []) {
  const activePrograms = programs.filter(isProgramActive);
  console.log("[programs] selectActivePrograms result", {
    inputCount: programs.length,
    outputCount: activePrograms.length,
    docIds: activePrograms.map((program) => program.id),
    hasDailyStreak1: activePrograms.some((program) => program.id === "daily_streak_1"),
  });
  return activePrograms;
}

function selectVisibleActivePrograms(programs = [], context = {}) {
  const activePrograms = selectActivePrograms(programs);
  const visibleActivePrograms = filterVisiblePrograms(activePrograms, context);
  console.log("[programs] selectVisibleActivePrograms result", {
    inputCount: programs.length,
    activeCount: activePrograms.length,
    visibleActiveCount: visibleActivePrograms.length,
    docIds: visibleActivePrograms.map((program) => program.id),
    hasDailyStreak1: visibleActivePrograms.some((program) => program.id === "daily_streak_1"),
  });
  return visibleActivePrograms;
}

export {
  isProgramActive,
  isProgramVisibleToRole,
  isProgramVisibleToHalaqa,
  filterVisiblePrograms,
  selectActivePrograms,
  selectVisibleActivePrograms,
};
