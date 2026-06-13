import numerologyData from './numerology.json';

export type NumerologyNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33;

export interface NumerologyProfile {
  number: NumerologyNumber;
  title: string;
  tagline: string;
  keywords: string[];
  essence: string;
  career: string;
  love: string;
  yearAdvice: string;
}

export interface BirthDate {
  year: number;
  month: number;
  day: number;
}

export interface NumerologyResult {
  birthDate: BirthDate;
  lifePath: NumerologyNumber;
  personalYear: NumerologyNumber;
  year: number;
  lifePathProfile: NumerologyProfile;
  personalYearProfile: NumerologyProfile;
}

const PROFILES: readonly NumerologyProfile[] = numerologyData as NumerologyProfile[];

const PROFILE_MAP = new Map<NumerologyNumber, NumerologyProfile>(
  PROFILES.map((p) => [p.number, p]),
);

export function isMasterNumber(n: number): n is NumerologyNumber {
  return n === 11 || n === 22 || n === 33;
}

function sumDigits(n: number): number {
  return String(Math.abs(n))
    .split('')
    .reduce((sum, ch) => sum + Number(ch), 0);
}

export function reduceToNumerologyNumber(n: number): NumerologyNumber {
  if (isMasterNumber(n)) return n;
  let value = n;
  while (value > 9) {
    if (isMasterNumber(value)) return value;
    value = sumDigits(value);
  }
  if (value < 1 || value > 9) return 9;
  return value as NumerologyNumber;
}

function digitsSumFromParts(year: number, month: number, day: number): number {
  const raw = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  return raw.split('').reduce((sum, ch) => sum + Number(ch), 0);
}

export function calcLifePathNumber(birthDate: BirthDate): NumerologyNumber {
  return reduceToNumerologyNumber(digitsSumFromParts(birthDate.year, birthDate.month, birthDate.day));
}

export function calcPersonalYearNumber(birthDate: BirthDate, year: number = new Date().getFullYear()): NumerologyNumber {
  return reduceToNumerologyNumber(digitsSumFromParts(year, birthDate.month, birthDate.day));
}

export function getNumerologyProfile(number: NumerologyNumber): NumerologyProfile {
  const profile = PROFILE_MAP.get(number);
  if (!profile) {
    throw new Error(`Unknown numerology number: ${number}`);
  }
  return profile;
}

export function isValidBirthDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

export function buildNumerologyResult(birthDate: BirthDate, year: number = new Date().getFullYear()): NumerologyResult {
  const lifePath = calcLifePathNumber(birthDate);
  const personalYear = calcPersonalYearNumber(birthDate, year);
  return {
    birthDate,
    lifePath,
    personalYear,
    year,
    lifePathProfile: getNumerologyProfile(lifePath),
    personalYearProfile: getNumerologyProfile(personalYear),
  };
}

export function formatBirthDateJP(birthDate: BirthDate): string {
  return `${birthDate.year}年${birthDate.month}月${birthDate.day}日`;
}

export const BIRTHDATE_STORAGE_KEY = 'numerology-birthdate';
