import { z } from "zod";

export function formatKoreanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone;

  // 대표번호: 1588, 1577, 1566, 1544, 1599, 1600, 1670, 1800 등
  if (/^1[0-9]{7}$/.test(digits)) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  // 서울 02: 02-XXX-XXXX 또는 02-XXXX-XXXX
  if (digits.startsWith("02")) {
    if (digits.length === 9) return `02-${digits.slice(2, 5)}-${digits.slice(5)}`;
    if (digits.length === 10) return `02-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 휴대폰/지역번호 (3자리): 010-XXXX-XXXX, 031-XXX-XXXX 등
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;

  return phone;
}

/** 숫자(와 하이픈)만 허용, 포맷 자동 변환하는 optional phone 스키마 */
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || /^[\d\-]+$/.test(v),
    { message: "연락처는 숫자만 입력해주세요" },
  )
  .transform((v) => (v ? formatKoreanPhone(v) : v));

/** 필수 phone 스키마 */
export const requiredPhoneSchema = z
  .string()
  .min(1, "연락처를 입력해주세요")
  .refine(
    (v) => /^[\d\-]+$/.test(v),
    { message: "연락처는 숫자만 입력해주세요" },
  )
  .transform((v) => formatKoreanPhone(v));
