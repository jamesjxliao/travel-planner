export const createLogger = (environment) => {
  const isProduction = environment === 'production';

  return {
    debug: (...args) => {
      if (!isProduction) {
        console.log('[DEBUG]', ...args);
      }
    },
    info: (...args) => {
      console.log('[INFO]', ...args);
    },
    warn: (...args) => {
      console.warn('[WARN]', ...args);
    },
    error: (...args) => {
      console.error('[ERROR]', ...args);
    }
  };
};
