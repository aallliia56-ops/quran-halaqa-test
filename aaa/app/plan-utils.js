function formatPlanSummary({ startSurah = "—", endSurah = "—", points = 0, rank = "—" }) {
  return {
    line: `الخطة: من ${startSurah} إلى ${endSurah} • النقاط: ${points} • الترتيب: ${rank}`,
    plan: `الخطة: من ${startSurah} إلى ${endSurah}`,
    pointsLabel: `النقاط: ${points}`,
    rankLabel: `الترتيب: ${rank}`,
  };
}

export { formatPlanSummary };
