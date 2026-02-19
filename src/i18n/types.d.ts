import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      en: typeof import('./locales/en.json');
      ko: typeof import('./locales/ko.json');
    };
  }
}
