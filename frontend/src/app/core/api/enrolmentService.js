// core/api/enrolmentService.js
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Submit a public enrolment inquiry from the website.
 * No auth token required — accessible to anyone.
 *
 * @param {object} data
 * @param {string} data.parentName
 * @param {string} data.parentEmail
 * @param {string} [data.parentPhone]
 * @param {string} data.studentName
 * @param {string} [data.studentAge]
 * @param {string} [data.grade]
 * @param {string} [data.message]
 */
export async function submitEnrolmentInquiry(data) {
  const response = await api.post(API_ENDPOINTS.WEBSITE.ENROL, data);
  return response.data;
}

/**
 * List enrolment inquiries (requires auth).
 */
export async function getEnrolmentInquiries(params = {}) {
  const response = await api.get(API_ENDPOINTS.WEBSITE.INQUIRIES, { params });
  return response.data;
}

/**
 * Update an inquiry status (requires auth).
 */
export async function updateInquiryStatus(id, status) {
  const response = await api.put(API_ENDPOINTS.WEBSITE.INQUIRY_STATUS(id), { status });
  return response.data;
}
