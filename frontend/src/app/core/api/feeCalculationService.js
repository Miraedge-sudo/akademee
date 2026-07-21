/**
 * Fee Calculation Service — API calls for student fee status and class fee assignments.
 */
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Get fee summary for a student
 * @param {string} studentId
 */
export async function getStudentFeeSummary(studentId) {
  const response = await api.get(
    API_ENDPOINTS.FEE_CALCULATIONS.STUDENT_SUMMARY(studentId)
  );
  return response.data.data;
}

/**
 * Get fee status/details for a student
 * @param {string} studentId
 */
export async function getStudentFeeStatus(studentId) {
  const response = await api.get(
    API_ENDPOINTS.FEE_CALCULATIONS.STUDENT_STATUS(studentId)
  );
  return response.data.data;
}

/**
 * Get fees already assigned to a class for a given academic year
 * @param {string} classId
 * @param {string} [academicYearId]
 */
export async function getClassAssignedFees(classId, academicYearId) {
  const response = await api.get(`/api/fee-calculations/class/${classId}/assigned-fees`, {
    params: { academicYearId },
  });
  return response.data.data || [];
}

/**
 * Get per-fee breakdown for a student (individual fee statuses)
 * @param {string} studentId
 */
export async function getStudentFeeBreakdown(studentId) {
  const response = await api.get(`/api/fee-calculations/student/${studentId}/fees`);
  return response.data.data || [];
}
