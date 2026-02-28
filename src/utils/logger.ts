export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isEnabled = (): boolean => {
  try {
    return localStorage.getItem('excel-processor-debug') === 'true';
  } catch {
    return false;
  }
};

export const log = (level: LogLevel, prefix: string, ...args: unknown[]) => {
  if (!isEnabled() && level === 'debug') return;
  const ts = new Date().toISOString();
  const message = [`[${ts}]`, prefix, ...args];
  switch (level) {
    case 'debug':
      console.debug(...message);
      break;
    case 'info':
      console.info(...message);
      break;
    case 'warn':
      console.warn(...message);
      break;
    case 'error':
      console.error(...message);
      break;
  }
};

export const debug = (prefix: string, ...args: unknown[]) => log('debug', prefix, ...args);
export const warn = (prefix: string, ...args: unknown[]) => log('warn', prefix, ...args);
export const error = (prefix: string, ...args: unknown[]) => log('error', prefix, ...args);

