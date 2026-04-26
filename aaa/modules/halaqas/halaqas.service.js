import {
  collection,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  doc,
  where,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getHalaqaDisplayLabel, normalizeHalaqaCode } from "../../app/halaqa-utils.js";
import { fetchAllStudentsSnapshot } from "../students/students.service.js";
import { buildHalaqaSummaries, getKnownHalaqas } from "./halaqa.selectors.js";

function normalizeHalaqaLoginCode(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeHalaqaRecord(record = {}, id = "") {
  const code = normalizeHalaqaCode(record?.code || id);
  if (!code) return null;

  return {
    id: id || code,
    code,
    name: String(record?.name || record?.label || getHalaqaDisplayLabel(code)).trim(),
    label: String(record?.label || record?.name || getHalaqaDisplayLabel(code)).trim(),
    teacher_id: String(record?.teacher_id || record?.teacherId || "").trim(),
    login_code: normalizeHalaqaLoginCode(record?.login_code || `halaqa-${code.toLowerCase()}`),
    is_active: record?.is_active !== false,
    created_at: record?.created_at || null,
  };
}

async function fetchAllHalaqasSnapshot(db, options = {}) {
  const snapshot = await getDocs(collection(db, "halaqas"));
  return snapshot.docs
    .map((docSnapshot) => normalizeHalaqaRecord(docSnapshot.data(), docSnapshot.id))
    .filter(Boolean);
}

async function fetchHalaqaSummaries(db, options = {}) {
  const [students, halaqas] = await Promise.all([
    fetchAllStudentsSnapshot(db, options),
    fetchAllHalaqasSnapshot(db, options),
  ]);

  return buildHalaqaSummaries(students, halaqas);
}

async function fetchKnownHalaqas(db, options = {}) {
  const [students, halaqas] = await Promise.all([
    fetchAllStudentsSnapshot(db, options),
    fetchAllHalaqasSnapshot(db, options),
  ]);

  return getKnownHalaqas(students, halaqas);
}

async function fetchHalaqasForTeacher(db, teacherId, options = {}) {
  const normalizedTeacherId = String(teacherId || "").trim();
  if (!normalizedTeacherId) return [];

  const halaqas = await fetchAllHalaqasSnapshot(db, options);
  return halaqas.filter((halaqa) => String(halaqa.teacher_id || "").trim() === normalizedTeacherId);
}

async function fetchHalaqaByLoginCode(db, loginCode) {
  const normalizedLoginCode = normalizeHalaqaLoginCode(loginCode);
  if (!normalizedLoginCode) return null;

  const snapshot = await getDocs(query(
    collection(db, "halaqas"),
    where("login_code", "==", normalizedLoginCode)
  ));
  const matchingDoc = snapshot.docs[0];

  return matchingDoc
    ? normalizeHalaqaRecord(matchingDoc.data(), matchingDoc.id)
    : null;
}

async function createHalaqaRecord(db, input = {}) {
  const code = normalizeHalaqaCode(input?.code);
  const label = String(input?.label || "").trim();
  const loginCode = normalizeHalaqaLoginCode(input?.login_code || `halaqa-${code.toLowerCase()}`);

  if (!code || !label) {
    throw new Error("رمز الحلقة واسمها مطلوبان.");
  }

  const halaqaRef = doc(db, "halaqas", code);
  const existingSnapshot = await getDoc(halaqaRef);
  if (existingSnapshot.exists()) {
    throw new Error("يوجد حلقة بنفس الرمز بالفعل.");
  }

  await setDoc(halaqaRef, {
    code,
    label,
    login_code: loginCode,
    is_active: true,
    created_at: serverTimestamp(),
  });

  return {
    id: code,
    code,
    label,
    login_code: loginCode,
    is_active: true,
  };
}

export {
  fetchAllHalaqasSnapshot,
  fetchHalaqaByLoginCode,
  fetchHalaqasForTeacher,
  fetchHalaqaSummaries,
  fetchKnownHalaqas,
  createHalaqaRecord,
  normalizeHalaqaLoginCode,
};
