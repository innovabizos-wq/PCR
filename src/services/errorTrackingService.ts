import { trackEvent } from './telemetryService';

let initialized = false;

const normalizeReason = (reason: unknown): string => {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;

  try {
    return JSON.stringify(reason);
  } catch {
    return 'Unhandled rejection without serializable reason';
  }
};

export const initErrorTracking = (): void => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (event) => {
    void trackEvent('app.error', {
      metadata: {
        message: event.message || 'Unknown client error',
        file: event.filename || 'unknown',
        line: event.lineno || 0,
        column: event.colno || 0
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    void trackEvent('app.unhandled_rejection', {
      metadata: {
        reason: normalizeReason(event.reason)
      }
    });
  });
};
