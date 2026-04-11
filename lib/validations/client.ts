import { z } from "zod";
import { FACILITY_TYPE_IDS } from "@/lib/constants/facility-types";

export const createClientSchema = z.object({
  name: z.string().min(1, "시설명을 입력해주세요"),
  facilityType: z.enum(FACILITY_TYPE_IDS as unknown as [string, ...string[]], {
    error: "시설 유형을 선택해주세요",
  }),
  area: z.number().nullable().optional(),
  areaPyeong: z.number().nullable().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema
  .partial()
  .extend({ name: z.string().min(1, "시설명을 입력해주세요") });

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
