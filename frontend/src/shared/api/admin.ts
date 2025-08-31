import { apiFetch } from "./client";
import {
  AdminCarsResponseSchema,
  type AdminCreateShareRequest,
  AdminCreateShareRequestSchema,
  type AdminCreateShareResponse,
  AdminCreateShareResponseSchema,
} from "./types";

export async function createShare(req: AdminCreateShareRequest): Promise<AdminCreateShareResponse> {
  const bodyParse = AdminCreateShareRequestSchema.safeParse(req);
  if (!bodyParse.success) {
    throw new Error(`Invalid request: ${bodyParse.error.message}`);
  }
  const res = await apiFetch(`/api/v1/shares`, {
    method: "POST",
    body: JSON.stringify(req),
  });
  const data = await res.json();
  const parsed = AdminCreateShareResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid response: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function getCars(): Promise<{ id: number; display_name: string }[]> {
  const res = await apiFetch(`/api/v1/admin/cars`);
  const json = await res.json();
  const parsed = AdminCarsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Invalid cars response: ${parsed.error.message}`);
  }
  return parsed.data.cars;
}
