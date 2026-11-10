import { z } from 'zod';
export declare const createSnackSchema: z.ZodObject<{
    name: z.ZodString;
    icon: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    price: z.ZodNumber;
    inStock: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    category: string;
    icon: string;
    price: number;
    inStock: boolean;
}, {
    name: string;
    price: number;
    description?: string | undefined;
    category?: string | undefined;
    icon?: string | undefined;
    inStock?: boolean | undefined;
}>;
export declare const updateSnackSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    price: z.ZodOptional<z.ZodNumber>;
    inStock: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    category: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    icon?: string | undefined;
    price?: number | undefined;
    inStock?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    icon?: string | undefined;
    price?: number | undefined;
    inStock?: boolean | undefined;
}>;
