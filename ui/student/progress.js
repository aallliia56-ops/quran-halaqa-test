import { computeHifzPercent, computeMurajaaPercent } from "../../core/progress.js";
import {
  getCurrentMurajaaMission,
  getNextMurajaaMission,
  getCurrentHifzMission,
  getNextHifzMission,
} from "../../core/missions.js";
import {
  HIFZ_AWAITING_NOMINATION_STATUS,
  HIFZ_NOMINATED_FOR_TEST_STATUS,
  HIFZ_TEST_FAILED_STATUS,
  getStudentHifzStatus,
} from "../../modules/curriculum/curriculum-runtime.js";

function safeSetWidth(el, pct = 0) {
  if (el) el.style.width = `${pct}%`;
}

export function renderStudentProgress({ student, els, safeSetText, getStudentHifzPauseCardCopy }) {
  const hifzMission = getCurrentHifzMission(student);
  const murMission = getCurrentMurajaaMission(student);
  const hifzPauseCopy = getStudentHifzPauseCardCopy(student);

  safeSetText(
    els.hifzLabel,
    hifzMission
      ? (hifzMission.display_text || hifzMission.description)
      : ([HIFZ_AWAITING_NOMINATION_STATUS, HIFZ_NOMINATED_FOR_TEST_STATUS, HIFZ_TEST_FAILED_STATUS].includes(
          getStudentHifzStatus(student)
        )
          ? hifzPauseCopy.body
          : "لا توجد مهمة حفظ حالياً.")
  );
  safeSetText(els.murLabel, murMission ? murMission.description : "لا توجد مهمة مراجعة حالياً.");

  if (els.murLevel) {
    safeSetText(
      els.murLevel,
      murMission
        ? murMission.level === "BUILDING"
          ? "البناء"
          : murMission.level === "DEVELOPMENT"
          ? "التطوير"
          : "المتقدم"
        : "غير محدد"
    );
  }

  const nextH = getNextHifzMission(student);
  const nextM = getNextMurajaaMission(student);
  safeSetText(els.studentHifzNextLabel, `المهمة القادمة: ${nextH ? (nextH.display_text || nextH.description) : "—"}`);
  safeSetText(els.studentMurajaaNextLabel, `المهمة القادمة: ${nextM ? nextM.description : "—"}`);

  const hifzPct = computeHifzPercent(student);
  const murPct = computeMurajaaPercent(student);
  safeSetText(els.hifzPct, hifzPct);
  safeSetText(els.murPct, murPct);
  safeSetWidth(els.hifzBar, hifzPct);
  safeSetWidth(els.murBar, murPct);
}
