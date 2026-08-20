/**
 * Scheduler Service
 *
 * Periodically updates period/sequence statuses based on their dates:
 *   - End date passed  → FERMEE (auto-close)
 *   - Start date reached, end date not passed → OUVERTE (auto-open)
 *   - Locked (VERROUILLEE) items are never auto-changed.
 *
 * Also exposes a manual refreshStatuses() that can be called from an admin route.
 */

const cron = require('node-cron');
const sql = require('../config/database');
const logger = require('../utils/logger');
const trialChecker = require('./trialChecker.service');

/**
 * Refresh all period statuses in one bulk query.
 * Skips VERROUILLEE items — those require admin intervention.
 */
async function refreshPeriodStatuses() {
  const { count: updated } = await sql`
    UPDATE periods SET status = 'FERMEE', updated_at = now()
    WHERE end_date < CURRENT_DATE
      AND status NOT IN ('FERMEE', 'VERROUILLEE')
  `;

  const { count: opened } = await sql`
    UPDATE periods SET status = 'OUVERTE', updated_at = now()
    WHERE start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
      AND status = 'EN_ATTENTE'
  `;

  return { periodsClosed: updated, periodsOpened: opened };
}

/**
 * Refresh all sequence statuses in one bulk query.
 * Skips VERROUILLEE items.
 */
async function refreshSequenceStatuses() {
  const { count: updated } = await sql`
    UPDATE sequences SET status = 'FERMEE', updated_at = now()
    WHERE date_fin < CURRENT_DATE
      AND status NOT IN ('FERMEE', 'VERROUILLEE')
  `;

  const { count: opened } = await sql`
    UPDATE sequences SET status = 'OUVERTE', updated_at = now()
    WHERE date_debut <= CURRENT_DATE
      AND date_fin >= CURRENT_DATE
      AND status = 'EN_ATTENTE'
  `;

  return { sequencesClosed: updated, sequencesOpened: opened };
}

/**
 * Run the full status refresh for both periods and sequences.
 * Logs summary of changes made.
 */
async function refreshStatuses() {
  try {
    const periodResult = await refreshPeriodStatuses();
    const sequenceResult = await refreshSequenceStatuses();

    const total =
      (periodResult.periodsClosed || 0) +
      (periodResult.periodsOpened || 0) +
      (sequenceResult.sequencesClosed || 0) +
      (sequenceResult.sequencesOpened || 0);

    if (total > 0) {
      logger.info('Scheduler: statuses refreshed', {
        ...periodResult,
        ...sequenceResult,
      });
    }

    return {
      success: true,
      ...periodResult,
      ...sequenceResult,
      total,
    };
  } catch (error) {
    logger.error('Scheduler: error refreshing statuses', {
      message: error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Start the cron job that runs every night at 00:05 (5 minutes past midnight)
 * and also every hour during the day (8:00–20:00) to catch real-time transitions.
 *
 * The expression "5 0 * * *" runs once daily at 00:05.
 * The expression "0 8-20 * * *" runs every hour from 8am to 8pm.
 *
 * We combine: runs at minute 5 of every hour from 0-23 → "5 * * * *"
 * This is a practical check-every-hour approach.
 */
function startScheduler() {
  // ── Daily at 00:05 (once per night) ──
  cron.schedule('5 0 * * *', async () => {
    logger.info('Scheduler: daily status refresh started (00:05)');
    refreshStatuses();
    // Run trial expiry checker (sends 3-day warnings + expires overdue trials)
    trialChecker.runCheck().catch((err) => {
      logger.error('Scheduler: trialChecker error', { message: err.message });
    });
  });

  // ── Every hour from 8 AM to 8 PM ──
  cron.schedule('5 8-20 * * *', async () => {
    logger.info('Scheduler: hourly status refresh started');
    refreshStatuses();
  });

  logger.info('Scheduler: status refresh cron jobs registered (daily 00:05, hourly 8-20)');
}

module.exports = {
  startScheduler,
  refreshStatuses,
  refreshPeriodStatuses,
  refreshSequenceStatuses,
};
