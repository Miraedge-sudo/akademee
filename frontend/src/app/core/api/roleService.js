import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * List all available roles
 */
export async function getRoles() {
  const response = await api.get(API_ENDPOINTS.ROLES.LIST);
  return response.data.data;
}

/**
 * Get roles assigned to a specific user
 * @param {string} userId
 */
export async function getUserRoles(userId) {
  const response = await api.get(API_ENDPOINTS.ROLES.USER_ROLES(userId));
  return response.data.data;
}

/**
 * Assign a role to a user
 * @param {string} userId
 * @param {string} roleCode - e.g. 'teacher', 'admin', 'accountant'
 */
export async function assignRole(userId, roleCode) {
  const response = await api.post(API_ENDPOINTS.ROLES.ASSIGN(userId), { roleCode });
  return response.data.data;
}

/**
 * Remove a role from a user
 * @param {string} userId
 * @param {string} roleCode
 */
export async function removeRole(userId, roleCode) {
  const response = await api.delete(API_ENDPOINTS.ROLES.REMOVE(userId, roleCode));
  return response.data.data;
}
