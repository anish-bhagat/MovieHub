import { z } from 'zod';
export declare const createShowtimeSchema: z.ZodObject<{
    cinemaId: z.ZodNumber;
    movieId: z.ZodNumber;
    date: z.ZodString;
    time: z.ZodString;
    category: z.ZodDefault<z.ZodString>;
    screen: z.ZodDefault<z.ZodString>;
    startingPrice: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cinemaId: number;
    movieId: number;
    date: string;
    time: string;
    category: string;
    screen: string;
    startingPrice: number;
}, {
    cinemaId: number;
    movieId: number;
    date: string;
    time: string;
    category?: string | undefined;
    screen?: string | undefined;
    startingPrice?: number | undefined;
}>;
export declare const updateShowtimeSchema: z.ZodObject<{
    cinemaId: z.ZodOptional<z.ZodNumber>;
    movieId: z.ZodOptional<z.ZodNumber>;
    date: z.ZodOptional<z.ZodString>;
    time: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    screen: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    startingPrice: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    cinemaId?: number | undefined;
    movieId?: number | undefined;
    date?: string | undefined;
    time?: string | undefined;
    category?: string | undefined;
    screen?: string | undefined;
    startingPrice?: number | undefined;
}, {
    cinemaId?: number | undefined;
    movieId?: number | undefined;
    date?: string | undefined;
    time?: string | undefined;
    category?: string | undefined;
    screen?: string | undefined;
    startingPrice?: number | undefined;
}>;
export declare const cancelShowtimeSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
