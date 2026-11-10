import { z } from 'zod';
export declare const recordRefundSchema: z.ZodObject<{
    refundReference: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refundReference: string;
}, {
    refundReference: string;
}>;
export declare const issueReplacementSchema: z.ZodObject<{
    showtimeId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    showtimeId: number;
}, {
    showtimeId: number;
}>;
export declare const snackItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    qty: z.ZodNumber;
    price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    price: number;
    qty: number;
}, {
    id: string;
    name: string;
    price: number;
    qty: number;
}>;
export declare const createBookingSchema: z.ZodObject<{
    showtimeId: z.ZodNumber;
    customerName: z.ZodString;
    email: z.ZodString;
    seats: z.ZodArray<z.ZodString, "many">;
    snacks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        qty: z.ZodNumber;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        price: number;
        qty: number;
    }, {
        id: string;
        name: string;
        price: number;
        qty: number;
    }>, "many">>;
    total: z.ZodNumber;
    paymentMethod: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    seats: string[];
    total: number;
    snacks: {
        id: string;
        name: string;
        price: number;
        qty: number;
    }[];
    showtimeId: number;
    customerName: string;
    email: string;
    paymentMethod: string;
}, {
    seats: string[];
    total: number;
    showtimeId: number;
    customerName: string;
    email: string;
    snacks?: {
        id: string;
        name: string;
        price: number;
        qty: number;
    }[] | undefined;
    paymentMethod?: string | undefined;
}>;
