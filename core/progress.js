import { HIFZ_CURRICULUM } from "../data/curriculum.js";
import {
  hasExternalCurriculumRuntime,
  computeExternalHifzPercent,
} from "../modules/curriculum/curriculum-runtime.js";

export function computeHifzPercent(student) {
  if (hasExternalCurriculumRuntime()) {
    return computeExternalHifzPercent(student);
  }

  const all = HIFZ_CURRICULUM;
  if (!all?.length) return 0;
  const start = student.hifz_start_id ?? 0;
  const end = student.hifz_end_id ?? all.length - 1;
  const span = Math.max(1, end - start + 1);
  const prog = student.hifz_progress ?? start;
  const done = Math.max(0, Math.min(prog - start, span));
  return Math.round((done / span) * 100);
} 
import { REVIEW_CURRICULUM } from "../data/curriculum.js";

export function computeMurajaaPercent(student) {
  const arr = REVIEW_CURRICULUM[student.murajaa_level || "BUILDING"] || [];
  if (!arr?.length) return 0;

  const len = arr.length;
  const start = (student.murajaa_start_index ?? 0) % len;

  let prog = student.murajaa_progress_index ?? start;
  prog = ((prog % len) + len) % len;

  const dist = (prog - start + len) % len;
  return Math.round((dist / len) * 100);
}
