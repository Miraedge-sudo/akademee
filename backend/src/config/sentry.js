let Sentry;
try { Sentry = require('@sentry/node'); } catch { Sentry = null; }

function initSentry(app) {
  if (!Sentry) return;
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: `akademee-backend@${process.env.npm_package_version || '1.0.0'}`,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    normalizeDepth: 8,
    enabled: process.env.NODE_ENV !== 'test',
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  return Sentry;
}

module.exports = { initSentry };
