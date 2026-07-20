import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Récupère la liste des classes
 * @param {object} params - Paramètres optionnels (limit, offset)
 */
export async function getClasses(params = {}) {
  const response = await api.get(API_ENDPOINTS.ACADEMIC.CLASSES, { params });
  return response.data.data;
}

/**
 * Récupère une classe par son ID
 * @param {string} id
 */
export async function getClassById(id) {
  const response = await api.get(API_ENDPOINTS.ACADEMIC.CLASS(id));
  return response.data.data;
}

/**
 * Crée une nouvelle classe
 * @param {object} classData - { name, classTeacherId?, academicYearId?, capacity? }
 */
export async function createClass(classData) {
  const response = await api.post(API_ENDPOINTS.ACADEMIC.CLASSES, classData);
  return response.data.data;
}

/**
 * Met à jour une classe
 * @param {string} id
 * @param {object} classData
 */
export async function updateClass(id, classData) {
  const response = await api.put(API_ENDPOINTS.ACADEMIC.CLASS(id), classData);
  return response.data.data;
}

/**
 * Supprime une classe
 * @param {string} id
 */
export async function deleteClass(id) {
  const response = await api.delete(API_ENDPOINTS.ACADEMIC.CLASS(id));
  return response.data.data;
}

/**
 * Inscrit un étudiant dans une classe
 * @param {string} classId
 * @param {object} enrollmentData - { studentId, academicYearId }
 */
export async function enrollStudent(classId, enrollmentData) {
  const response = await api.post(
    API_ENDPOINTS.ACADEMIC.CLASS_STUDENTS(classId),
    enrollmentData
  );
  return response.data.data;
}

/**
 * Retire un étudiant d'une classe
 * @param {string} classId
 * @param {string} studentId
 */
export async function removeStudentFromClass(classId, studentId) {
  const response = await api.delete(
    API_ENDPOINTS.ACADEMIC.CLASS_STUDENT(classId, studentId)
  );
  return response.data.data;
}

/**
 * Récupère les matières assignées à une classe
 * @param {string} classId
 */
export async function getClassSubjects(classId) {
  const response = await api.get(
    API_ENDPOINTS.ACADEMIC.CLASS_SUBJECTS_BY_CLASS(classId)
  );
  return response.data.data;
}

import { getAcademicYears as getYearsFromService } from './academicYearService';

/**
 * Récupère toutes les classes assignées à un professeur
 * (combine class_teacher + subject_teacher côté backend)
 * @param {string} teacherId
 */
export async function getTeacherClasses(teacherId) {
  const response = await api.get(API_ENDPOINTS.TEACHER_CLASSES.LIST(teacherId));
  return response.data.data;
}


/**
 * Récupère la liste des années académiques
 * @deprecated Use academicYearService.getAcademicYears() instead
 */
export const getAcademicYears = getYearsFromService;
