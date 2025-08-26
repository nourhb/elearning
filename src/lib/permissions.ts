/**
 * Role-Based Access Control (RBAC) System
 * Defines permissions and restrictions for different user roles
 */

export type UserRole = 'admin' | 'formateur' | 'student';

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  canCreateRoles: UserRole[];
  canManageRoles: UserRole[];
  canDeleteRoles: UserRole[];
  canSuspendRoles: UserRole[];
}

// Define all available permissions
export const PERMISSIONS = {
  // User Management
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  SUSPEND_USER: 'suspend_user',
  
  // Course Management
  CREATE_COURSE: 'create_course',
  READ_COURSE: 'read_course',
  UPDATE_COURSE: 'update_course',
  DELETE_COURSE: 'delete_course',
  PUBLISH_COURSE: 'publish_course',
  
  // Quiz Management
  CREATE_QUIZ: 'create_quiz',
  READ_QUIZ: 'read_quiz',
  UPDATE_QUIZ: 'update_quiz',
  DELETE_QUIZ: 'delete_quiz',
  
  // Content Management
  CREATE_CONTENT: 'create_content',
  READ_CONTENT: 'read_content',
  UPDATE_CONTENT: 'update_content',
  DELETE_CONTENT: 'delete_content',
  
  // Analytics & Reports
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REPORTS: 'view_reports',
  
  // System Management
  MANAGE_SYSTEM: 'manage_system',
  ACCESS_ADMIN_PANEL: 'access_admin_panel',
} as const;

// Role hierarchy and permissions
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    role: 'admin',
    permissions: [
      // FULL user management - no restrictions
      { action: PERMISSIONS.CREATE_USER, resource: 'users' },
      { action: PERMISSIONS.READ_USER, resource: 'users' },
      { action: PERMISSIONS.UPDATE_USER, resource: 'users' },
      { action: PERMISSIONS.DELETE_USER, resource: 'users' },
      { action: PERMISSIONS.SUSPEND_USER, resource: 'users' },
      
      // FULL course management - no restrictions
      { action: PERMISSIONS.CREATE_COURSE, resource: 'courses' },
      { action: PERMISSIONS.READ_COURSE, resource: 'courses' },
      { action: PERMISSIONS.UPDATE_COURSE, resource: 'courses' },
      { action: PERMISSIONS.DELETE_COURSE, resource: 'courses' },
      { action: PERMISSIONS.PUBLISH_COURSE, resource: 'courses' },
      
      // FULL quiz management - no restrictions
      { action: PERMISSIONS.CREATE_QUIZ, resource: 'quizzes' },
      { action: PERMISSIONS.READ_QUIZ, resource: 'quizzes' },
      { action: PERMISSIONS.UPDATE_QUIZ, resource: 'quizzes' },
      { action: PERMISSIONS.DELETE_QUIZ, resource: 'quizzes' },
      
      // FULL content management - no restrictions
      { action: PERMISSIONS.CREATE_CONTENT, resource: 'content' },
      { action: PERMISSIONS.READ_CONTENT, resource: 'content' },
      { action: PERMISSIONS.UPDATE_CONTENT, resource: 'content' },
      { action: PERMISSIONS.DELETE_CONTENT, resource: 'content' },
      
      // FULL analytics and reports access
      { action: PERMISSIONS.VIEW_ANALYTICS, resource: 'analytics' },
      { action: PERMISSIONS.VIEW_REPORTS, resource: 'reports' },
      
      // FULL system management - complete control
      { action: PERMISSIONS.MANAGE_SYSTEM, resource: 'system' },
      { action: PERMISSIONS.ACCESS_ADMIN_PANEL, resource: 'admin' },
    ],
    // Admin can create ANY role including other admins
    canCreateRoles: ['admin', 'formateur', 'student'],
    // Admin can manage ANY user including other admins
    canManageRoles: ['admin', 'formateur', 'student'],
    // Admin can delete ANY user including other admins (with proper confirmation)
    canDeleteRoles: ['admin', 'formateur', 'student'],
    // Admin can suspend ANY user including other admins
    canSuspendRoles: ['admin', 'formateur', 'student'],
  },
  
  formateur: {
    role: 'formateur',
    permissions: [
      // Limited user management (only students)
      { action: PERMISSIONS.CREATE_USER, resource: 'users', conditions: { role: 'student' } },
      { action: PERMISSIONS.READ_USER, resource: 'users', conditions: { role: 'student' } },
      { action: PERMISSIONS.UPDATE_USER, resource: 'users', conditions: { role: 'student' } },
      
      // Course management (own courses + read access to others)
      { action: PERMISSIONS.CREATE_COURSE, resource: 'courses' },
      { action: PERMISSIONS.READ_COURSE, resource: 'courses' },
      { action: PERMISSIONS.UPDATE_COURSE, resource: 'courses', conditions: { owner: true } },
      { action: PERMISSIONS.PUBLISH_COURSE, resource: 'courses', conditions: { owner: true } },
      
      // Quiz management (own courses)
      { action: PERMISSIONS.CREATE_QUIZ, resource: 'quizzes', conditions: { courseOwner: true } },
      { action: PERMISSIONS.READ_QUIZ, resource: 'quizzes', conditions: { courseOwner: true } },
      { action: PERMISSIONS.UPDATE_QUIZ, resource: 'quizzes', conditions: { courseOwner: true } },
      { action: PERMISSIONS.DELETE_QUIZ, resource: 'quizzes', conditions: { courseOwner: true } },
      
      // Content management (own courses)
      { action: PERMISSIONS.CREATE_CONTENT, resource: 'content', conditions: { courseOwner: true } },
      { action: PERMISSIONS.READ_CONTENT, resource: 'content', conditions: { courseOwner: true } },
      { action: PERMISSIONS.UPDATE_CONTENT, resource: 'content', conditions: { courseOwner: true } },
      { action: PERMISSIONS.DELETE_CONTENT, resource: 'content', conditions: { courseOwner: true } },
      
      // Limited analytics (own courses)
      { action: PERMISSIONS.VIEW_ANALYTICS, resource: 'analytics', conditions: { ownCourses: true } },
    ],
    canCreateRoles: ['student'],
    canManageRoles: ['student'],
    canDeleteRoles: [],
    canSuspendRoles: ['student'],
  },
  
  student: {
    role: 'student',
    permissions: [
      // Read access to published content
      { action: PERMISSIONS.READ_COURSE, resource: 'courses', conditions: { published: true } },
      { action: PERMISSIONS.READ_CONTENT, resource: 'content', conditions: { enrolled: true } },
      { action: PERMISSIONS.READ_QUIZ, resource: 'quizzes', conditions: { enrolled: true } },
    ],
    canCreateRoles: [],
    canManageRoles: [],
    canDeleteRoles: [],
    canSuspendRoles: [],
  },
};

/**
 * Check if a user has permission to perform an action
 */
export function hasPermission(
  userRole: UserRole,
  action: string,
  resource: string,
  context?: Record<string, any>
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  const permission = rolePermissions.permissions.find(
    p => p.action === action && p.resource === resource
  );

  if (!permission) return false;

  // Check conditions if they exist
  if (permission.conditions && context) {
    for (const [key, value] of Object.entries(permission.conditions)) {
      if (context[key] !== value) return false;
    }
  }

  return true;
}

/**
 * Check if a user can create users with a specific role
 */
export function canCreateRole(userRole: UserRole, targetRole: UserRole): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.canCreateRoles.includes(targetRole) || false;
}

/**
 * Check if a user can manage users with a specific role
 */
export function canManageRole(userRole: UserRole, targetRole: UserRole): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.canManageRoles.includes(targetRole) || false;
}

/**
 * Check if a user can delete users with a specific role
 */
export function canDeleteRole(userRole: UserRole, targetRole: UserRole): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.canDeleteRoles.includes(targetRole) || false;
}

/**
 * Check if a user can suspend users with a specific role
 */
export function canSuspendRole(userRole: UserRole, targetRole: UserRole): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.canSuspendRoles.includes(targetRole) || false;
}

/**
 * Get available roles that a user can create
 */
export function getCreatableRoles(userRole: UserRole): UserRole[] {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.canCreateRoles || [];
}

/**
 * Get available roles that a user can manage
 */
export function getManageableRoles(userRole: UserRole): UserRole[] {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.canManageRoles || [];
}

/**
 * Validate role hierarchy (prevent privilege escalation)
 */
export function validateRoleAssignment(
  creatorRole: UserRole,
  targetRole: UserRole
): { valid: boolean; message?: string } {
  // Admins have ABSOLUTE power - they can assign ANY role including other admins
  if (creatorRole === 'admin') {
    return { valid: true };
  }

  // Formateurs can only assign student role
  if (creatorRole === 'formateur' && targetRole === 'student') {
    return { valid: true };
  }

  // Students cannot assign any roles
  if (creatorRole === 'student') {
    return { 
      valid: false, 
      message: 'Students cannot assign roles to other users.' 
    };
  }

  // Formateurs cannot assign admin or formateur roles
  if (creatorRole === 'formateur' && (targetRole === 'admin' || targetRole === 'formateur')) {
    return { 
      valid: false, 
      message: 'Instructors can only create student accounts.' 
    };
  }

  return { 
    valid: false, 
    message: 'Invalid role assignment.' 
  };
}

/**
 * Get role display information
 */
export const ROLE_INFO = {
  admin: {
    label: 'Administrator',
    description: 'Full system access and management capabilities',
    color: 'destructive',
    icon: 'Shield',
  },
  formateur: {
    label: 'Instructor',
    description: 'Can create courses, manage students, and create content',
    color: 'default',
    icon: 'GraduationCap',
  },
  student: {
    label: 'Student',
    description: 'Can enroll in courses and access learning materials',
    color: 'secondary',
    icon: 'User',
  },
} as const;
