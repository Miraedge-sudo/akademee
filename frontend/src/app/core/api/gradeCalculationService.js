/**
 * Grade Calculation Service — API calls for student averages, class rankings,
 * and per-sequence grade averages.
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

/**
 * Get per-sequence grade averages for a student.
 * Queries grades directly (no report cards needed).
 * @param {string} studentId
 * @returns {Promise<Array<{sequenceId, sequenceLabel, average, color}>>}
 */
export async function getStudentSequenceAverages(studentId) {
  const response = await api.get(
    API_ENDPOINTS.GRADE_CALCULATIONS.SEQUENCE_AVERAGES(studentId)
  );
  return response.data.data;
}
