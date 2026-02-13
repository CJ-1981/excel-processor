export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isEnabled = (): boolean => {
  try {
    return localStorage.getItem('excel-processor-debug') === 'true';
  } catch {
    return false;
  }
};

export const log = (level: LogLevel, prefix: string, ...args: any[]) => {
  if (!isEnabled() && level === 'debug') return;
  const ts = new Date().toISOString();
  const message = [`[${ts}]`, prefix, ...args];
  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(...message);
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(...message);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(...message);
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(...message);
      break;
  }
};

export const debug = (prefix: string, ...args: any[]) => log('debug', prefix, ...args);
export const info = (prefix: string, ...args: any[]) => log('info', prefix, ...args);
export const warn = (prefix: string, ...args: any[]) => log('warn', prefix, ...args);
export const error = (prefix: string, ...args: any[]) => log('error', prefix, ...args);

export const time = (label: string) => {
  if (!isEnabled()) return;
  try {
    // eslint-disable-next-line no-console
    console.time(`[excel-processor] ${label}`);
  } catch {}
};

export const timeEnd = (label: string) => {
  if (!isEnabled()) return;
  try {
    // eslint-disable-next-line no-console
    console.timeEnd(`[excel-processor] ${label}`);
  } catch {}
};

