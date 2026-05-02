function computeRankMapForGroup(students) {
  const sorted = [...students].sort(
    (a, b) => (b.total_points || 0) - (a.total_points || 0)
  );

  const rankMap = {};
  let lastPts = null;
  let currentRank = 0;

  sorted.forEach((student, index) => {
    const pts = student.total_points || 0;
    if (lastPts === null) currentRank = 1;
    else if (pts < lastPts) currentRank = index + 1;

    rankMap[student.code] = currentRank;
    lastPts = pts;
  });

  return { sorted, rankMap };
}

function buildGroupedRanks(students) {
  const building = [];
  const devAdv = [];

  students.forEach((student) => {
    const level = student.murajaa_level || "BUILDING";
    if (level === "BUILDING") building.push(student);
    else devAdv.push(student);
  });

  const { sorted: buildingSorted, rankMap: buildingRankMap } =
    computeRankMapForGroup(building);
  const { sorted: devAdvSorted, rankMap: devAdvRankMap } =
    computeRankMapForGroup(devAdv);

  return { buildingSorted, buildingRankMap, devAdvSorted, devAdvRankMap };
}

export { computeRankMapForGroup, buildGroupedRanks };
