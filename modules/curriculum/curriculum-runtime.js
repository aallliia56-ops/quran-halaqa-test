const EXTERNAL_CURRICULUM_URL = new URL("../../curriculum5.json", import.meta.url);
const DEFAULT_HIFZ_POINTS = 5;
const HIFZ_ACTIVE_STATUS = "active_hifz";
const HIFZ_AWAITING_NOMINATION_STATUS = "awaiting_nomination_for_test";
const HIFZ_NOMINATED_FOR_TEST_STATUS = "nominated_for_test";
const HIFZ_TEST_PASSED_STATUS = "test_passed";
const HIFZ_TEST_FAILED_STATUS = "test_failed";
const FIXED_TRACK_ID = "fixed_hifz_from_nas_to_ahqaf";
const PAGE_TRACK_ID = "page_hifz_after_ahqaf";

async function loadExternalCurriculum() {
  try {
    const response = await fetch(EXTERNAL_CURRICULUM_URL);
    if (!response.ok) {
      throw new Error(`Failed to load curriculum JSON: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error loading external curriculum:", error);
    return null;
  }
}

const externalCurriculum = await loadExternalCurriculum();

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toFiniteNumber(value, fallback = null) {
  return Number.isFinite(value) ? value : fallback;
}

function cloneBoundary(boundary = null) {
  if (!boundary) return null;

  return {
    surah: boundary?.surah ?? null,
    surah_name: boundary?.surah_name || boundary?.name || "",
    ayah: boundary?.ayah ?? boundary?.start_ayah ?? boundary?.end_ayah ?? null,
    page: boundary?.page ?? null,
  };
}

function normalizeLegacyHifzStatus(status) {
  if (!status || status === "ready_for_next_unit") {
    return HIFZ_ACTIVE_STATUS;
  }

  if (status === "awaiting_test") {
    return HIFZ_AWAITING_NOMINATION_STATUS;
  }

  return status;
}

function normalizeLevel(level) {
  const parsed = Number.parseInt(level, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(3, parsed));
}

function buildExceptionRuleMap(sharedPageExceptions = []) {
  return new Map(
    toArray(sharedPageExceptions)
      .filter((item) => Number.isFinite(item?.page) && item?.rule)
      .map((item) => [item.page, item.rule])
  );
}

function buildPhaseMaps(phases = []) {
  const byId = new Map();
  const byTrack = new Map();

  toArray(phases).forEach((phase) => {
    if (!phase?.id) return;
    byId.set(phase.id, phase);

    const trackId = phase.track_id || "";
    if (!byTrack.has(trackId)) {
      byTrack.set(trackId, []);
    }

    byTrack.get(trackId).push(phase);
  });

  byTrack.forEach((items) => {
    items.sort((a, b) => {
      const aPage = a?.start_boundary?.page;
      const bPage = b?.start_boundary?.page;
      if (Number.isFinite(aPage) && Number.isFinite(bPage) && aPage !== bPage) {
        return bPage - aPage;
      }

      const aSurah = a?.start_boundary?.surah;
      const bSurah = b?.start_boundary?.surah;
      if (Number.isFinite(aSurah) && Number.isFinite(bSurah) && aSurah !== bSurah) {
        return bSurah - aSurah;
      }

      return String(a.start_unit_id || "").localeCompare(String(b.start_unit_id || ""));
    });
  });

  return { byId, byTrack };
}

function buildTrackMap(tracks = []) {
  return new Map(
    toArray(tracks)
      .filter((track) => track?.id)
      .map((track) => [track.id, track])
  );
}

function buildFixedUnits(units = []) {
  return toArray(units)
    .filter((unit) => !unit?.is_template && unit?.track_id === FIXED_TRACK_ID && Number.isFinite(unit?.order))
    .sort((a, b) => a.order - b.order)
    .map((unit) => ({
      id: unit.id,
      trackId: unit.track_id,
      phaseId: unit.phase_id || null,
      order: unit.order,
      type: unit.type || "ayah_range",
      measurementType: unit.type || "ayah_range",
      label: unit.label || "",
      start: unit.start || null,
      end: unit.end || null,
      examGate: !!unit.exam_gate,
      points: DEFAULT_HIFZ_POINTS,
      source: "external_fixed_units",
    }));
}

function buildPageUnitLabel(groupPages) {
  if (!groupPages.length) return "الصفحات";
  if (groupPages.length === 1) return `الصفحة ${groupPages[0]}`;
  return `الصفحات ${groupPages[0]}-${groupPages[groupPages.length - 1]}`;
}

function buildPageUnitSegments(groupPages, pagesByNumber) {
  return groupPages.flatMap((pageNumber) => {
    const pageEntry = pagesByNumber.get(pageNumber);
    return toArray(pageEntry?.segments).map((segment) => ({
      page: pageNumber,
      surah: segment?.surah ?? null,
      name: segment?.name ?? "",
      start_ayah: segment?.start_ayah ?? null,
      end_ayah: segment?.end_ayah ?? null,
    }));
  });
}

function compareQuranPositions(a = null, b = null) {
  if (!a?.surah || !b?.surah) return 0;
  if (a.surah !== b.surah) return a.surah - b.surah;
  return (a.ayah ?? 0) - (b.ayah ?? 0);
}

function isPositionWithinDescendingRange(position = null, start = null, end = null) {
  if (!position?.surah || !start?.surah || !end?.surah) return false;

  if (start.surah === end.surah) {
    if (position.surah !== start.surah) return false;
    return (position.ayah ?? 0) >= (start.ayah ?? 0) && (position.ayah ?? 0) <= (end.ayah ?? 0);
  }

  if (position.surah === start.surah) {
    return (position.ayah ?? 0) >= (start.ayah ?? 0);
  }

  if (position.surah === end.surah) {
    return (position.ayah ?? 0) <= (end.ayah ?? 0);
  }

  return position.surah < start.surah && position.surah > end.surah;
}

function buildDisplayBoundary(segment = null) {
  if (!segment) return null;

  return {
    surah: segment?.surah ?? null,
    surah_name: segment?.name || "",
    ayah: segment?.ayah ?? segment?.start_ayah ?? segment?.end_ayah ?? null,
    page: segment?.page ?? null,
  };
}

function buildDisplayTextFromRange(start = null, end = null, fallback = "") {
  const startSurahName = start?.surah_name || "";
  const endSurahName = end?.surah_name || "";
  const startAyah = start?.ayah;
  const endAyah = end?.ayah;

  if (!startSurahName || !endSurahName || startAyah == null || endAyah == null) {
    return fallback;
  }

  if (startSurahName === endSurahName) {
    return `${startSurahName}: ${startAyah} - ${endAyah}`;
  }

  return `${startSurahName} ${startAyah} → ${endSurahName} ${endAyah}`;
}

function formatHifzMissionDisplay(start = null, end = null) {
  const startSurahName = start?.surah_name || "";
  const endSurahName = end?.surah_name || "";
  const startAyah = start?.ayah;
  const endAyah = end?.ayah;

  if (!startSurahName || !endSurahName || startAyah == null || endAyah == null) {
    return "";
  }

  if (startSurahName === endSurahName) {
    return `${startSurahName}: ${startAyah} - ${endAyah}`;
  }

  return `من ${startSurahName} ${startAyah} إلى ${endSurahName} ${endAyah}`;
}

function getReferencePagesMap(curriculum = externalCurriculum) {
  return new Map(
    toArray(curriculum?.reference?.pages)
      .filter((page) => Number.isFinite(page?.page))
      .map((page) => [page.page, page])
  );
}

function buildDisplayRangeFromPageSegments(segments = [], fallback = "") {
  const firstSegment = segments[0] || null;
  const lastSegment = segments[segments.length - 1] || firstSegment;
  const start = buildDisplayBoundary(
    firstSegment
      ? {
          surah: firstSegment.surah,
          name: firstSegment.name,
          start_ayah: firstSegment.start_ayah,
          page: firstSegment.page,
        }
      : null
  );
  const end = buildDisplayBoundary(
    lastSegment
      ? {
          surah: lastSegment.surah,
          name: lastSegment.name,
          end_ayah: lastSegment.end_ayah,
          page: lastSegment.page,
        }
      : null
  );

  return {
    start,
    end,
    display_text: formatHifzMissionDisplay(start, end) || buildDisplayTextFromRange(start, end, fallback),
  };
}

function buildDisplayRangeFromPages(pageUnit = {}, curriculum = externalCurriculum) {
  const segments = toArray(pageUnit?.segments);
  if (segments.length) {
    return buildDisplayRangeFromPageSegments(segments, pageUnit?.label || "");
  }

  const pageNumbers = toArray(pageUnit?.pages)
    .filter((page) => Number.isFinite(page))
    .sort((a, b) => b - a);
  if (!pageNumbers.length) {
    return {
      start: null,
      end: null,
      display_text: pageUnit?.label || "",
    };
  }

  const pagesByNumber = getReferencePagesMap(curriculum);
  return buildDisplayRangeFromPageSegments(
    buildPageUnitSegments(pageNumbers, pagesByNumber),
    pageUnit?.label || ""
  );
}

function resolveEffectivePages(startPage, level = 1, curriculum = externalCurriculum) {
  const normalizedStartPage = Number.parseInt(startPage, 10);
  if (!Number.isFinite(normalizedStartPage)) return [];

  const pageTrack = getCurriculumTrack(PAGE_TRACK_ID);
  const units = getAllCurriculumHifzUnits().filter((unit) => unit?.trackId === PAGE_TRACK_ID);
  const startUnitIndex = units.findIndex((unit) => unit?.startPage === normalizedStartPage);
  if (!pageTrack || startUnitIndex === -1) return [];

  const selectedUnits = units.slice(startUnitIndex, startUnitIndex + normalizeLevel(level));
  return selectedUnits.flatMap((unit) => toArray(unit.pages));
}

function getReferenceSurahs(curriculum = externalCurriculum) {
  return toArray(curriculum?.reference?.surahs);
}

function getSurahReference(surahNumber, curriculum = externalCurriculum) {
  return getReferenceSurahs(curriculum).find((surah) => surah?.surah === surahNumber) || null;
}

function getNextAyahPosition(position = null, curriculum = externalCurriculum) {
  if (!position?.surah || !position?.ayah) return null;

  const currentSurah = getSurahReference(position.surah, curriculum);
  if (!currentSurah) return null;

  if (position.ayah < currentSurah.ayah_count) {
    return {
      surah: currentSurah.surah,
      surah_name: currentSurah.name || "",
      ayah: position.ayah + 1,
      page: position.page ?? currentSurah.start_page ?? null,
    };
  }

  const surahs = getReferenceSurahs(curriculum);
  const currentIndex = surahs.findIndex((surah) => surah?.surah === currentSurah.surah);
  const nextSurah = currentIndex > 0 ? surahs[currentIndex - 1] || null : null;
  if (!nextSurah) return null;

  return {
    surah: nextSurah.surah,
    surah_name: nextSurah.name || "",
    ayah: 1,
    page: nextSurah.start_page ?? null,
  };
}

function countAyahsInDescendingRange(start = null, end = null, curriculum = externalCurriculum) {
  if (!start?.surah || !start?.ayah || !end?.surah || !end?.ayah) return 0;
  if (start.surah < end.surah) return 0;
  if (start.surah === end.surah && start.ayah > end.ayah) return 0;

  let total = 0;

  for (let surahNumber = start.surah; surahNumber >= end.surah; surahNumber -= 1) {
    const surahRef = getSurahReference(surahNumber, curriculum);
    if (!surahRef?.ayah_count) continue;

    const rangeStartAyah = surahNumber === start.surah ? start.ayah : 1;
    const rangeEndAyah = surahNumber === end.surah ? end.ayah : surahRef.ayah_count;

    if (rangeEndAyah >= rangeStartAyah) {
      total += rangeEndAyah - rangeStartAyah + 1;
    }
  }

  return total;
}

function getFlexiblePlanStartBoundary(student = {}, curriculum = externalCurriculum) {
  const storedStart = cloneBoundary(student?.flexible_plan_start || student?.flexible_start || null);
  if (storedStart?.surah && storedStart?.ayah) {
    if (!storedStart.surah_name) {
      storedStart.surah_name = getSurahReference(storedStart.surah, curriculum)?.name || "";
    }
    return storedStart;
  }

  const startUnit = getCurriculumUnitAt(student?.hifz_start_id ?? 0);
  return cloneBoundary(startUnit?.start || null);
}

function normalizeFlexibleStart(student = {}, curriculum = externalCurriculum) {
  if (hasExternalCurriculumRuntime()) {
    const phaseId =
      student?.hifz_current_phase_id ||
      getCurriculumUnitAt(student?.hifz_progress ?? student?.hifz_start_id ?? 0)?.phaseId ||
      null;
    const phaseRange = phaseId ? getPhaseUnitRange(phaseId) : null;
    const phaseStart = cloneBoundary(phaseRange?.startUnit?.start || null);
    const phaseEnd = cloneBoundary(phaseRange?.endUnit?.end || null);

    const rawStart = cloneBoundary(student?.last_approved_hifz_end || student?.flexible_start || null);
    const candidateStart =
      rawStart?.surah && rawStart?.ayah
        ? (
            student?.last_approved_hifz_end
              ? getNextAyahPosition(rawStart, curriculum) || rawStart
              : rawStart
          )
        : phaseStart;

    if (!candidateStart?.surah || !candidateStart?.ayah || !phaseStart?.surah || !phaseEnd?.surah) {
      return candidateStart || phaseStart;
    }

    if (!isPositionWithinDescendingRange(candidateStart, phaseStart, phaseEnd)) {
      return phaseStart;
    }

    if (!candidateStart.surah_name) {
      candidateStart.surah_name = getSurahReference(candidateStart.surah, curriculum)?.name || "";
    }

    return candidateStart;
  }

  const lastApprovedEnd = cloneBoundary(student?.last_approved_hifz_end || null);
  if (lastApprovedEnd?.surah && lastApprovedEnd?.ayah) {
    return getNextAyahPosition(lastApprovedEnd, curriculum);
  }

  const flexibleStart = cloneBoundary(student?.flexible_start || null);
  if (flexibleStart?.surah && flexibleStart?.ayah) {
    if (!flexibleStart.surah_name) {
      flexibleStart.surah_name = getSurahReference(flexibleStart.surah, curriculum)?.name || "";
    }
    return flexibleStart;
  }

  const fallbackSurah = Number.isFinite(student?.flex_surah_number) ? student.flex_surah_number : 114;
  const fallbackAyah = Number.isFinite(student?.flex_next_ayah) ? student.flex_next_ayah : 1;
  const fallbackSurahRef = getSurahReference(fallbackSurah, curriculum);

  return {
    surah: fallbackSurah,
    surah_name: fallbackSurahRef?.name || "",
    ayah: fallbackAyah,
    page: fallbackSurahRef?.start_page ?? null,
  };
}

function buildFlexibleHifzMission(student = {}, curriculum = externalCurriculum) {
  const start = normalizeFlexibleStart(student, curriculum);
  if (!start?.surah || !start?.ayah) return null;

  const surahRef = getSurahReference(start.surah, curriculum);
  let endAyahMax = surahRef?.ayah_count ?? start.ayah;
  let phaseId =
    student?.hifz_current_phase_id ||
    getCurriculumUnitAt(student?.hifz_progress ?? student?.hifz_start_id ?? 0)?.phaseId ||
    null;
  let phaseName = null;

  if (hasExternalCurriculumRuntime()) {
    const phaseRange = phaseId ? getPhaseUnitRange(phaseId) : null;
    const phaseEnd = cloneBoundary(phaseRange?.endUnit?.end || null);
    const phase = phaseId ? getCurriculumPhase(phaseId) : null;
    phaseName = phase?.name || null;

    if (phaseEnd?.surah === start.surah && Number.isFinite(phaseEnd?.ayah)) {
      endAyahMax = Math.min(endAyahMax, phaseEnd.ayah);
    }

    if (endAyahMax < start.ayah) {
      return null;
    }
  }

  return {
    type: "hifz",
    mode: "flexible",
    units: [],
    start,
    end: null,
    display_text: `${start.surah_name}: ${start.ayah}`,
    description: `${start.surah_name}: ${start.ayah}`,
    allow_student_to_choose_end: true,
    surahIdx: Number.isFinite(student?.flex_surah_index) ? student.flex_surah_index : 0,
    surah_number: start.surah,
    surah_name_ar: start.surah_name,
    startAyah: start.ayah,
    endAyahMax,
    phaseId,
    phaseName,
    points: DEFAULT_HIFZ_POINTS,
  };
}

function getCurriculumUnitForPosition(position = null) {
  if (!position?.surah || !position?.ayah) return null;

  return getAllCurriculumHifzUnits().find((unit) => {
    if (!unit?.start?.surah || !unit?.end?.surah) return false;
    return isPositionWithinDescendingRange(position, unit.start, unit.end);
  }) || null;
}

function getFlexibleApprovedExternalHifzState(student = {}, approvedEnd = null) {
  const phaseId =
    student?.hifz_current_phase_id ||
    getCurriculumUnitAt(student?.hifz_progress ?? student?.hifz_start_id ?? 0)?.phaseId ||
    null;
  const phaseRange = phaseId ? getPhaseUnitRange(phaseId) : null;
  if (!phaseRange || !approvedEnd?.surah || !approvedEnd?.ayah) return null;

  const phaseEnd = cloneBoundary(phaseRange.endUnit?.end || null);
  const nextStart = getNextAyahPosition(approvedEnd) || approvedEnd;
  const reachedPhaseGate = compareQuranPositions(approvedEnd, phaseEnd) === 0;
  const currentUnit = getCurriculumUnitForPosition(approvedEnd) || phaseRange.endUnit;
  const nextUnit = reachedPhaseGate ? null : (getCurriculumUnitForPosition(nextStart) || currentUnit);

  return {
    hifz_mode: "flexible",
    last_approved_hifz_end: approvedEnd,
    flexible_start: reachedPhaseGate ? approvedEnd : nextStart,
    flex_surah_number: reachedPhaseGate ? approvedEnd.surah : nextStart.surah,
    flex_next_ayah: reachedPhaseGate ? approvedEnd.ayah : nextStart.ayah,
    hifz_progress: nextUnit?.index ?? phaseRange.endIndex + 1,
    hifz_status: reachedPhaseGate ? HIFZ_AWAITING_NOMINATION_STATUS : HIFZ_ACTIVE_STATUS,
    hifz_pending_phase_id: reachedPhaseGate ? phaseId : null,
    hifz_current_phase_id: phaseId,
    hifz_current_track_id: currentUnit?.trackId || student.hifz_current_track_id || null,
    last_completed_hifz_unit_id: currentUnit?.id || student.last_completed_hifz_unit_id || null,
    last_completed_hifz_surah: approvedEnd.surah,
  };
}

function buildDisplayRangeFromAyahUnits(units = []) {
  if (!units.length) {
    return {
      start: null,
      end: null,
      display_text: "",
    };
  }

  const first = units[0];
  const last = units[units.length - 1];
  const start = buildDisplayBoundary({
    surah: first?.start?.surah,
    name: first?.start?.name,
    ayah: first?.start?.ayah,
    page: first?.start?.page,
  });
  const end = buildDisplayBoundary({
    surah: last?.end?.surah,
    name: last?.end?.name,
    ayah: last?.end?.ayah,
    page: last?.end?.page,
  });

  return {
    start,
    end,
    display_text: formatHifzMissionDisplay(start, end) || buildDisplayTextFromRange(start, end, first?.label || ""),
  };
}

function buildPageSegmentsChunks(segments = []) {
  if (!segments.length) return [];

  const chunks = [];
  let currentChunk = [];

  toArray(segments).forEach((segment) => {
    if (!segment) return;

    const currentSurah = currentChunk[0]?.surah ?? null;
    if (!currentChunk.length || currentSurah === segment.surah) {
      currentChunk.push(segment);
      return;
    }

    chunks.push(currentChunk);
    currentChunk = [segment];
  });

  if (currentChunk.length) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function buildPageUnitLabelFromSegments(segments = []) {
  const firstSegment = segments[0] || null;
  const lastSegment = segments[segments.length - 1] || firstSegment;
  const start = buildDisplayBoundary(
    firstSegment
      ? {
          surah: firstSegment.surah,
          name: firstSegment.name,
          start_ayah: firstSegment.start_ayah,
          page: firstSegment.page,
        }
      : null
  );
  const end = buildDisplayBoundary(
    lastSegment
      ? {
          surah: lastSegment.surah,
          name: lastSegment.name,
          end_ayah: lastSegment.end_ayah,
          page: lastSegment.page,
        }
      : null
  );

  return formatHifzMissionDisplay(start, end) || buildDisplayTextFromRange(start, end, "");
}

function buildPageUnits(referencePages = [], sharedPageExceptions = [], pageTrack = null, pagePhase = null, fixedUnitsCount = 0) {
  if (!pageTrack?.start_boundary?.surah || !pageTrack?.end_boundary?.surah) {
    return [];
  }

  const startSurah = Math.max(pageTrack.start_boundary.surah, pageTrack.end_boundary.surah);
  const endSurah = Math.min(pageTrack.start_boundary.surah, pageTrack.end_boundary.surah);
  const sortedPages = toArray(referencePages)
    .filter((page) => Number.isFinite(page?.page))
    .sort((a, b) => a.page - b.page);
  const generatedUnits = [];

  for (let surahNumber = startSurah; surahNumber >= endSurah; surahNumber -= 1) {
    sortedPages.forEach((pageEntry) => {
      toArray(pageEntry?.segments)
        .filter((segment) => Number.isFinite(segment?.surah) && segment.surah === surahNumber)
        .forEach((segment) => {
          const clippedStartAyah =
            surahNumber === pageTrack.start_boundary.surah
              ? Math.max(segment.start_ayah ?? 1, pageTrack.start_boundary.ayah ?? 1)
              : segment.start_ayah ?? 1;
          const clippedEndAyah =
            surahNumber === pageTrack.end_boundary.surah
              ? Math.min(segment.end_ayah ?? segment.start_ayah ?? 1, pageTrack.end_boundary.ayah ?? segment.end_ayah ?? 1)
              : segment.end_ayah ?? segment.start_ayah ?? 1;

          if (!Number.isFinite(clippedStartAyah) || !Number.isFinite(clippedEndAyah) || clippedStartAyah > clippedEndAyah) {
            return;
          }

          const unitSegments = [
            {
              page: pageEntry.page,
              surah: surahNumber,
              name: segment?.name ?? "",
              start_ayah: clippedStartAyah,
              end_ayah: clippedEndAyah,
            },
          ];

          generatedUnits.push({
            id: "",
            trackId: pageTrack.id,
            phaseId: pagePhase?.id || null,
            order: 0,
            type: "page_range",
            measurementType: "page_range",
            label: buildPageUnitLabelFromSegments(unitSegments) || buildPageUnitLabel([pageEntry.page]),
            startPage: pageEntry.page,
            endPage: pageEntry.page,
            pages: [pageEntry.page],
            start: {
              surah: surahNumber,
              ayah: clippedStartAyah,
              name: segment?.name ?? "",
              page: pageEntry.page,
            },
            end: {
              surah: surahNumber,
              ayah: clippedEndAyah,
              name: segment?.name ?? "",
              page: pageEntry.page,
            },
            examGate: false,
            points: DEFAULT_HIFZ_POINTS,
            source: "generated_page_units",
            segments: unitSegments,
          });
        });
    });
  }

  return generatedUnits.map((unit, index) => ({
    ...unit,
    id: `generated_page_unit_${String(index + 1).padStart(4, "0")}`,
    order: fixedUnitsCount + index + 1,
  }));
}

function buildRuntimePhaseRange(phase = null, matchedUnits = []) {
  const units = toArray(matchedUnits).filter((unit) => Number.isFinite(unit?.index));
  if (!phase || !units.length) return null;

  const sortedUnits = [...units].sort((a, b) => a.index - b.index);
  return {
    phase,
    startUnit: sortedUnits[0],
    endUnit: sortedUnits[sortedUnits.length - 1],
    startIndex: sortedUnits[0].index,
    endIndex: sortedUnits[sortedUnits.length - 1].index,
  };
}

function resolvePhaseUnitRangeFromBoundaries(phase = null, units = []) {
  if (!phase?.track_id || !phase?.start_boundary || !phase?.end_boundary) return null;

  const matchedUnits = toArray(units).filter((unit) => {
    if (unit?.trackId !== phase.track_id || !unit?.start || !unit?.end) return false;
    const unitSurah = unit.start?.surah ?? unit.end?.surah ?? null;
    if (!Number.isFinite(unitSurah)) return false;

    const startSurah = phase.start_boundary.surah;
    const endSurah = phase.end_boundary.surah;
    if (!Number.isFinite(startSurah) || !Number.isFinite(endSurah)) return false;
    if (unitSurah > startSurah || unitSurah < endSurah) return false;

    if (unitSurah === startSurah && (unit.start?.ayah ?? unit.end?.ayah ?? 0) < (phase.start_boundary.ayah ?? 1)) {
      return false;
    }

    if (unitSurah === endSurah && (unit.end?.ayah ?? unit.start?.ayah ?? 0) > (phase.end_boundary.ayah ?? Number.MAX_SAFE_INTEGER)) {
      return false;
    }

    return true;
  });

  return buildRuntimePhaseRange(phase, matchedUnits);
}

function resolvePhaseUnitRange(phase = null, unitsById = null, units = []) {
  if (!phase) return null;

  const matchedByPhaseId = toArray(units).filter((unit) => unit?.phaseId === phase.id);
  const runtimeRange = buildRuntimePhaseRange(phase, matchedByPhaseId);
  if (runtimeRange) return runtimeRange;

  const boundaryRange = resolvePhaseUnitRangeFromBoundaries(phase, units);
  if (boundaryRange) return boundaryRange;

  if (!unitsById?.size) return null;

  const startUnit = unitsById.get(phase.start_unit_id) || null;
  const endUnit = unitsById.get(phase.end_unit_id) || null;
  if (!startUnit || !endUnit) return null;
  if (!Number.isFinite(startUnit.index) || !Number.isFinite(endUnit.index)) return null;

  return {
    phase,
    startUnit,
    endUnit,
    startIndex: Math.min(startUnit.index, endUnit.index),
    endIndex: Math.max(startUnit.index, endUnit.index),
  };
}

function assignGeneratedPagePhaseIds(unitsByIndex = [], phaseMaps = null) {
  if (!unitsByIndex.length) return [];

  const branchPagePhases = toArray(phaseMaps?.byTrack?.get(PAGE_TRACK_ID)).filter(
    (phase) => typeof phase?.id === "string" && phase.id.startsWith("phase_branch_")
  );
  const preferredPagePhases = branchPagePhases.length
    ? branchPagePhases
    : toArray(phaseMaps?.byTrack?.get(PAGE_TRACK_ID));
  const pagePhaseRanges = preferredPagePhases
    .map((phase) => resolvePhaseUnitRangeFromBoundaries(phase, unitsByIndex))
    .filter((range) => range?.phase?.track_id === PAGE_TRACK_ID)
    .sort((a, b) => a.startIndex - b.startIndex);

  return unitsByIndex.map((unit) => {
    if (unit?.trackId !== PAGE_TRACK_ID) return unit;

    const matchedRange = pagePhaseRanges.find(
      (range) => unit.index >= range.startIndex && unit.index <= range.endIndex
    );
    if (!matchedRange) return unit;

    return {
      ...unit,
      phaseId: matchedRange.phase.id,
    };
  });
}

function buildCurriculumRuntime(curriculum) {
  const coreCurriculum = curriculum?.curriculum_scaffold?.core_curriculum || null;
  const tracks = toArray(coreCurriculum?.tracks);
  const phases = toArray(coreCurriculum?.phases);
  const fixedUnits = buildFixedUnits(coreCurriculum?.units);
  const trackMap = buildTrackMap(tracks);
  const phaseMaps = buildPhaseMaps(phases);
  const pageTrack = trackMap.get(PAGE_TRACK_ID) || null;
  const generatedPageUnits = buildPageUnits(
    curriculum?.reference?.pages,
    curriculum?.shared_page_exceptions,
    pageTrack,
    null,
    fixedUnits.length
  );
  const allUnits = [...fixedUnits, ...generatedPageUnits];
  const indexedUnits = allUnits.map((unit, index) => ({ ...unit, index }));
  const unitsByIndex = assignGeneratedPagePhaseIds(indexedUnits, phaseMaps);
  const unitsById = new Map(unitsByIndex.map((unit) => [unit.id, unit]));
  const phasesByTrack = phaseMaps.byTrack;
  const phaseRangeCache = new Map();
  const externalGroups = [];
  let currentGroup = null;

  unitsByIndex.forEach((unit) => {
    if (!currentGroup || currentGroup.phaseId !== unit.phaseId || currentGroup.trackId !== unit.trackId) {
      const phase = phaseMaps.byId.get(unit.phaseId) || null;
      const track = trackMap.get(unit.trackId) || null;
      currentGroup = {
        phaseId: unit.phaseId || null,
        trackId: unit.trackId || null,
        title: phase?.name || track?.name || "الحفظ",
        units: [],
      };
      externalGroups.push(currentGroup);
    }

    currentGroup.units.push(unit);
  });

  return {
    curriculum,
    trackMap,
    phaseMaps,
    phasesByTrack,
    units: unitsByIndex,
    unitsById,
    phaseRangeCache,
    externalGroups,
  };
}

const curriculumRuntime = buildCurriculumRuntime(externalCurriculum);

function hasExternalCurriculumRuntime() {
  return Boolean(curriculumRuntime?.units?.length);
}

function getAllCurriculumHifzUnits() {
  return curriculumRuntime?.units || [];
}

function getCurriculumTrack(trackId) {
  return curriculumRuntime?.trackMap?.get(trackId) || null;
}

function getCurriculumPhase(phaseId) {
  return curriculumRuntime?.phaseMaps?.byId?.get(phaseId) || null;
}

function getPhaseUnitRange(phaseId) {
  if (!phaseId) return null;
  if (curriculumRuntime?.phaseRangeCache?.has(phaseId)) {
    return curriculumRuntime.phaseRangeCache.get(phaseId) || null;
  }

  const phase = getCurriculumPhase(phaseId);
  const range = resolvePhaseUnitRange(phase, curriculumRuntime?.unitsById, curriculumRuntime?.units);
  curriculumRuntime?.phaseRangeCache?.set(phaseId, range || null);
  return range;
}

function getCurriculumUnitAt(index) {
  return getAllCurriculumHifzUnits()[index] || null;
}

function getCurriculumUnitById(unitId) {
  if (!unitId) return null;
  return curriculumRuntime?.unitsById?.get(unitId) || null;
}

function resolveCurriculumPlanFromPhaseStart(phaseId, startUnitRef) {
  const phase = getCurriculumPhase(phaseId);
  if (!phase) return null;

  const phaseRange = getPhaseUnitRange(phaseId);
  if (!phaseRange) return null;

  const startUnit =
    typeof startUnitRef === "string"
      ? getCurriculumUnitById(startUnitRef)
      : Number.isFinite(startUnitRef)
      ? getCurriculumUnitAt(startUnitRef)
      : null;

  if (!startUnit || startUnit.trackId !== (phase.track_id || startUnit.trackId || null)) {
    return null;
  }

  if (startUnit.index < phaseRange.startIndex || startUnit.index > phaseRange.endIndex) {
    return null;
  }

  const endUnit = phaseRange.endUnit;
  if (!Number.isFinite(startUnit.index) || !Number.isFinite(endUnit.index) || startUnit.index > endUnit.index) {
    return null;
  }

  return {
    phaseId: phase.id,
    trackId: startUnit.trackId || phase.track_id || null,
    startUnitId: startUnit.id,
    endUnitId: endUnit.id,
    hifz_start_id: startUnit.index,
    hifz_progress: startUnit.index,
    hifz_end_id: endUnit.index,
  };
}

function getCurriculumProgressIndex(student = {}) {
  const fallbackStart = toFiniteNumber(student.hifz_start_id, 0) ?? 0;
  return toFiniteNumber(student.hifz_progress, fallbackStart) ?? 0;
}

function getCurriculumPlanStartIndex(student = {}) {
  return Math.max(0, toFiniteNumber(student.hifz_start_id, 0) ?? 0);
}

function getCurriculumPlanEndIndex(student = {}) {
  const units = getAllCurriculumHifzUnits();
  const fallbackEnd = Math.max(0, units.length - 1);
  const candidate = toFiniteNumber(student.hifz_end_id, fallbackEnd);
  return Math.max(0, Math.min(candidate ?? fallbackEnd, fallbackEnd));
}

function getStudentHifzStatus(student = {}) {
  return normalizeLegacyHifzStatus(student.hifz_status);
}

function shouldStopForAwaitingTest(student = {}) {
  return [
    HIFZ_AWAITING_NOMINATION_STATUS,
    HIFZ_NOMINATED_FOR_TEST_STATUS,
    HIFZ_TEST_FAILED_STATUS,
  ].includes(getStudentHifzStatus(student));
}

function buildMergedMissionDisplayRangeLegacy(units) {
  if (!units.length) return "";

  const first = units[0];
  const last = units[units.length - 1];
  const measurementType = first.measurementType;

  if (measurementType === "page_range") {
    const start = buildDisplayBoundary({
      surah: first?.start?.surah,
      name: first?.start?.name,
      ayah: first?.start?.ayah,
      page: first?.start?.page,
    });
    const end = buildDisplayBoundary({
      surah: last?.end?.surah,
      name: last?.end?.name,
      ayah: last?.end?.ayah,
      page: last?.end?.page,
    });
    return formatHifzMissionDisplay(start, end) || first.label || "";
  }

  const startSurahName = first?.start?.name || "";
  const endSurahName = last?.end?.name || startSurahName;
  const startAyah = first?.start?.ayah ?? first?.start?.start_ayah ?? null;
  const endAyah = last?.end?.ayah ?? last?.end?.end_ayah ?? null;

  if (!startSurahName || startAyah == null || endAyah == null) {
    return first.label || "";
  }

  if (startSurahName === endSurahName) {
    return `${startSurahName} (${startAyah}-${endAyah})`;
  }

  return `${startSurahName} (${startAyah}) - ${endSurahName} (${endAyah})`;
}

function buildMergedMissionDisplayRange(units) {
  if (!units.length) {
    return {
      start: null,
      end: null,
      display_text: "",
    };
  }

  const first = units[0];
  if (first.measurementType === "page_range") {
    return buildDisplayRangeFromPageSegments(
      units.flatMap((unit) => toArray(unit.segments)),
      first.label || ""
    );
  }

  return buildDisplayRangeFromAyahUnits(units);
}

function buildMergedMission(units, startIndex) {
  if (!units.length) return null;

  const first = units[0];
  const last = units[units.length - 1];
  const phase = getCurriculumPhase(first.phaseId);
  const track = getCurriculumTrack(first.trackId);
  const mergedDisplayRange = buildMergedMissionDisplayRange(units);

  return {
    type: "hifz",
    mode: first.measurementType === "page_range" ? "page" : "fixed",
    startIndex,
    lastIndex: last.index,
    points: DEFAULT_HIFZ_POINTS,
    displayRange: mergedDisplayRange,
    description: formatHifzMissionDisplay(mergedDisplayRange.start, mergedDisplayRange.end) || mergedDisplayRange.display_text,
    display_text: formatHifzMissionDisplay(mergedDisplayRange.start, mergedDisplayRange.end) || mergedDisplayRange.display_text,
    measurementType: first.measurementType,
    units: units.map((unit) => ({
      id: unit.id,
      start: cloneBoundary(unit.start),
      end: cloneBoundary(unit.end),
      pages: toArray(unit.pages),
      measurementType: unit.measurementType,
    })),
    unitIds: units.map((unit) => unit.id),
    phaseId: first.phaseId || null,
    trackId: first.trackId || null,
    phaseName: phase?.name || null,
    trackName: track?.name || null,
    start: first.start || null,
    end: last.end || null,
    startPage: first.startPage ?? null,
    endPage: last.endPage ?? null,
  };
}

function getMergedUnitsFromIndex(startIndex, level, planEndIndex = Number.POSITIVE_INFINITY) {
  const units = getAllCurriculumHifzUnits();
  const first = units[startIndex];
  if (!first) return [];

  const maxUnits = normalizeLevel(level);
  const merged = [first];

  for (let index = startIndex + 1; index < units.length && index <= planEndIndex && merged.length < maxUnits; index += 1) {
    const candidate = units[index];
    if (!candidate) break;
    if (candidate.trackId !== first.trackId) break;
    if (candidate.phaseId !== first.phaseId) break;

    const lastMergedUnit = merged[merged.length - 1];

    if (first.measurementType === "ayah_range") {
      const firstSurah = first?.start?.surah ?? first?.end?.surah ?? null;
      const candidateSurah = candidate?.start?.surah ?? candidate?.end?.surah ?? null;
      if (firstSurah != null && candidateSurah != null && candidateSurah !== firstSurah) {
        break;
      }
    }

    if (first.measurementType === "page_range") {
      const lastMergedSurah = lastMergedUnit?.end?.surah ?? lastMergedUnit?.start?.surah ?? null;
      const candidateStartSurah = candidate?.start?.surah ?? candidate?.end?.surah ?? null;

      // Keep page merging conservative at unit boundaries:
      // allow mixed-surah content inside one page unit, but stop when merging
      // two separate units would jump from one surah boundary into another.
      if (
        lastMergedSurah != null &&
        candidateStartSurah != null &&
        candidateStartSurah !== lastMergedSurah
      ) {
        break;
      }
    }

    merged.push(candidate);
  }

  return merged;
}

function isLastUnitInPhase(unit) {
  if (!unit?.phaseId) return false;
  const phase = getCurriculumPhase(unit.phaseId);
  const phaseRange = resolvePhaseUnitRange(phase, curriculumRuntime?.unitsById, curriculumRuntime?.units);
  return Boolean(phaseRange?.endUnit?.id && unit.id === phaseRange.endUnit.id);
}

function getCurrentExternalHifzMission(student = {}) {
  if (!hasExternalCurriculumRuntime() || shouldStopForAwaitingTest(student)) {
    return null;
  }

  const units = getAllCurriculumHifzUnits();
  const planStartIndex = getCurriculumPlanStartIndex(student);
  const planEndIndex = getCurriculumPlanEndIndex(student);
  const startIndex = Math.max(planStartIndex, getCurriculumProgressIndex(student));
  if (startIndex >= units.length || startIndex > planEndIndex) return null;

  return buildMergedMission(getMergedUnitsFromIndex(startIndex, student.hifz_level, planEndIndex), startIndex);
}

function buildHifzMission(student = {}, curriculum = externalCurriculum) {
  if (hasExternalCurriculumRuntime() && shouldStopForAwaitingTest(student)) {
    return null;
  }

  if ((student?.hifz_mode || "fixed") === "flexible") {
    return buildFlexibleHifzMission(student, curriculum);
  }

  if (!hasExternalCurriculumRuntime()) {
    return null;
  }

  return getCurrentExternalHifzMission(student);
}

function getNextExternalHifzMission(student = {}) {
  if (!hasExternalCurriculumRuntime() || shouldStopForAwaitingTest(student)) {
    return null;
  }

  const currentMission = getCurrentExternalHifzMission(student);
  if (!currentMission) return null;

  const currentLastUnit = getCurriculumUnitAt(currentMission.lastIndex);
  if (isLastUnitInPhase(currentLastUnit)) {
    return null;
  }

  const nextStartIndex = currentMission.lastIndex + 1;
  const planEndIndex = getCurriculumPlanEndIndex(student);
  if (nextStartIndex > planEndIndex) return null;
  return buildMergedMission(getMergedUnitsFromIndex(nextStartIndex, student.hifz_level, planEndIndex), nextStartIndex);
}

function computeExternalHifzPercent(student = {}) {
  const units = getAllCurriculumHifzUnits();
  if (!units.length) return 0;

  if ((student?.hifz_mode || "fixed") === "flexible") {
    const phaseId =
      student?.hifz_current_phase_id ||
      getCurriculumUnitAt(student?.hifz_end_id ?? student?.hifz_start_id ?? 0)?.phaseId ||
      null;
    const phaseRange = phaseId ? getPhaseUnitRange(phaseId) : null;
    const phaseEnd = cloneBoundary(phaseRange?.endUnit?.end || getCurriculumUnitAt(student?.hifz_end_id ?? 0)?.end || null);
    const planStart = getFlexiblePlanStartBoundary(student);
    const approvedEnd = cloneBoundary(student?.last_approved_hifz_end || null);

    if (planStart?.surah && planStart?.ayah && phaseEnd?.surah && phaseEnd?.ayah) {
      const total = countAyahsInDescendingRange(planStart, phaseEnd);
      if (total > 0) {
        const done = approvedEnd?.surah && approvedEnd?.ayah
          ? Math.min(total, countAyahsInDescendingRange(planStart, approvedEnd))
          : 0;
        return Math.round((done / total) * 100);
      }
    }
  }

  const startIndex = getCurriculumPlanStartIndex(student);
  const endIndex = getCurriculumPlanEndIndex(student);
  const progressIndex = Math.max(startIndex, Math.min(getCurriculumProgressIndex(student), endIndex + 1));
  const span = Math.max(1, endIndex - startIndex + 1);
  const done = Math.max(0, Math.min(progressIndex - startIndex, span));

  return Math.round((done / span) * 100);
}

function getExternalHifzPlanBounds(student = {}) {
  const units = getAllCurriculumHifzUnits();
  if (!units.length) {
    return { startLabel: "-", endLabel: "-" };
  }

  const first = units[getCurriculumPlanStartIndex(student)] || units[0];
  const last = units[getCurriculumPlanEndIndex(student)] || units[units.length - 1];

  return {
    startLabel: first?.start?.name || first?.label || "-",
    endLabel: last?.end?.name || last?.label || "-",
  };
}

function getPhaseForProgressIndex(index) {
  const unit = getCurriculumUnitAt(index);
  return unit ? getCurriculumPhase(unit.phaseId) : null;
}

function getExternalHifzCurriculumGroups() {
  if (curriculumRuntime?.externalGroups?.length) {
    return curriculumRuntime.externalGroups;
  }

  const units = getAllCurriculumHifzUnits();
  if (!units.length) return [];

  const groups = [];
  let currentGroup = null;

  units.forEach((unit) => {
    if (!currentGroup || currentGroup.phaseId !== unit.phaseId || currentGroup.trackId !== unit.trackId) {
      const phase = getCurriculumPhase(unit.phaseId);
      const track = getCurriculumTrack(unit.trackId);
      currentGroup = {
        phaseId: unit.phaseId || null,
        trackId: unit.trackId || null,
        title: phase?.name || track?.name || "الحفظ",
        units: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.units.push(unit);
  });

  return groups;
}

function getApprovedExternalHifzState(student = {}, mission = null) {
  if (!mission) return null;

  const lastIndex = Number.isFinite(mission.lastIndex) ? mission.lastIndex : getCurriculumProgressIndex(student);
  const nextIndex = lastIndex + 1;
  const lastUnit = getCurriculumUnitAt(lastIndex);
  const currentPhase = lastUnit ? getCurriculumPhase(lastUnit.phaseId) : null;
  const reachedPhaseGate = Boolean(currentPhase?.advance_requires_exam_pass && lastUnit && isLastUnitInPhase(lastUnit));

  return {
    hifz_progress: nextIndex,
    hifz_status: reachedPhaseGate ? HIFZ_AWAITING_NOMINATION_STATUS : HIFZ_ACTIVE_STATUS,
    hifz_pending_phase_id: reachedPhaseGate ? currentPhase?.id || null : null,
    hifz_current_track_id: lastUnit?.trackId || student.hifz_current_track_id || null,
    hifz_current_phase_id: lastUnit?.phaseId || student.hifz_current_phase_id || null,
    last_completed_hifz_unit_id: lastUnit?.id || student.last_completed_hifz_unit_id || null,
    last_completed_hifz_surah: lastUnit?.end?.surah || student.last_completed_hifz_surah || null,
  };
}

function buildStudentCurriculumSnapshot(student = {}) {
  const currentMission = getCurrentExternalHifzMission(student);
  const nextMission = getNextExternalHifzMission(student);
  const progressIndex = getCurriculumProgressIndex(student);
  const currentUnit = getCurriculumUnitAt(Math.min(progressIndex, Math.max(0, getAllCurriculumHifzUnits().length - 1)));
  const currentPhase = currentUnit ? getCurriculumPhase(currentUnit.phaseId) : null;
  const currentTrack = currentUnit ? getCurriculumTrack(currentUnit.trackId) : null;

  return {
    hifzStatus: getStudentHifzStatus(student),
    currentTrackId: currentTrack?.id || student.hifz_current_track_id || null,
    currentTrackName: currentTrack?.name || null,
    currentPhaseId: currentPhase?.id || student.hifz_current_phase_id || null,
    currentPhaseName: currentPhase?.name || null,
    pendingPhaseId: student.hifz_pending_phase_id || null,
    progressIndex,
    planStartIndex: getCurriculumPlanStartIndex(student),
    planEndIndex: getCurriculumPlanEndIndex(student),
    hifzPercent: computeExternalHifzPercent(student),
    planBounds: getExternalHifzPlanBounds(student),
    lastCompletedUnitId: student.last_completed_hifz_unit_id || null,
    lastCompletedSurah: student.last_completed_hifz_surah || null,
    currentMission,
    nextMission,
  };
}

export {
  HIFZ_ACTIVE_STATUS,
  HIFZ_AWAITING_NOMINATION_STATUS,
  HIFZ_NOMINATED_FOR_TEST_STATUS,
  HIFZ_TEST_PASSED_STATUS,
  HIFZ_TEST_FAILED_STATUS,
  hasExternalCurriculumRuntime,
  getAllCurriculumHifzUnits,
  getCurriculumTrack,
  getCurriculumPhase,
  getPhaseUnitRange,
  getCurriculumUnitAt,
  getCurriculumUnitById,
  getCurriculumProgressIndex,
  getCurriculumPlanStartIndex,
  getCurriculumPlanEndIndex,
  getCurrentExternalHifzMission,
  getNextExternalHifzMission,
  computeExternalHifzPercent,
  getExternalHifzPlanBounds,
  getApprovedExternalHifzState,
  getFlexibleApprovedExternalHifzState,
  getPhaseForProgressIndex,
  getExternalHifzCurriculumGroups,
  buildStudentCurriculumSnapshot,
  resolveCurriculumPlanFromPhaseStart,
  buildHifzMission,
  buildFlexibleHifzMission,
  buildDisplayRangeFromPages,
  resolveEffectivePages,
  formatHifzMissionDisplay,
  getNextAyahPosition,
  getStudentHifzStatus,
};
