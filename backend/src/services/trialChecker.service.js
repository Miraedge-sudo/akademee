/**
 * Trial Checker Service
 * Runs periodically to:
 * 1. Send reminder notifications to admins when trial is at day 3 (3 days remaining)
 * 2. Expire trials that have passed their end date
 */

const sql = require('../config/database');
const notificationService = require('./notification.service');

class TrialCheckerService {
  /**
   * Main check — call this from a cron job or scheduler
   * Checks all schools on trial status
   */
  async runCheck() {
    console.log('[TrialChecker] Running trial check...');

    const trialSchools = await sql`
      SELECT school_id, name, subdomain, subscription_start_date, subscription_end_date
      FROM schools
      WHERE subscription_status = 'trial'
        AND subscription_end_date IS NOT NULL
    `;

    console.log(`[TrialChecker] Found ${trialSchools.length} schools on trial`);

    let expiredCount = 0;
    let reminderCount = 0;

    for (const school of trialSchools) {
      const endDate = new Date(school.subscription_end_date);
      const now = new Date();
      const diffMs = endDate.getTime() - now.getTime();
      const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (remainingDays <= 0) {
        // Trial expired — mark as expired
        await sql`
          UPDATE schools
          SET subscription_status = 'expired', updated_at = NOW()
          WHERE school_id = ${school.school_id}
        `;
        expiredCount++;
        console.log(`[TrialChecker] Expired trial for school: ${school.name} (${school.subdomain})`);
      } else if (remainingDays <= 3) {
        // 3 or fewer days remaining — send reminder if not already sent today
        const alreadySent = await sql`
          SELECT notification_id FROM notifications
          WHERE school_id = ${school.school_id}
            AND type = 'system'
            AND message LIKE '%trial%reminder%'
            AND created_at::date = CURRENT_DATE
        `;

        if (alreadySent.length === 0) {
          // Find admin users for this school
          const admins = await sql`
            SELECT DISTINCT u.user_id
            FROM users u
            INNER JOIN user_roles ur ON u.user_id = ur.user_id
            INNER JOIN roles r ON ur.role_id = r.role_id
            WHERE u.school_id = ${school.school_id}
              AND r.role_code = 'ADMIN'
              AND u.is_active = true
          `;

          const upgradeUrl = `${school.subdomain}.akademee.cm/dashboard/settings`;

          for (const admin of admins) {
            const message = `[trial-reminder] Your Akademee trial expires in ${remainingDays} day${remainingDays > 1 ? 's' : ''}. Upgrade now to keep full access: ${upgradeUrl}`;
            const messageEn = `[trial-reminder] Your Akademee trial expires in ${remainingDays} day${remainingDays > 1 ? 's' : ''}. Upgrade now to keep full access: ${upgradeUrl}`;

            await sql`
              INSERT INTO notifications (school_id, user_id, type, message, message_en)
              VALUES (${school.school_id}, ${admin.user_id}, 'system', ${message}, ${messageEn})
            `;
          }

          reminderCount++;
          console.log(`[TrialChecker] Sent day-${remainingDays} reminder to school: ${school.name} (${admins.length} admins)`);
        }
      }
    }

    console.log(`[TrialChecker] Done — expired: ${expiredCount}, reminders: ${reminderCount}`);
    return { expiredCount, reminderCount, totalChecked: trialSchools.length };
  }
}

module.exports = new TrialCheckerService();
