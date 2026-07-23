// core/api/studentService.js
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Récupère la liste des étudiants
 * @param {object} params - Paramètres de filtrage (search, status, className, limit, offset)
 */
export async function getStudents(params = {}) {
  const response = await api.get(API_ENDPOINTS.STUDENTS.LIST, { params });
  return response.data.data;
}

/**
 * Récupère un étudiant par son ID
 * @param {string} id - ID de l'étudiant
 */
export async function getStudentById(id) {
  const response = await api.get(API_ENDPOINTS.STUDENTS.GET(id));
  return response.data.data;
}

/**
 * Récupère le profil de l'étudiant connecté
 */
export async function getStudentMe() {
  const response = await api.get(API_ENDPOINTS.STUDENTS.GET("me"));
  return response.data.data;
}

/**
 * Récupère un étudiant par son user_id
 * @param {string} userId - ID de l'utilisateur
 */
export async function getStudentByUserId(userId) {
  const response = await api.get(`/api/students/by-user/${userId}`);
  return response.data.data;
}

/**
 * Crée un nouvel étudiant
 * @param {object} studentData - Données de l'étudiant
 */
export async function createStudent(studentData) {
  const response = await api.post(API_ENDPOINTS.STUDENTS.CREATE, studentData);
  return response.data.data;
}

/**
 * Met à jour un étudiant
 * @param {string} id - ID de l'étudiant
 * @param {object} studentData - Données à mettre à jour
 */
export async function updateStudent(id, studentData) {
  const response = await api.put(API_ENDPOINTS.STUDENTS.UPDATE(id), studentData);
  return response.data.data;
}

/**
 * Supprime un étudiant
 * @param {string} id - ID de l'étudiant
 */
export async function deleteStudent(id) {
  const response = await api.delete(API_ENDPOINTS.STUDENTS.DELETE(id));
  return response.data.data;
}
