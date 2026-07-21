import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Get all payments for the school
 */
export async function getPayments(params = {}) {
  const response = await api.get(API_ENDPOINTS.PAYMENTS.LIST, { params });
  return response.data.data;
}

/**
 * Get payments for a specific student
 */
export async function getStudentPayments(studentId, params = {}) {
  const response = await api.get(API_ENDPOINTS.PAYMENTS.STUDENT(studentId), { params });
  return response.data.data;
}

/**
 * Get today's payments count and total
 */
export async function getTodayPayments() {
  const today = new Date().toISOString().split("T")[0];
  const response = await api.get(API_ENDPOINTS.PAYMENTS.LIST, {
    params: { startDate: today, limit: 1000 },
  });
  return response.data.data;
}

/**
 * Create a new payment (record a payment for a student)
 * @param {object} data - { studentId, amount, method, feeId, academicYearId?, reference? }
 */
export async function createPayment(data) {
  const response = await api.post(API_ENDPOINTS.PAYMENTS.CREATE, data);
  return response.data.data;
}

/**
 * Get a single payment by ID
 */
export async function getPaymentById(id) {
  const response = await api.get(API_ENDPOINTS.PAYMENTS.GET(id));
  return response.data.data;
}

/**
 * Generate a payment report
 */
export async function generatePaymentReport(params = {}) {
  const response = await api.get(API_ENDPOINTS.PAYMENTS.REPORT, { params });
  return response.data.data;
}
