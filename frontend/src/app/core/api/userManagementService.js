import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

function buildUserFormData(data) {
  const formData = new FormData();

  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((entry) => formData.append(key, entry));
      return;
    }
    formData.append(key, value);
  });

  return formData;
}

/**
 * Get all users (with optional role filter for teachers)
 * @param {object} params - { limit, offset, search, role }
 */
export async function getUsers(params = {}) {
  const response = await api.get(API_ENDPOINTS.USERS_MANAGE.LIST, { params });
  return response.data.data;
}

/**
 * Get a single user by ID
 * @param {string} id
 */
export async function getUserById(id) {
  const response = await api.get(API_ENDPOINTS.USERS_MANAGE.GET(id));
  return response.data.data;
}

/**
 * Create a new user (teacher, accountant, etc.)
 * @param {object} data - { firstName, lastName, email, password, phone?, roleCode?, avatar? }
 */
export async function createUser(data) {
  const payload = data?.avatar instanceof File ? buildUserFormData(data) : data;
  const response = await api.post(API_ENDPOINTS.USERS_MANAGE.CREATE, payload, payload instanceof FormData ? {
    headers: { "Content-Type": "multipart/form-data" },
  } : undefined);
  return response.data.data;
}

/**
 * Update a user
 * @param {string} id
 * @param {object} data - { firstName?, lastName?, email?, phone?, isActive?, avatar? }
 */
export async function updateUser(id, data) {
  const payload = data?.avatar instanceof File ? buildUserFormData(data) : data;
  const response = await api.put(API_ENDPOINTS.USERS_MANAGE.UPDATE(id), payload, payload instanceof FormData ? {
    headers: { "Content-Type": "multipart/form-data" },
  } : undefined);
  return response.data.data;
}

/**
 * Deactivate a user (soft delete)
 * @param {string} id
 */
export async function deleteUser(id) {
  const response = await api.delete(API_ENDPOINTS.USERS_MANAGE.DELETE(id));
  return response.data.data;
}
