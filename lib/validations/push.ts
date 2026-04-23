import { z } from "zod";

export const subscribeSchema = z.object({
  endpoint: z.string().url("잘못된 endpoint 입니다"),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(500).optional(),
});

export const unsubscribeSchema = z.object({
  endpoint: z.string().url("잘못된 endpoint 입니다"),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;
