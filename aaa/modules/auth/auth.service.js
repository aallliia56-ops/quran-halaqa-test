import {
  DEFAULT_ASSISTANT_CODES,
  DEFAULT_DIRECTOR_CODES,
} from "../../app/config.js";
import { getHalaqaTypeByLoginCode, normalizeHalaqaCode } from "../../app/halaqa-utils.js";
import { fetchHalaqaByLoginCode, normalizeHalaqaLoginCode } from "../halaqas/halaqas.service.js";
import { ROLES } from "../../app/permissions.js";
import { fetchStudentsByParentCode } from "../students/students.service.js";

const LOGIN_KINDS = {
  HALAQA: "halaqa",
  DIRECTOR: "director",
  ASSISTANT: "assistant",
  TEACHER: "teacher",
  PARENT: "parent",
  STUDENT: "student",
  NOT_FOUND: "not_found",
};

function buildHalaqaLoginContext(halaqaCode, halaqaType) {
  return {
    kind: LOGIN_KINDS.HALAQA,
    halaqaCode,
    halaqaType,
  };
}

function buildTeacherLoginContext(code, teacherRecord = null) {
  return {
    kind: LOGIN_KINDS.TEACHER,
    user: {
      role: ROLES.TEACHER,
      code,
      name: teacherRecord?.name || code,
      halaqa: teacherRecord?.halaqa || null,
    },
  };
}

function buildDirectorLoginContext(code) {
  return {
    kind: LOGIN_KINDS.DIRECTOR,
    user: { role: ROLES.DIRECTOR, code },
  };
}

function buildAssistantLoginContext(code) {
  return {
    kind: LOGIN_KINDS.ASSISTANT,
    user: { role: ROLES.ASSISTANT, code },
  };
}

function buildParentLoginContext(code) {
  return {
    kind: LOGIN_KINDS.PARENT,
    user: { role: ROLES.PARENT, code: String(code) },
  };
}

function buildStudentLoginContext(student) {
  return {
    kind: LOGIN_KINDS.STUDENT,
    user: { role: ROLES.STUDENT, code: student.code },
    student,
  };
}

function buildNotFoundLoginContext() {
  return { kind: LOGIN_KINDS.NOT_FOUND };
}

async function hasParentChildren(db, parentCode) {
  const students = await fetchStudentsByParentCode(db, parentCode);
  return students.length > 0;
}

async function resolveLoginContext({
  db,
  rawCode,
  halaqaLoginCodes,
  assistantCodes = DEFAULT_ASSISTANT_CODES,
  directorCodes = DEFAULT_DIRECTOR_CODES,
  fetchTeacherByCode = async () => null,
  fetchStudentByCode,
}) {
  const codeUpper = normalizeHalaqaCode(rawCode);
  const normalizedHalaqaLoginCode = normalizeHalaqaLoginCode(rawCode);
  const halaqaRecord = await fetchHalaqaByLoginCode(db, normalizedHalaqaLoginCode);

  if (halaqaRecord?.code && halaqaRecord?.login_code) {
    return buildHalaqaLoginContext(halaqaRecord.login_code, halaqaRecord.code);
  }

  const halaqaType = getHalaqaTypeByLoginCode(codeUpper, halaqaLoginCodes);

  if (halaqaType) {
    return buildHalaqaLoginContext(codeUpper, halaqaType);
  }

  if (directorCodes.includes(rawCode)) {
    return buildDirectorLoginContext(rawCode);
  }

  if (assistantCodes.includes(rawCode)) {
    return buildAssistantLoginContext(rawCode);
  }

  const teacherRecord = await fetchTeacherByCode(db, rawCode);
  if (teacherRecord) {
    return buildTeacherLoginContext(rawCode, teacherRecord);
  }

  const parentFound = await hasParentChildren(db, rawCode);
  if (parentFound) {
    return buildParentLoginContext(rawCode);
  }

  const student = await fetchStudentByCode(rawCode);
  if (!student) {
    return buildNotFoundLoginContext();
  }

  return buildStudentLoginContext(student);
}

export {
  DEFAULT_ASSISTANT_CODES,
  DEFAULT_DIRECTOR_CODES,
  LOGIN_KINDS,
  buildHalaqaLoginContext,
  buildDirectorLoginContext,
  buildAssistantLoginContext,
  buildTeacherLoginContext,
  buildParentLoginContext,
  buildStudentLoginContext,
  buildNotFoundLoginContext,
  hasParentChildren,
  resolveLoginContext,
};

