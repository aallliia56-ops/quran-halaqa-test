import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJSxd8lE9rZPTukTjBreErGM8X14Fnctc",
  authDomain: "studenttasksmanager-v2.firebaseapp.com",
  projectId: "studenttasksmanager-v2",
  storageBucket: "studenttasksmanager-v2.firebasestorage.app",
  messagingSenderId: "55253533575",
  appId: "1:55253533575:web:b92f405de09853a55ec922",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("[firebase] connected to project:", firebaseConfig.projectId);
window.db = db;
export { app, db, firebaseConfig };
