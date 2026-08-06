import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email invalid"),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere"),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Introdu numele complet"),
    email: z.email("Email invalid"),
    password: z.string().min(8, "Minim 8 caractere"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolele nu coincid",
    path: ["confirmPassword"],
  });

export const onboardingStep1Schema = z.object({
  companyName: z.string().min(2, "Numele companiei este obligatoriu"),
  activityType: z.string().min(1, "Selectează tipul de business"),
  city: z.string().min(2, "Orașul este obligatoriu"),
  country: z.string().min(2, "Țara este obligatorie"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
