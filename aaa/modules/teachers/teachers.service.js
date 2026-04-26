import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { normalizeHalaqaCode } from "../../app/halaqa-utils.js";

function normalizeTeacherRecord(record = {}, id = "") {
  const code = String(record?.code || id || "").trim();
  if (!code) return null;

  return {
    id: id || code,
    code,
    name: String(record?.name || record?.display_name || code).trim(),
    halaqa: normalizeHalaqaCode(record?.halaqa || record?.halaqa_code || "") || null,
    is_active: record?.is_active !== false,
    created_at: record?.created_at || null,
  };
}

async function fetchAllTeachersSnapshot(db) {
  const snapshot = await getDocs(collection(db, "teachers"));
  return snapshot.docs
    .map((teacherDoc) => normalizeTeacherRecord(teacherDoc.data(), teacherDoc.id))
    .filter(Boolean);
}

async function fetchTeacherByCode(db, code) {
  const normalizedCode = String(code || "").trim();
  if (!normalizedCode) return null;

  const snapshot = await getDoc(doc(db, "teachers", normalizedCode));
  if (!snapshot.exists()) return null;

  return normalizeTeacherRecord(snapshot.data(), snapshot.id);
}

async function createTeacherRecord(db, input = {}) {
  const code = String(input?.code || "").trim();
  const name = String(input?.name || "").trim();
  const halaqa = normalizeHalaqaCode(input?.halaqa || "");

  if (!code || !name || !halaqa) {
    throw new Error("رمز المعلم واسمه مطلوبان.");
  }

  const teacherRef = doc(db, "teachers", code);
  const halaqaRef = doc(db, "halaqas", halaqa);
  const existingSnapshot = await getDoc(teacherRef);
  if (existingSnapshot.exists()) {
    throw new Error("يوجد معلم بنفس الرمز بالفعل.");
  }

  const halaqaSnapshot = await getDoc(halaqaRef);
  if (!halaqaSnapshot.exists()) {
    throw new Error("الحلقة المحددة غير موجودة.");
  }

  await setDoc(teacherRef, {
    code,
    name,
    halaqa,
    is_active: true,
    created_at: serverTimestamp(),
  });

  await setDoc(halaqaRef, {
    teacher_id: code,
  }, { merge: true });

  return {
    id: code,
    code,
    name,
    halaqa,
    is_active: true,
  };
}

export {
  normalizeTeacherRecord,
  fetchAllTeachersSnapshot,
  fetchTeacherByCode,
  createTeacherRecord,
};
