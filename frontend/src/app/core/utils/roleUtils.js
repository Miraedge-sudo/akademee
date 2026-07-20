/**
 * Role resolution utility — ensures consistent role prioritisation
 * across all layout components (Sidebar, MobileBottomNav, Navbar).
 *
 * The priority order is: ADMIN > STUDENT > TEACHER > ACCOUNTANT > PARENT > SECRETARY
 * This must match the priority in App.jsx for consistent behaviour.
 */

const ROLE_PRIORITY = ['ADMIN', 'STUDENT', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'SECRETARY'];
const DEFAULT_ROLE = 'ADMIN';

/**
 * Resolve the highest-priority role from a user's roles array.
 *
 * @param {string|string[]} roles - A single role string or array of role codes.
 * @returns {string} The resolved primary role code, defaulting to 'ADMIN'.
 *
 * @example
 *   getPrimaryRole(['TEACHER', 'STUDENT'])   // → 'STUDENT' (student has higher priority)
 *   getPrimaryRole(['TEACHER'])               // → 'TEACHER'
 *   getPrimaryRole('STUDENT')                 // → 'STUDENT'
 *   getPrimaryRole(undefined)                 // → 'ADMIN'
 */
export function getPrimaryRole(roles) {
  if (!roles) return DEFAULT_ROLE;

  const rolesArray = Array.isArray(roles) ? roles : [roles];

  for (const priority of ROLE_PRIORITY) {
    if (rolesArray.includes(priority)) return priority;
  }

  // Fallback to the first role in the array if none match the priority list
  return rolesArray[0] || DEFAULT_ROLE;
}
