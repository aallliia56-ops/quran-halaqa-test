import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { DEFAULT_HALAQA } from "../../app/halaqa-utils.js";

async function assignTaskToStudent(db, studentCode, task) {
  const studentRef = doc(db, "students", studentCode);
  const snap = await getDoc(studentRef);

  if (!snap.exists()) {
    return { ok: false, reason: "student_not_found" };
  }

  const tasks = Array.isArray(snap.data().tasks) ? snap.data().tasks : [];
  tasks.push(task);
  await updateDoc(studentRef, { tasks });

  return { ok: true };
}

async function assignTaskToHalaqa(db, halaqaName, task) {
  const snap = await getDocs(collection(db, "students"));
  const batch = writeBatch(db);
  let updatedCount = 0;

  snap.forEach((studentDoc) => {
    const student = studentDoc.data();
    const studentHalaqa = student.halaqa || DEFAULT_HALAQA;
    if (studentHalaqa !== halaqaName) return;

    updatedCount += 1;
    batch.update(doc(db, "students", studentDoc.id), { tasks: arrayUnion(task) });
  });

  await batch.commit();
  return { ok: true, updatedCount };
}

export { assignTaskToStudent, assignTaskToHalaqa };
