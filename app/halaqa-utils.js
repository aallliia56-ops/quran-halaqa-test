import { HALAQA_CATALOG, HALAQA_LOGIN_CODES } from "./config.js";

const DEFAULT_HALAQA = HALAQA_LOGIN_CODES.HALAQA_ONSITE;

function normalizeHalaqaCode(value) {
  return String(value || "").toUpperCase();
}

function getHalaqaTypeByLoginCode(loginCode, halaqaLoginCodes = HALAQA_LOGIN_CODES) {
  const normalizedCode = normalizeHalaqaCode(loginCode);
  return halaqaLoginCodes[normalizedCode] || null;
}

function getStudentHalaqa(student) {
  return student?.halaqa || DEFAULT_HALAQA;
}

function isStudentInHalaqa(student, halaqa) {
  return student?.halaqa === halaqa;
}

function getKnownHalaqaCatalog() {
  return HALAQA_CATALOG.map((halaqa) => ({ ...halaqa }));
}

function getHalaqaMeta(halaqaCode) {
  const normalizedCode = normalizeHalaqaCode(halaqaCode || DEFAULT_HALAQA);
  return getKnownHalaqaCatalog().find((halaqa) => halaqa.code === normalizedCode) || null;
}

function getHalaqaDisplayLabel(halaqaCode) {
  return getHalaqaMeta(halaqaCode)?.label || normalizedCodeFallback(halaqaCode);
}

function normalizedCodeFallback(halaqaCode) {
  return normalizeHalaqaCode(halaqaCode || DEFAULT_HALAQA);
}

export {
  DEFAULT_HALAQA,
  normalizeHalaqaCode,
  getHalaqaTypeByLoginCode,
  getStudentHalaqa,
  isStudentInHalaqa,
  getKnownHalaqaCatalog,
  getHalaqaMeta,
  getHalaqaDisplayLabel,
};
