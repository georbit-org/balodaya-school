// Bikram Sambat (B.S.) date conversion and formatting utility
import NepaliDate from 'nepali-date-converter';

export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashad',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const BS_MONTHS_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत',
];

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toNepaliDigits(input: string | number): string {
  return String(input)
    .split('')
    .map((char) => {
      const digit = parseInt(char, 10);
      return !isNaN(digit) ? NEPALI_DIGITS[digit] : char;
    })
    .join('');
}

export interface BsDateInfo {
  year: number;
  month: number; // 1 to 12
  day: number;
  monthNameEn: string;
  monthNameNe: string;
  formattedEn: string; // e.g. "2083-06-24"
  formattedNe: string; // e.g. "२०८३-०६-२४"
  displayEn: string;   // e.g. "24 Ashwin 2083"
  displayNe: string;   // e.g. "२४ असोज २०८३"
}

export function adToBs(dateInput?: Date | string | null): BsDateInfo {
  let jsDate: Date;
  if (!dateInput) {
    jsDate = new Date();
  } else if (typeof dateInput === 'string') {
    jsDate = new Date(dateInput);
  } else {
    jsDate = dateInput;
  }

  if (isNaN(jsDate.getTime())) {
    jsDate = new Date();
  }

  const nepaliDate = new NepaliDate(jsDate);
  const year = nepaliDate.getYear();
  const month = nepaliDate.getMonth() + 1; // 1-indexed
  const day = nepaliDate.getDate();

  const monthNameEn = BS_MONTHS_EN[month - 1] || '';
  const monthNameNe = BS_MONTHS_NE[month - 1] || '';

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  const formattedEn = `${year}-${mm}-${dd}`;
  const formattedNe = toNepaliDigits(formattedEn);

  const displayEn = `${day} ${monthNameEn} ${year}`;
  const displayNe = `${toNepaliDigits(day)} ${monthNameNe} ${toNepaliDigits(year)}`;

  return {
    year,
    month,
    day,
    monthNameEn,
    monthNameNe,
    formattedEn,
    formattedNe,
    displayEn,
    displayNe,
  };
}

export function bsToAd(year: number, month: number, day: number): Date {
  const nepaliDate = new NepaliDate(year, month - 1, day);
  return nepaliDate.toJsDate();
}

export function currentBsYear(): number {
  return adToBs(new Date()).year;
}

export function formatDualDate(dateInput?: Date | string | null): string {
  const bs = adToBs(dateInput);
  let jsDate: Date;
  if (!dateInput) jsDate = new Date();
  else if (typeof dateInput === 'string') jsDate = new Date(dateInput);
  else jsDate = dateInput;

  const adStr = isNaN(jsDate.getTime())
    ? ''
    : jsDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return `${bs.displayNe} (${adStr})`;
}
