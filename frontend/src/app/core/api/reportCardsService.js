/**
 * Report Cards Service — API calls for the v1 Report Card Grading System.
 * All routes are prefixed with /api/v1/report-cards
 */
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * List report cards with optional filters.
 * @param {object} params - { studentId, classLevelId, periodStructureId, status }
 */
export async function listReportCards(params = {}) {
  const response = await api.get(API_ENDPOINTS.REPORT_CARDS_V1.LIST, { params });
  return response.data.data;
}

/**
 * Generate a draft report card for a student and period.
 * @param {object} data - { studentId, periodStructureId }
 */
export async function generateReportCard(data) {
  const response = await api.post(API_ENDPOINTS.REPORT_CARDS_V1.CREATE, data);
  return response.data.data;
}

/**
 * Generate draft report cards for an entire class.
 * @param {object} data - { classLevelId, periodStructureId }
 */
export async function generateBatchReportCards(data) {
  const response = await api.post(API_ENDPOINTS.REPORT_CARDS_V1.BATCH, data);
  return response.data.data;
}

/**
 * Get the full JSON payload for a report card.
 * @param {string} id - report_card_id
 * @param {string} lang - 'EN' | 'FR' | 'BILINGUAL'
 */
export async function getReportCardPayload(id, lang = "EN") {
  const response = await api.get(API_ENDPOINTS.REPORT_CARDS_V1.PAYLOAD(id), {
    params: { lang },
  });
  return response.data.data;
}

/**
 * Publish a report card (DRAFT/COMPLETE → PUBLISHED).
 * @param {string} id - report_card_id
 */
export async function publishReportCard(id) {
  const response = await api.post(API_ENDPOINTS.REPORT_CARDS_V1.PUBLISH(id));
  return response.data.data;
}

/**
 * Revise a report card (creates a new DRAFT version, locks the previous).
 * @param {string} id - report_card_id
 * @param {string} reason - reason for revision
 */
export async function reviseReportCard(id, reason) {
  const response = await api.post(API_ENDPOINTS.REPORT_CARDS_V1.REVISE(id), { reason });
  return response.data.data;
}

/**
 * Lock a report card (no further edits without revising).
 * @param {string} id - report_card_id
 */
export async function lockReportCard(id) {
  const response = await api.post(API_ENDPOINTS.REPORT_CARDS_V1.LOCK(id));
  return response.data.data;
}

/**
 * Unlock a report card (LOCKED → DRAFT).
 * @param {string} id - report_card_id
 */
export async function unlockReportCard(id) {
  const response = await api.post(API_ENDPOINTS.REPORT_CARDS_V1.UNLOCK(id));
  return response.data.data;
}

/**
 * Delete a report card and its lines.
 * @param {string} id - report_card_id
 */
export async function deleteReportCard(id) {
  const response = await api.delete(API_ENDPOINTS.REPORT_CARDS_V1.DELETE(id));
  return response.data.data;
}
