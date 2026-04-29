const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function shiftToKst(input: Date | string = new Date()): Date {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Date(d.getTime() + KST_OFFSET_MS);
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

// yyyy-MM-dd in KST. 시점(UTC ISO) 또는 인자 없이 "지금"을 받음.
export function kstDateString(input: Date | string = new Date()): string {
  return fmt(shiftToKst(input));
}

// 연/월/일/시/분을 KST 기준으로 분해
export function kstParts(input: Date | string = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const s = shiftToKst(input);
  return {
    year: s.getUTCFullYear(),
    month: s.getUTCMonth() + 1,
    day: s.getUTCDate(),
    hour: s.getUTCHours(),
    minute: s.getUTCMinutes(),
  };
}

export function todayKst(): string {
  return kstDateString();
}

export function tomorrowKst(): string {
  const d = shiftToKst();
  d.setUTCDate(d.getUTCDate() + 1);
  return fmt(d);
}

export function weekRangeKst(): { start: string; end: string; days: string[] } {
  const d = shiftToKst();
  const dow = d.getUTCDay();
  const offsetToMon = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + offsetToMon);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(d);
    cur.setUTCDate(d.getUTCDate() + i);
    days.push(fmt(cur));
  }
  return { start: days[0], end: days[6], days };
}

export function monthRangeKst(): { start: string; end: string } {
  const d = shiftToKst();
  const first = new Date(d);
  first.setUTCDate(1);

  const last = new Date(d);
  last.setUTCMonth(d.getUTCMonth() + 1, 0);

  return { start: fmt(first), end: fmt(last) };
}
