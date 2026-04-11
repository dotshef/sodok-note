import { z } from "zod";

export const createVisitSchema = z.object({
  clientId: z.string().uuid("고객을 선택해주세요"),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "방문 예정일을 선택해주세요"),
  userId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000, "메모는 1000자 이하로 입력해주세요").optional(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
