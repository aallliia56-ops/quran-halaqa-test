const ROLES = {
  DIRECTOR: "director",
  TEACHER: "teacher",
  ASSISTANT: "assistant",
  PARENT: "parent",
  STUDENT: "student",
};

const ROLE_PERMISSIONS = {
  [ROLES.DIRECTOR]: [
    "manage_all_halaqas",
    "manage_programs",
    "view_global_reports",
    "manage_users",
    "review_all_tasks",
  ],
  [ROLES.TEACHER]: [
    "manage_assigned_halaqas",
    "review_halaqa_tasks",
    "assign_tasks",
    "view_halaqa_reports",
  ],
  [ROLES.ASSISTANT]: [
    "review_assigned_tasks",
    "view_assigned_halaqas",
  ],
  [ROLES.PARENT]: [
    "view_linked_students",
  ],
  [ROLES.STUDENT]: [
    "view_own_tasks",
    "submit_own_tasks",
    "view_active_programs",
  ],
};

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(role, permission) {
  return getRolePermissions(role).includes(permission);
}

function getUserRole(user) {
  return user?.role || null;
}

function isStudentRole(role) {
  return role === ROLES.STUDENT;
}

function isTeacherRole(role) {
  return role === ROLES.TEACHER;
}

function isParentRole(role) {
  return role === ROLES.PARENT;
}

function isAssistantRole(role) {
  return role === ROLES.ASSISTANT;
}

function isDirectorRole(role) {
  return role === ROLES.DIRECTOR;
}

function isStudentUser(user) {
  return isStudentRole(getUserRole(user));
}

function isTeacherUser(user) {
  return isTeacherRole(getUserRole(user));
}

function isParentUser(user) {
  return isParentRole(getUserRole(user));
}

function isAssistantUser(user) {
  return isAssistantRole(getUserRole(user));
}

function isDirectorUser(user) {
  return isDirectorRole(getUserRole(user));
}

function isManagementRole(role) {
  return isDirectorRole(role) || isAssistantRole(role);
}

function isManagementUser(user) {
  return isManagementRole(getUserRole(user));
}

export {
  ROLES,
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission,
  getUserRole,
  isStudentRole,
  isTeacherRole,
  isParentRole,
  isAssistantRole,
  isDirectorRole,
  isStudentUser,
  isTeacherUser,
  isParentUser,
  isAssistantUser,
  isDirectorUser,
  isManagementRole,
  isManagementUser,
};
