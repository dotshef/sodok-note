import { z } from "zod";
import { phoneSchema } from "./phone";

export const signupSchema = z.object({
  // 업체 정보
  companyName: z.string().min(1, "업체명을 입력해주세요"),
  businessNumber: z.string().optional(),
  ownerName: z.string().optional(),
  phone: phoneSchema,
  address: z.string().optional(),
  // 관리자 계정
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력해주세요"),
});

export const loginSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const sendCodeSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
});

export const verifyCodeSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
  code: z.string().regex(/^\d{6}$/, "인증번호 6자리를 입력해주세요"),
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, "잘못된 요청입니다"),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요"),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["passwordConfirm"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SendCodeInput = z.infer<typeof sendCodeSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
