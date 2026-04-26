import { REVIEW_CURRICULUM } from "../data/curriculum.js";

import { HIFZ_CURRICULUM } from "../data/curriculum.js";
import { FLEXIBLE_HIFZ, FLEXIBLE_POINTS } from "../data/curriculum.js";
import {
  hasExternalCurriculumRuntime,
  buildHifzMission,
  getCurrentExternalHifzMission,
  getNextExternalHifzMission,
} from "../modules/curriculum/curriculum-runtime.js";

export function getCurrentMurajaaMission(student) {
  const level = student.murajaa_level || "BUILDING";
  const arr = REVIEW_CURRICULUM[level] || [];
  if (!arr?.length) return null;

  const len = arr.length;
  const start = ((student.murajaa_start_index ?? 0) % len + len) % len;

  let index = student.murajaa_progress_index;
  if (index == null) index = start;
  index = ((index % len) + len) % len;

  const item = arr[index];

  return {
    type: "murajaa",
    level,
    index,
    description: item.name,
    points: item.points || 3,
  };
}

export function getNextMurajaaMission(student) {
  const level = student.murajaa_level || "BUILDING";
  const arr = REVIEW_CURRICULUM[level] || [];
  if (!arr?.length) return null;

  const len = arr.length;
  const start = ((student.murajaa_start_index ?? 0) % len + len) % len;

  let idx = student.murajaa_progress_index ?? start;
  idx = ((idx % len) + len) % len;

  const nextIndex = (idx + 1) % len;
  const item = arr[nextIndex];

  return {
    type: "murajaa",
    level,
    index: nextIndex,
    description: item.name,
    points: item.points || 3,
  };
}

export function getCurrentHifzMission(student) {
  const mode = student.hifz_mode || "fixed";

  if (hasExternalCurriculumRuntime()) {
    return buildHifzMission(student);
  }

  // =====================================================
  // ✅ 1) المنهج المرن
  // =====================================================
  if (mode === "flexible") {
    const surahIdx = Number.isFinite(student.flex_surah_index) ? student.flex_surah_index : 0;
    const surah = FLEXIBLE_HIFZ[surahIdx];
    if (!surah) return null;

    const nextAyah = Number.isFinite(student.flex_next_ayah) ? student.flex_next_ayah : surah.start_ayah;

    // لو خلص السورة فعليًا (احتياط)
    if (nextAyah > surah.end_ayah) {
      const nextSurahIdx = surahIdx + 1;
      const nextSurah = FLEXIBLE_HIFZ[nextSurahIdx];
      if (!nextSurah) return null;
      return {
        type: "hifz_flexible",
        mode: "flexible",
        surahIdx: nextSurahIdx,
        surah_number: nextSurah.surah_number,
        surah_name_ar: nextSurah.surah_name_ar,
        startAyah: nextSurah.start_ayah,
        endAyahMax: nextSurah.end_ayah,
        points: FLEXIBLE_POINTS,
        description: `${nextSurah.surah_name_ar} (اختر من ${nextSurah.start_ayah} إلى ${nextSurah.end_ayah})`,
      };
    }

    return {
      type: "hifz_flexible",
      mode: "flexible",
      surahIdx,
      surah_number: surah.surah_number,
      surah_name_ar: surah.surah_name_ar,
      startAyah: nextAyah,          // ✅ بداية ثابتة = نقطة توقفه
      endAyahMax: surah.end_ayah,   // ✅ النهاية يختارها الطالب
      points: FLEXIBLE_POINTS,
      description: `${surah.surah_name_ar} (ابدأ من ${nextAyah} واختر النهاية حتى ${surah.end_ayah})`,
    };
  }

  // =====================================================
  // ✅ 2) المنهج الثابت (نفس كودك السابق بدون تغيير)
  // =====================================================
  const all = HIFZ_CURRICULUM;
  if (!all?.length) return null;

  const planStart = student.hifz_start_id ?? 0;
  const planEnd = student.hifz_end_id ?? all.length - 1;

  let nextIndex = student.hifz_progress ?? planStart;
  if (nextIndex < planStart) nextIndex = planStart;
  if (nextIndex > planEnd) return null;

  const tasks = Array.isArray(student.tasks) ? student.tasks : [];

  const prevIndex = nextIndex - 1;
  if (prevIndex >= planStart && prevIndex <= planEnd) {
    const prevSeg = all[prevIndex];

    let first = prevIndex;
    while (first - 1 >= planStart && all[first - 1].surah_number === prevSeg.surah_number) first--;

    let last = prevIndex;
    while (last + 1 <= planEnd && all[last + 1].surah_number === prevSeg.surah_number) last++;

    const segmentsCount = last - first + 1;

    if (segmentsCount > 1 && prevIndex === last) {
      const alreadyCompletedFull = tasks.some(
        (t) =>
          t.type === "hifz" &&
          t.mission_start === first &&
          t.mission_last === last &&
          t.status === "completed"
      );

      if (!alreadyCompletedFull) {
        const firstSeg = all[first];
        const lastSeg = all[last];

        return {
          type: "hifz",
          startIndex: first,
          lastIndex: last,
          isFullSurah: true,
          description: `${firstSeg.surah_name_ar} كاملة (${firstSeg.start_ayah}-${lastSeg.end_ayah})`,
          points: firstSeg.points || 5,
        };
      }
    }
  }

  const level = +student.hifz_level || 1;
  const maxSegments = Math.max(1, Math.min(3, level));

  const first = all[nextIndex];
  const segs = [first];

  for (let i = nextIndex + 1; i <= planEnd && segs.length < maxSegments; i++) {
    const seg = all[i];
    if (seg.surah_number !== first.surah_number) break;
    segs.push(seg);
  }

  const last = segs[segs.length - 1];

  return {
    type: "hifz",
    startIndex: nextIndex,
    lastIndex: nextIndex + segs.length - 1,
    description: `${first.surah_name_ar} (${first.start_ayah}-${last.end_ayah})`,
    points: first.points || 5,
  };
}


export function getNextHifzMission(student) {
  if ((student.hifz_mode || "fixed") === "flexible") {
    return null;
  }

  if (hasExternalCurriculumRuntime()) {
    return getNextExternalHifzMission(student);
  }

  const all = HIFZ_CURRICULUM;
  if (!all?.length) return null;

  const cur = getCurrentHifzMission(student);
  if (!cur) return null;

  const planEnd = student.hifz_end_id ?? all.length - 1;
  const candidate = cur.lastIndex + 1;
  if (candidate > planEnd || !all[candidate]) return null;

  const level = +student.hifz_level || 1;
  const maxSegments = Math.max(1, Math.min(3, level));

  const first = all[candidate];
  const segs = [first];

  for (let i = candidate + 1; i < all.length && i <= planEnd && segs.length < maxSegments; i++) {
    const seg = all[i];
    if (seg.surah_number !== first.surah_number) break;
    segs.push(seg);
  }

  const last = segs[segs.length - 1];
  return {
    type: "hifz",
    startIndex: candidate,
    lastIndex: candidate + segs.length - 1,
    description: `${first.surah_name_ar} (${first.start_ayah}-${last.end_ayah})`,
    points: first.points || 5,
  };
}
