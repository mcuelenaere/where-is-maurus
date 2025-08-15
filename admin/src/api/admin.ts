import { apiFetch } from './client';
import { z } from 'zod';
import {
    AdminCreateShareRequestSchema,
    AdminCreateShareResponseSchema,
    AdminCarStateSchema,
    AdminCarsResponseSchema,
    type AdminCarState,
    type AdminCreateShareRequest,
    type AdminCreateShareResponse
} from './types';

export async function getCarState(carId: number): Promise<AdminCarState> {
    const res = await apiFetch(`/api/v1/admin/cars/${carId}/state`);
    const json = await res.json();
    const parsed = AdminCarStateSchema.safeParse(json);
    if (!parsed.success) {
        throw new Error(`Invalid car state schema: ${parsed.error.message}`);
    }
    return parsed.data;
}

export async function createShare(req: AdminCreateShareRequest): Promise<AdminCreateShareResponse> {
    const bodyParse = AdminCreateShareRequestSchema.safeParse(req);
    if (!bodyParse.success) {
        throw new Error(`Invalid request: ${bodyParse.error.message}`);
    }
    const res = await apiFetch(`/api/v1/shares`, {
        method: 'POST',
        body: JSON.stringify(req)
    });
    const data = await res.json();
    const parsed = AdminCreateShareResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error(`Invalid response: ${parsed.error.message}`);
    }
    return parsed.data;
}

export async function getCars(): Promise<number[]> {
    const res = await apiFetch(`/api/v1/admin/cars`);
    const json = await res.json();
    const parsed = AdminCarsResponseSchema.safeParse(json);
    if (!parsed.success) {
        throw new Error(`Invalid cars response: ${parsed.error.message}`);
    }
    return parsed.data.cars;
}


