function buildAssignedTask({ id, type, description, points, createdAt }) {
  return {
    id,
    type,
    description,
    points,
    status: "assigned",
    created_at: createdAt,
  };
}

export { buildAssignedTask };
