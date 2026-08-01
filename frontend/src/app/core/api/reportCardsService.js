/**
 * Report Cards Service — API calls for the v1 Report Card Grading System.
 * All routes are prefixed with /api/v1/report-cards
 */
import api, { getAccessToken } from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import { getSubdomain } from "../utils/subdomainHelper";

/**
 * List report cards with optional filters.
 * @param {object} params - { studentId, classLevelId, periodStructureId, status }
 */
export async function listReportCards(params = {}) {
  const response = await api.get(API_ENDPOINTS.REPORT_CARDS_V1.LIST, { params });
  return response.data.data;
}

// ── Background Job API ──

/**
 * Enqueue a batch report card generation job (background).
 * Returns immediately with a job ID instead of blocking.
 * @param {object} data - { classLevelId, periodStructureId, sequenceId, educationSystemCode }
 * @returns {Promise<{jobId: string, totalStudents: number}>}
 */
export async function enqueueBatchJob(data) {
  const response = await api.post('/api/v1/report-card-jobs', data);
  return response.data.data;
}

/**
 * Get the status of a background job.
 * @param {string} jobId
 */
export async function getJobStatus(jobId) {
  const response = await api.get(`/api/v1/report-card-jobs/${jobId}`);
  return response.data.data;
}

/**
 * List all background jobs for the school.
 * @param {object} params - { status, limit, offset }
 */
export async function listJobs(params = {}) {
  const response = await api.get('/api/v1/report-card-jobs', { params });
  return response.data.data;
}

/**
 * Cancel a queued or active job.
 * @param {string} jobId
 */
export async function cancelJob(jobId) {
  const response = await api.post(`/api/v1/report-card-jobs/${jobId}/cancel`);
  return response.data.data;
}

/**
 * Subscribe to real-time progress via SSE.
 *
 * Uses fetch + ReadableStream (NOT EventSource) because EventSource does not
 * support custom Authorization headers in browsers — the endpoint requires auth.
 * Shared by the report-card generation jobs AND the ZIP export flow.
 *
 * @param {string} endpoint - absolute path, e.g. `/api/v1/report-card-exports/:id/progress`
 * @param {object} handlers
 * @param {function} handlers.onProgress - callback({ type:'progress', ... })
 * @param {function} handlers.onComplete - callback({ type:'complete', ... })
 * @param {function} handlers.onError - callback(error)
 * @param {number} [handlers.timeout] - optional timeout in ms (default 10 min)
 * @returns {function} unsubscribe function
 */
function subscribeToSSE(endpoint, { onProgress, onComplete, onError, timeout = 600000 } = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const subdomain = getSubdomain();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let closed = false;

  const headers = { 'Content-Type': 'application/json' };
  if (subdomain) headers['x-school-subdomain'] = subdomain;
  const accessToken = getAccessToken() || localStorage.getItem("token");
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timeoutId);
    controller.abort();
  };

  fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers,
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const read = () => {
        if (closed) return;
        reader.read().then(({ done, value }) => {
          if (done) {
            close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'progress' && onProgress) {
                  onProgress(data);
                } else if (data.type === 'complete' && onComplete) {
                  close();
                  onComplete(data);
                  return;
                } else if (data.type === 'error' && onError) {
                  close();
                  onError(new Error(data.message));
                  return;
                }
              } catch {
                // ignore malformed events
              }
            }
          }

          read();
        }).catch((err) => {
          if (!closed && onError) onError(err);
          close();
        });
      };

      read();
    })
    .catch((err) => {
      if (closed) return;
      if (err.name === 'AbortError') {
        if (onError) onError(new Error('Progress stream timed out'));
      } else if (onError) {
        onError(err);
      }
      close();
    });

  return close;
}

/**
 * Subscribe to real-time job progress via SSE.
 *
 * @param {string} jobId
 * @param {function} onProgress - callback({ current, total, status, failed })
 * @param {function} onComplete - callback({ results, errors })
 * @param {function} onError - callback(error)
 * @param {number} timeout - optional timeout in ms (default 10 min)
 * @returns {function} unsubscribe function
 */
export function subscribeToJobProgress(jobId, onProgress, onComplete, onError, timeout = 600000) {
  return subscribeToSSE(`/api/v1/report-card-jobs/${jobId}/progress`, {
    onProgress,
    onComplete,
    onError,
    timeout,
  });
}

/**
 * Generate a draft report card for a student and period.
 * @param {object} data - { studentId, periodStructureId }
 */
export async function generateReportCard(data) {
  const response = await api.post(API_ENDPOINTS.REPORT_CARDS_V1.CREATE, data, {
    timeout: 120000, // Report card generation can be slow — 2 min timeout
  });
  return response.data.data;
}

/**
 * Download a report card as a server-rendered PDF.
 *
 * The PDF is rendered deterministically on the server (Puppeteer + the
 * same bulletin template as the on-screen view) with real CSS pagination.
 *
 * @param {string} id - report_card_id
 * @param {string} [lang] - 'EN' | 'FR' | 'BILINGUAL'
 * @param {string} [suggestedName] - base filename without extension
 * @returns {Promise<{blob: Blob, filename: string}>}
 */
export async function downloadReportCardPdf(id, lang = "EN", suggestedName = "bulletin") {
  const response = await api.get(`/api/v1/report-cards/${id}/pdf`, {
    params: { lang },
    responseType: "blob",
    timeout: 120000,
  });

  const disposition = response.headers?.["content-disposition"] || "";
  let filename = `bulletin-${suggestedName}.pdf`;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match) filename = match[1];

  return { blob: response.data, filename };
}

/**
 * Start a BACKGROUND ZIP export of report cards. Returns immediately with
 * { exportId, total }; follow progress via subscribeToExportProgress and
 * download the finished archive via downloadExportFile.
 *
 * @param {object} data
 * @param {string[]} [data.ids] - report_card_id list
 * @param {string} [data.classLevelId] - export all cards of a class
 * @param {string} [data.educationSystemCode] - export all cards of a system
 * @param {string} [data.lang] - 'EN' | 'FR' | 'BILINGUAL'
 * @returns {Promise<{exportId: string, total: number, fileName: string}>}
 */
export async function startReportCardExport(data = {}) {
  const response = await api.post('/api/v1/report-card-exports', data);
  return response.data.data;
}

/**
 * Subscribe to real-time ZIP export progress via SSE (same shape as jobs).
 *
 * @param {string} exportId
 * @param {function} onProgress - callback({ current, total, status })
 * @param {function} onComplete - callback({ status, errors })
 * @param {function} onError - callback(error)
 * @param {number} timeout - optional timeout in ms (default 10 min)
 * @returns {function} unsubscribe function
 */
export function subscribeToExportProgress(exportId, onProgress, onComplete, onError, timeout = 600000) {
  return subscribeToSSE(`/api/v1/report-card-exports/${exportId}/progress`, {
    onProgress,
    onComplete,
    onError,
    timeout,
  });
}

/**
 * Download the finished ZIP archive for an export.
 *
 * @param {string} exportId
 * @param {string} [suggestedName] - fallback base filename without extension
 * @returns {Promise<{blob: Blob, filename: string}>}
 */
export async function downloadExportFile(exportId, suggestedName = "bulletins") {
  const response = await api.get(`/api/v1/report-card-exports/${exportId}/file`, {
    responseType: "blob",
    timeout: 120000,
  });

  const disposition = response.headers?.["content-disposition"] || "";
  let filename = `${suggestedName}.zip`;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match) filename = match[1];

  return { blob: response.data, filename };
}

/**
 * Trigger a browser download for a blob.
 * @param {Blob} blob
 * @param {string} filename
 */
export function saveBlobAs(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
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
