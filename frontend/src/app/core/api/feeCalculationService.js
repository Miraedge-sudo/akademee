/**
 * Fee Calculation Service — API calls for student fee status.
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
