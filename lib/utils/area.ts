const SQM_TO_PYEONG = 0.3025;
const PYEONG_TO_SQM = 3.3058;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function sqmToPyeong(sqm: number): number {
  return round2(sqm * SQM_TO_PYEONG);
}

export function pyeongToSqm(pyeong: number): number {
  return round2(pyeong * PYEONG_TO_SQM);
}

/**
 * 면적 입력 시 양방향 자동 변환.
 * field가 "area"이면 ㎡→평, "areaPyeong"이면 평→㎡ 변환.
 */
export function convertArea(
  field: "area" | "areaPyeong",
  value: string
): { area: string; areaPyeong: string } {
  const num = Number(value);
  const valid = value !== "" && !isNaN(num);

  if (field === "area") {
    return {
      area: value,
      areaPyeong: valid ? String(sqmToPyeong(num)) : "",
    };
  }
  return {
    areaPyeong: value,
    area: valid ? String(pyeongToSqm(num)) : "",
  };
}
