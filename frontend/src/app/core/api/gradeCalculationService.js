/**
 * Grade Calculation Service — API calls for student averages and class rankings.
 */
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Get grade averages for a student
 * @param {string} studentId
 * @param {object} params - { periodId?, academicYearId? }
 */
export async function getStudentAverages(studentId, params = {}) {
  const response = await api.get(
    API_ENDPOINTS.GRADE_CALCULATIONS.AVERAGES(studentId),
    { params }
  );
  return response.data.data;
}

/**
 * Get class rankings
 * @param {string} classId
 * @param {object} params - { periodId? }
 */
export async function getClassRankings(classId, params = {}) {
  const response = await api.get(
    API_ENDPOINTS.GRADE_CALCULATIONS.RANKINGS(classId),
    { params }
  );
  return response.data.data;
}
