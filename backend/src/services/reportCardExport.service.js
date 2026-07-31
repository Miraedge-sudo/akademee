/**
 * Report Card Export Service
 *
 * In-memory tracker for background ZIP exports with real-time SSE progress.
 *
 * Why this exists:
 *  - Exporting a whole class/education system renders one PDF per student and
 *    can take a while. Instead of a long blocking HTTP request, the client:
 *      1. POST /report-card-exports   → starts the export, gets { exportId, total }
 *      2. GET  /report-card-exports/:id/progress → SSE stream (same shape as jobs)
 *      3. GET  /report-card-exports/:id/file     → downloads the finished ZIP
 *  - State lives in memory (per process). Fine for short-lived exports; the
 *    ZIP buffer is kept only until downloaded (or after a TTL sweep), then freed.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const reportCardPdfService = require('./reportCardPdf.service');

// exportId → { status, current, total, fileName, buffer, error, createdAt }
const exportsStore = new Map();

const TTL_MS = 30 * 60 * 1000; // drop stale records after 30 min

/** Remove export records that are older than the TTL (memory guard). */
function purgeStale() {
  const now = Date.now();
  for (const [id, record] of exportsStore) {
    if (now - record.createdAt > TTL_MS) exportsStore.delete(id);
  }
}

/**
 * Start a background ZIP export.
 *
 * @param {object} opts
 * @param {Array<object>} opts.payloads - already-resolved report card payloads
 * @param {string} [opts.lang] - 'EN' | 'FR' | 'BILINGUAL'
 * @returns {{ exportId: string, total: number }}
 */
function startExport({ payloads, lang = 'EN', fileName = 'bulletins.zip' }) {
  purgeStale();

  const exportId = crypto.randomUUID();
  const total = payloads.length;
  const record = {
    status: 'RUNNING',
    current: 0,
    total,
    fileName,
    buffer: null,
    error: null,
    createdAt: Date.now(),
  };
  exportsStore.set(exportId, record);

  // Fire-and-forget background generation. Progress updates the shared record;
  // the SSE endpoint below just reads it. Never reject — failures land in the
  // record so the client gets a clean 'complete' event with status FAILED.
  (async () => {
    try {
      const buffer = await reportCardPdfService.generateReportCardsZip(payloads, {
        lang,
        onProgress: ({ current }) => {
          record.current = current;
        },
      });
      record.buffer = buffer;
      record.current = total;
      record.status = 'COMPLETED';
      logger.info(`[ReportCardExport] Export ${exportId} completed (${total} bulletins)`);
    } catch (err) {
      record.status = 'FAILED';
      record.error = err.message;
      logger.error(`[ReportCardExport] Export ${exportId} failed:`, err.message);
    }
  })();

  return { exportId, total };
}

/**
 * Current progress of an export (for the SSE endpoint).
 * @returns {{status, current, total, error}|null}
 */
function getProgress(exportId) {
  const record = exportsStore.get(exportId);
  if (!record) return null;
  return {
    status: record.status,
    current: record.current,
    total: record.total,
    error: record.error,
  };
}

/**
 * Retrieve the finished ZIP buffer. Returns the buffer exactly once and frees
 * the record afterwards (memory guard).
 * - unknown id → 404
 * - not finished → 409 (client should keep polling the SSE stream)
 * - FAILED → 500 with the stored error message
 * @returns {{ ok: true, buffer: Buffer, fileName: string } | { ok: false, code: number, message?: string }}
 */
function getBuffer(exportId) {
  const record = exportsStore.get(exportId);
  if (!record) return { ok: false, code: 404 };
  if (record.status === 'FAILED') {
    exportsStore.delete(exportId); // free the record as soon as the error is surfaced
    return { ok: false, code: 500, message: record.error || 'Export failed' };
  }
  if (record.status !== 'COMPLETED' || !record.buffer) return { ok: false, code: 409 };
  exportsStore.delete(exportId); // one-shot download
  return { ok: true, buffer: record.buffer, fileName: record.fileName };
}

module.exports = {
  startExport,
  getProgress,
  getBuffer,
  // exposed for tests
  _store: exportsStore,
};
