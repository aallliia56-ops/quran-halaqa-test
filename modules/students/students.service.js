import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

let studentsSnapshotCache = null;
let studentsSnapshotPromise = null;

function isStudentActive(student = {}) {
  return student?.status !== "inactive";
}

function cloneStudents(students) {
  return students.map((student) => ({ ...student }));
}

function sortStudentsByPoints(students) {
  return [...students].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
}

async function loadAllStudentsSnapshot(db) {
  const snap = await getDocs(collection(db, "students"));
  const students = [];

  snap.forEach((studentDoc) => {
    students.push(studentDoc.data());
  });

  return students;
}

async function fetchStudentByCode(db, code) {
  const studentRef = doc(db, "students", code);
  const snap = await getDoc(studentRef);
  if (!snap.exists()) return null;
  return snap.data();
}

async function fetchAllStudentsSnapshot(db, { forceRefresh = false } = {}) {
  if (forceRefresh) {
    studentsSnapshotCache = null;
    studentsSnapshotPromise = null;
  }

  if (studentsSnapshotCache) {
    return cloneStudents(studentsSnapshotCache);
  }

  if (!studentsSnapshotPromise) {
    studentsSnapshotPromise = loadAllStudentsSnapshot(db).then((students) => {
      studentsSnapshotCache = students;
      studentsSnapshotPromise = null;
      return students;
    });
  }

  const students = await studentsSnapshotPromise;
  return cloneStudents(students);
}

async function fetchStudentsByParentCode(db, parentCode, options) {
  const students = await fetchAllStudentsSnapshot(db, options);
  const parentKey = String(parentCode || "");
  return students.filter((student) => String(student.parent_code || "") === parentKey);
}

async function fetchStudentsForHalaqa(db, halaqaType, options) {
  const students = await fetchAllStudentsSnapshot(db, options);
  return students.filter((student) => student?.halaqa === halaqaType);
}

async function fetchAllStudentsSortedByPoints(db, filterFn, options) {
  const students = await fetchAllStudentsSnapshot(db, options);
  const filteredStudents = filterFn ? students.filter(filterFn) : students;

  return sortStudentsByPoints(filteredStudents);
}

async function fetchStudentsSortedByPointsForHalaqa(db, halaqaType, options) {
  const students = await fetchStudentsForHalaqa(db, halaqaType, options);
  return sortStudentsByPoints(students);
}

function invalidateStudentsSnapshotCache() {
  studentsSnapshotCache = null;
  studentsSnapshotPromise = null;
}

export {
  isStudentActive,
  fetchAllStudentsSnapshot,
  fetchStudentByCode,
  fetchStudentsByParentCode,
  fetchStudentsForHalaqa,
  fetchAllStudentsSortedByPoints,
  fetchStudentsSortedByPointsForHalaqa,
  invalidateStudentsSnapshotCache,
};
