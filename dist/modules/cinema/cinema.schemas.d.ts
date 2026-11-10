import { z } from 'zod';
export declare const createCinemaSchema: z.ZodObject<{
    name: z.ZodString;
    city: z.ZodString;
    address: z.ZodString;
    mapUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amenities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    lateNight: z.ZodDefault<z.ZodBoolean>;
    active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    city: string;
    address: string;
    amenities: string[];
    lateNight: boolean;
    active: boolean;
    mapUrl?: string | null | undefined;
}, {
    name: string;
    city: string;
    address: string;
    mapUrl?: string | null | undefined;
    amenities?: string[] | undefined;
    lateNight?: boolean | undefined;
    active?: boolean | undefined;
}>;
export declare const updateCinemaSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    mapUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    amenities: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    lateNight: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    mapUrl?: string | null | undefined;
    amenities?: string[] | undefined;
    lateNight?: boolean | undefined;
    active?: boolean | undefined;
}, {
    name?: string | undefined;
    city?: string | undefined;
    address?: string | undefined;
    mapUrl?: string | null | undefined;
    amenities?: string[] | undefined;
    lateNight?: boolean | undefined;
    active?: boolean | undefined;
}>;
