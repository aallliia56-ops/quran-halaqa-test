import {
  DAILY_STREAK_STUDY_DAYS,
  PROGRAM_STATUSES,
  PROGRAM_TYPES,
} from "./program-engine.js";

function buildProgramRecord({
  id,
  type,
  name,
  status = PROGRAM_STATUSES.DRAFT,
  halaqas = [],
  visibleRoles = [],
  config = {},
  createdAt = Date.now(),
}) {
  return {
    id,
    type,
    name,
    status,
    halaqas,
    visible_roles: visibleRoles,
    config,
    created_at: createdAt,
  };
}

function buildDailyStreakProgram({
  id,
  name = "Daily Streak",
  status,
  halaqas,
  visibleRoles,
  config = {},
  createdAt,
}) {
  return buildProgramRecord({
    id,
    type: PROGRAM_TYPES.DAILY_STREAK,
    name,
    status,
    halaqas,
    visibleRoles,
    config: {
      study_days: DAILY_STREAK_STUDY_DAYS,
      ...config,
    },
    createdAt,
  });
}

export {
  buildProgramRecord,
  buildDailyStreakProgram,
};
