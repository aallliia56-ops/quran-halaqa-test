import { HIFZ_CURRICULUM, REVIEW_CURRICULUM } from "../../data/curriculum.js";

function getReviewArrayForLevel(level) {
  return REVIEW_CURRICULUM[level] || [];
}

function getLastFullSurahNumber(student = {}) {
  const all = HIFZ_CURRICULUM;
  if (!all?.length) return null;

  const planStart = student.hifz_start_id ?? 0;
  const planEnd = student.hifz_end_id ?? all.length - 1;
  const progress = student.hifz_progress ?? planStart;

  if (progress <= planStart) return null;

  let i = Math.min(progress - 1, planEnd);

  while (i >= planStart) {
    const surahNumber = all[i]?.surah_number;
    if (!surahNumber) return null;

    let first = i;
    while (first - 1 >= planStart && all[first - 1]?.surah_number === surahNumber) first -= 1;

    let last = i;
    while (last + 1 <= planEnd && all[last + 1]?.surah_number === surahNumber) last += 1;

    if (last <= progress - 1) {
      return surahNumber;
    }

    i = first - 1;
  }

  return null;
}

function chooseMurajaaStartIndexFromLastSurah(level, lastSurahNumber, fallbackStart) {
  const reviewItems = getReviewArrayForLevel(level);
  const length = reviewItems.length;
  if (!length) return 0;

  const normalizedFallback = ((fallbackStart % length) + length) % length;
  if (!lastSurahNumber) return normalizedFallback;

  const surahSegment = HIFZ_CURRICULUM.find((segment) => segment.surah_number === lastSurahNumber);
  const surahName = surahSegment?.surah_name_ar;
  if (!surahName) return normalizedFallback;

  const matchIndex = reviewItems.findIndex((item) => {
    const name = typeof item === "string" ? item : item?.name;
    return typeof name === "string" && name.includes(surahName);
  });

  return matchIndex === -1 ? normalizedFallback : matchIndex;
}

export { getReviewArrayForLevel, getLastFullSurahNumber, chooseMurajaaStartIndexFromLastSurah };
