/**
 * 시설 유형별 법정 소독 주기
 * 출처: 감염병예방법 시행규칙 [별표 7]
 * 원본: reference/mandatory_disinfection_schedule.csv
 */

export type FacilityTypeId =
  | 'hotel'
  | 'restaurant'
  | 'transport'
  | 'retail'
  | 'hospital'
  | 'cafeteria'
  | 'dormitory'
  | 'theater'
  | 'school'
  | 'academy'
  | 'office'
  | 'childcare'
  | 'apartment'
  | 'etc';

export interface FacilityType {
  id: FacilityTypeId;
  /** 법정 코드 번호 (별표 7 기준). null이면 법정 분류 없음 */
  code: string | null;
  label: string;
  /** 하절기 주기 (월), 4~9월. null이면 법정 주기 없음 */
  cycleSummer: number | null;
  /** 동절기 주기 (월), 10~3월. null이면 법정 주기 없음 */
  cycleWinter: number | null;
}

export const FACILITY_TYPES: readonly FacilityType[] = [
  { id: 'hotel',     code: '1',   label: '숙박업소 (객실 20실 이상)',              cycleSummer: 1, cycleWinter: 2 },
  { id: 'restaurant',code: '2',   label: '식품접객업소 (연면적 300㎡ 이상)',        cycleSummer: 1, cycleWinter: 2 },
  { id: 'transport', code: '3',   label: '여객운송차량 및 대합실',                  cycleSummer: 1, cycleWinter: 2 },
  { id: 'retail',    code: '4',   label: '대형마트/백화점/쇼핑센터',                cycleSummer: 1, cycleWinter: 2 },
  { id: 'hospital',  code: '5',   label: '종합병원/병원/치과/한방병원',             cycleSummer: 1, cycleWinter: 2 },
  { id: 'cafeteria', code: '6',   label: '집단급식소 (100인 이상)',                 cycleSummer: 2, cycleWinter: 3 },
  { id: 'dormitory', code: '7',   label: '기숙사/합숙소 (50인 이상)',               cycleSummer: 2, cycleWinter: 3 },
  { id: 'theater',   code: '8',   label: '공연장 (300석 이상)',                     cycleSummer: 2, cycleWinter: 3 },
  { id: 'school',    code: '8-2', label: '학교 (초/중/고/대)',                      cycleSummer: 2, cycleWinter: 3 },
  { id: 'academy',   code: '9',   label: '학원 (연면적 1,000㎡ 이상)',              cycleSummer: 2, cycleWinter: 3 },
  { id: 'office',    code: '10',  label: '사무실용 건축물 (연면적 2,000㎡ 이상)',    cycleSummer: 2, cycleWinter: 3 },
  { id: 'childcare', code: '11',  label: '어린이집/유치원 (50인 이상)',              cycleSummer: 2, cycleWinter: 3 },
  { id: 'apartment', code: '12',  label: '공동주택 (300세대 이상)',                  cycleSummer: 3, cycleWinter: 6 },
  { id: 'etc',       code: null,  label: '기타',                                    cycleSummer: null, cycleWinter: null },
] as const;

export const FACILITY_TYPE_IDS = FACILITY_TYPES.map((ft) => ft.id);

export const FACILITY_TYPE_MAP = new Map(
  FACILITY_TYPES.map((ft) => [ft.id, ft]),
);

export function getFacilityType(id: FacilityTypeId): FacilityType {
  const ft = FACILITY_TYPE_MAP.get(id);
  if (!ft) throw new Error(`Unknown facility type: ${id}`);
  return ft;
}
