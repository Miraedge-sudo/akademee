/**
 * Grading Service — API calls for the v1 Grading System configuration endpoints.
 * All routes are prefixed with /api/v1
 */
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

// ── Education Systems ──

export async function listEducationSystems() {
  const response = await api.get(API_ENDPOINTS.GRADING_V1.EDUCATION_SYSTEMS);
  return response.data.data;
}

export async function getEducationSystem(id) {
  const response = await api.get(`${API_ENDPOINTS.GRADING_V1.EDUCATION_SYSTEMS}/${id}`);
  return response.data.data;
}

// ── Grading Scales ──

export async function createGradingScale(data) {
  const response = await api.post(API_ENDPOINTS.GRADING_V1.GRADING_SCALES, data);
  return response.data.data;
}

export async function listGradingScales() {
  const response = await api.get(API_ENDPOINTS.GRADING_V1.GRADING_SCALES);
  return response.data.data;
}

export async function createGradingScaleVersion(scaleId, data) {
  const response = await api.post(
    API_ENDPOINTS.GRADING_V1.GRADING_SCALE_VERSIONS(scaleId),
    data
  );
  return response.data.data;
}

export async function listGradingScaleVersions(scaleId) {
  const response = await api.get(
    API_ENDPOINTS.GRADING_V1.GRADING_SCALE_VERSIONS(scaleId)
  );
  return response.data.data;
}

// ── Mention Thresholds ──

export async function createMentionThresholdSet(data) {
  const response = await api.post(API_ENDPOINTS.GRADING_V1.MENTION_THRESHOLD_SETS, data);
  return response.data.data;
}

export async function createMentionThreshold(setId, data) {
  const response = await api.post(
    API_ENDPOINTS.GRADING_V1.MENTION_THRESHOLDS(setId),
    data
  );
  return response.data.data;
}

export async function listMentionThresholds(setId) {
  const response = await api.get(
    API_ENDPOINTS.GRADING_V1.MENTION_THRESHOLDS(setId)
  );
  return response.data.data;
}

// ── Subject Offerings ──

export async function createSubjectOffering(data) {
  const response = await api.post(API_ENDPOINTS.GRADING_V1.SUBJECT_OFFERINGS, data);
  return response.data.data;
}

export async function listSubjectOfferings(params = {}) {
  const response = await api.get(API_ENDPOINTS.GRADING_V1.SUBJECT_OFFERINGS, { params });
  return response.data.data;
}

// ── Assessment Components ──

export async function createAssessmentComponent(data) {
  const response = await api.post(API_ENDPOINTS.GRADING_V1.CREATE_ASSESSMENT_COMPONENT, data);
  return response.data.data;
}

export async function listAssessmentComponents(offeringId) {
  const response = await api.get(
    API_ENDPOINTS.GRADING_V1.ASSESSMENT_COMPONENTS(offeringId)
  );
  return response.data.data;
}
