import { Solar } from 'lunar-javascript';

export type FourPillarDisplay = {
  label: '年柱' | '月柱' | '日柱' | '时柱';
  ganzhi: string;
  tiangan: string;
  dizhi: string;
};

const FOUR_PILLAR_LABELS: FourPillarDisplay['label'][] = ['年柱', '月柱', '日柱', '时柱'];
const TOKEN_BREAK_PATTERN = /[，。；：、,.!?/\\\s]/;

export function sanitizeDisplayText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

export function splitGanzhi(ganzhi: string): Pick<FourPillarDisplay, 'tiangan' | 'dizhi'> {
  const normalized = sanitizeDisplayText(ganzhi);
  return {
    tiangan: normalized.slice(0, 1) || normalized,
    dizhi: normalized.slice(1, 2) || '',
  };
}

export function buildFourPillarsFromExactBazi(exactBazi: string): FourPillarDisplay[] {
  const parts = sanitizeDisplayText(exactBazi).split(' ').filter(Boolean).slice(0, 4);
  return FOUR_PILLAR_LABELS.map((label, index) => {
    const ganzhi = parts[index] || '--';
    return {
      label,
      ganzhi,
      ...splitGanzhi(ganzhi),
    };
  });
}

export function buildFourPillarsFromBirthInfo(birthDate: string, birthTime: string): FourPillarDisplay[] {
  try {
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour, minute] = birthTime.split(':').map(Number);

    if (![year, month, day, hour, minute].every(Number.isFinite)) {
      return buildFourPillarsFromExactBazi('');
    }

    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    const exactBazi = `${lunar.getEightChar().getYear()} ${lunar.getEightChar().getMonth()} ${lunar.getEightChar().getDay()} ${lunar.getEightChar().getTime()}`;
    return buildFourPillarsFromExactBazi(exactBazi);
  } catch {
    return buildFourPillarsFromExactBazi('');
  }
}

export function isCompactDivinationToken(value: string, maxLength = 4): boolean {
  const normalized = sanitizeDisplayText(value);
  if (!normalized || normalized.length > maxLength) {
    return false;
  }

  return !TOKEN_BREAK_PATTERN.test(normalized);
}

export function shouldUseCompactDivinationLayout(values: string[], maxLength = 4): boolean {
  return Array.isArray(values) && values.length > 0 && values.every((value) => isCompactDivinationToken(value, maxLength));
}
