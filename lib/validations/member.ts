import { z } from "zod";

export const createMemberSchema = z.object({
  email: z.email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").optional(),
  phone: z.string().optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
