import { z } from "zod";

export const registerUserSchema = z.object(
    {
        fullName: z
            .string()
            .min(1, "Full name is required"),
        
        email: z
            .string()
            .email("Invalid email address"),
        
        password: z
            .string()
            .min(6, "Password must be at least 6 characters"),
        
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
    }
);

export const loginUserSchema = z.object(
    {
        username: z
            .string()
            .optional(),

        email: z
            .string()
            .email()
            .optional(),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
    }

)
.refine(data => data.username || data.email, 
    {
        message: "Username or email is required"
    }
);
