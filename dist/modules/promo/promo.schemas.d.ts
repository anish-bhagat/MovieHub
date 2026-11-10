import { z } from 'zod';
export declare const validatePromoSchema: z.ZodObject<{
    code: z.ZodString;
    subtotal: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    code: string;
    subtotal: number;
}, {
    code: string;
    subtotal: number;
}>;
export declare const createPromoSchema: z.ZodObject<{
    code: z.ZodString;
    discountType: z.ZodEnum<["percentage", "flat"]>;
    discountValue: z.ZodNumber;
    maxUses: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    active: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    code: string;
    discountType: "percentage" | "flat";
    discountValue: number;
    maxUses: number;
}, {
    code: string;
    discountType: "percentage" | "flat";
    discountValue: number;
    active?: boolean | undefined;
    maxUses?: number | undefined;
}>;
export declare const updatePromoSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    discountType: z.ZodOptional<z.ZodEnum<["percentage", "flat"]>>;
    discountValue: z.ZodOptional<z.ZodNumber>;
    maxUses: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    active: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    active?: boolean | undefined;
    code?: string | undefined;
    discountType?: "percentage" | "flat" | undefined;
    discountValue?: number | undefined;
    maxUses?: number | undefined;
}, {
    active?: boolean | undefined;
    code?: string | undefined;
    discountType?: "percentage" | "flat" | undefined;
    discountValue?: number | undefined;
    maxUses?: number | undefined;
}>;
