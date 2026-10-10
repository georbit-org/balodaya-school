// Nepalese currency, phone number, and receipt number formatters

export function formatNpr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'NPR 0';
  }

  // Format using Indian / South Asian numbering system (lakhs and crores)
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const rounded = Math.round(absAmount * 100) / 100;

  const parts = rounded.toFixed(rounded % 1 === 0 ? 0 : 2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  // South Asian grouping: last 3 digits, then groups of 2 digits
  if (integerPart.length > 3) {
    const last3 = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedRest = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = `${formattedRest},${last3}`;
  }

  return `${isNegative ? '-' : ''}NPR ${integerPart}${decimalPart}`;
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertLessThanThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += `${ONES[Math.floor(n / 100)]} Hundred `;
    n %= 100;
  }
  if (n >= 20) {
    str += `${TENS[Math.floor(n / 10)]} `;
    n %= 10;
  }
  if (n > 0) {
    str += `${ONES[n]} `;
  }
  return str.trim();
}

export function amountInWords(amount: number | null | undefined): string {
  if (!amount || isNaN(amount) || amount === 0) {
    return 'Zero Rupees Only';
  }

  let num = Math.floor(Math.abs(amount));
  let result = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) {
    result += `${convertLessThanThousand(crore)} Crore `;
  }
  if (lakh > 0) {
    result += `${convertLessThanThousand(lakh)} Lakh `;
  }
  if (thousand > 0) {
    result += `${convertLessThanThousand(thousand)} Thousand `;
  }
  if (num > 0) {
    result += `${convertLessThanThousand(num)} `;
  }

  const paise = Math.round((Math.abs(amount) - Math.floor(Math.abs(amount))) * 100);
  let paiseStr = '';
  if (paise > 0) {
    paiseStr = ` and ${convertLessThanThousand(paise)} Paisa`;
  }

  return `${result.trim()} Rupees${paiseStr} Only`;
}

export function formatPhoneNp(phone?: string | null): string {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return phone;
}
