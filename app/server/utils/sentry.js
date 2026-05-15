/**
 * 📊 Error logging and monitoring with Sentry
 */

import * as Sentry from "@sentry/node";
import * as SentryTracing from "@sentry/tracing";

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry(app) {
  const SENTRY_DSN = process.env.SENTRY_DSN;

  if (!SENTRY_DSN && process.env.NODE_ENV === "production") {
    console.warn("⚠️ SENTRY_DSN not set - error logging disabled");
    return;
  }

  if (!SENTRY_DSN) {
    console.log("ℹ️ Sentry disabled (dev environment)");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
    integrations: [
      new SentryTracing.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
  });

  // Middleware to track performance
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  console.log("✅ Sentry initialized for error tracking");
}

/**
 * Sentry error handler middleware (must be after routes)
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

/**
 * Capture exception with context
 */
export function captureException(error, context = {}) {
  console.error("🔴 Error captured:", error.message);

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture message with level
 */
export function captureMessage(message, level = "info", context = {}) {
  console.log(`📝 Message: ${message}`);

  Sentry.captureMessage(message, level, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, category = "info", data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Create transaction for performance tracking
 */
export function startTransaction(name, op = "http.request") {
  return Sentry.startTransaction({
    name,
    op,
  });
}

export default {
  initSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  addBreadcrumb,
  startTransaction,
};
