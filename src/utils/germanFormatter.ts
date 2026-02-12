const GERMAN_MONTH_NAMES = [
  'Jan.',
  'Feb.',
  'Mär.',
  'Apr.',
  'Mai.',
  'Jun.',
  'Jul.',
  'Aug.',
  'Sep.',
  'Okt.',
  'Nov.',
  'Dez.',
];

const GERMAN_MONTH_NAMES_FULL = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const SMALL_NUMBER_WORDS = [
  'null',
  'eins',
  'zwei',
  'drei',
  'vier',
  'fünf',
  'sechs',
  'sieben',
  'acht',
  'neun',
  'zehn',
  'elf',
  'zwölf',
  'dreizehn',
  'vierzehn',
  'fünfzehn',
  'sechzehn',
  'siebzehn',
  'achtzehn',
  'neunzehn',
];

const TENS_WORDS = [
  '',
  '',
  'zwanzig',
  'dreißig',
  'vierzig',
  'fünfzig',
  'sechzig',
  'siebzig',
  'achtzig',
  'neunzig',
];

/**
 * Get German month name (abbreviated)
 */
export function getGermanMonthName(monthIndex: number): string {
  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid month index: ${monthIndex}`);
  }
  return GERMAN_MONTH_NAMES[monthIndex];
}

/**
 * Get full German month name
 */
export function getGermanMonthNameFull(monthIndex: number): string {
  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid month index: ${monthIndex}`);
  }
  return GERMAN_MONTH_NAMES_FULL[monthIndex];
}

/**
 * Format date in German format (DD.MM.YYYY)
 */
export function formatDateGerman(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format today's date in German format
 */
export function formatTodayDateGerman(): string {
  return formatDateGerman(new Date());
}

/**
 * Format a number as German currency (e.g., 1234.56 -> "1.234,56 €")
 */
export function formatCurrencyGerman(value: number): string {
  return value.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number as German percentage (e.g., 45.67 -> "45,67%")
 * Note: Expects value as percentage (e.g., 45.67), not decimal (e.g., 0.4567)
 */
export function formatPercentGerman(value: number): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + '%';
}

/**
 * Format a number with German locale (e.g., 1234.56 -> "1.234,56")
 */
export function formatNumberGerman(value: number, decimals: number = 2): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Convert a number to German words (for amounts)
 * e.g., 1234 -> "eintausend zweihundert vierunddreißig"
 */
export function formatAmountInGermanWords(amount: number): string {
  if (amount === 0) return 'null';

  const euros = Math.floor(amount);
  const cents = Math.round((amount - euros) * 100);

  let result = numberToGermanWords(euros);

  if (cents > 0) {
    result += ` Euro und ${numberToGermanWords(cents)} Cent`;
  } else {
    result += ' Euro';
  }

  return result;
}

/**
 * Convert a number to German words
 */
function numberToGermanWords(n: number): string {
  if (n === 0) return SMALL_NUMBER_WORDS[0];
  if (n < 0) return 'minus ' + numberToGermanWords(-n);
  if (n < 20) return SMALL_NUMBER_WORDS[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    if (ones === 0) {
      return TENS_WORDS[tens];
    } else if (ones === 1) {
      return 'ein' + 'und' + TENS_WORDS[tens];
    } else {
      return SMALL_NUMBER_WORDS[ones] + 'und' + TENS_WORDS[tens];
    }
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    if (hundreds === 1) {
      return remainder > 0
        ? 'einhundert' + ' ' + numberToGermanWords(remainder)
        : 'einhundert';
    } else {
      return SMALL_NUMBER_WORDS[hundreds] + 'hundert' +
        (remainder > 0 ? ' ' + numberToGermanWords(remainder) : '');
    }
  }
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    const thousandsWord = thousands === 1 ? 'eintausend' : numberToGermanWords(thousands) + 'tausend';
    return remainder > 0
      ? thousandsWord + ' ' + numberToGermanWords(remainder)
      : thousandsWord;
  }
  if (n < 1000000000) {
    const millions = Math.floor(n / 1000000);
    const remainder = n % 1000000;
    const millionsWord = millions === 1 ? 'eine Million' : numberToGermanWords(millions) + ' Millionen';
    return remainder > 0
      ? millionsWord + ' ' + numberToGermanWords(remainder)
      : millionsWord;
  }

  return String(n); // Fallback for very large numbers
}
