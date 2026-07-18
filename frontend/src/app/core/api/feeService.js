import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Get all fees for the school
 */
export async function getFees(params = {}) {
  const response = await api.get(API_ENDPOINTS.FINANCE.FEES, { params });
  return response.data.data;
}

/**
 * Get a single fee by ID
 */
export async function getFeeById(id) {
  const response = await api.get(API_ENDPOINTS.FINANCE.FEE(id));
  return response.data.data;
}

/**
 * Get student fee status
 */
export async function getStudentFeeStatus(studentId) {
  const response = await api.get(API_ENDPOINTS.FINANCE.STUDENT_FEE_STATUS(studentId));
  return response.data.data;
}

/**
 * Get finance reports
 */
export async function getFinanceReports(params = {}) {
  const response = await api.get(API_ENDPOINTS.FINANCE.REPORTS, { params });
  return response.data.data;
}

/**
 * Get fee calculation student summary
 */
export async function getStudentFeeSummary(studentId) {
  const response = await api.get(API_ENDPOINTS.FEE_CALCULATIONS.STUDENT_SUMMARY(studentId));
  return response.data.data;
}
