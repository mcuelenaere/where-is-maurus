import { z } from 'zod';

export const HistoryPointSchema = z.object({
    ts_ms: z.number(),
    v: z.number().nullable()
});
export type HistoryPoint = z.infer<typeof HistoryPointSchema>;

export const PathPointSchema = z.object({
    ts_ms: z.number(),
    lat: z.number(),
    lon: z.number()
});
export type PathPoint = z.infer<typeof PathPointSchema>;

export const CarStateSchema = z.object({
    ts_ms: z.number(),
    location: z.object({
        lat: z.number(),
        lon: z.number(),
        speed_kph: z.number().optional(),
        heading: z.number().optional(),
        elevation_m: z.number().optional()
    }),
    battery: z.object({
        soc_pct: z.number().optional(),
        power_w: z.number().optional()
    }),
    climate: z.object({
        inside_c: z.number().optional(),
        outside_c: z.number().optional()
    }),
    tpms_bar: z.object({
        fl: z.number().optional(),
        fr: z.number().optional(),
        rl: z.number().optional(),
        rr: z.number().optional()
    }),
    route: z
        .object({
            dest: z.object({ lat: z.number(), lon: z.number() }).optional(),
            eta_min: z.number().optional(),
            dist_km: z.number().optional()
        })
        .optional(),
});

export type CarState = z.infer<typeof CarStateSchema>;

export const AdminCarStateSchema = z.object({
    history_30s: z
        .object({
            speed_kph: z.array(HistoryPointSchema).optional(),
            power_w: z.array(HistoryPointSchema).optional(),
            soc_pct: z.array(HistoryPointSchema).optional(),
            inside_c: z.array(HistoryPointSchema).optional(),
            outside_c: z.array(HistoryPointSchema).optional(),
            tpms_fl: z.array(HistoryPointSchema).optional(),
            tpms_fr: z.array(HistoryPointSchema).optional(),
            tpms_rl: z.array(HistoryPointSchema).optional(),
            tpms_rr: z.array(HistoryPointSchema).optional()
        })
        .partial(),
    path_30s: z.array(PathPointSchema).optional(),
    state: CarStateSchema
});
export type AdminCarState = z.infer<typeof AdminCarStateSchema>;

export const AdminCreateShareRequestSchema = z.object({
    car_id: z.number(),
    expires_at: z.string().optional(),
    arrive_radius_m: z.number().optional()
});
export type AdminCreateShareRequest = z.infer<typeof AdminCreateShareRequestSchema>;

export const AdminCreateShareResponseSchema = z.object({ token: z.string() });
export type AdminCreateShareResponse = z.infer<typeof AdminCreateShareResponseSchema>;


