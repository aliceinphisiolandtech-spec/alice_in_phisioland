import { z } from "zod";

const postalCodeRegex = /^\d{2}-\d{3}$/;
const nipRegex = /^\d{10}$/;

export const BillingSchema = z
  .object({
    billingType: z.enum(["personal", "company"], {
      message: "Wybierz typ konta.",
    }),
    billingName: z.string().min(2, "Nazwa/Imię musi mieć minimum 2 znaki."),
    billingAddress: z.string().min(5, "Podaj pełny adres (ulica i numer)."),
    billingCity: z.string().min(2, "Podaj miasto."),
    billingPostalCode: z.string().regex(postalCodeRegex, "Format: 00-000"),
    billingNip: z.string().optional(),

    // ZMIANA TUTAJ: Usuń .default("PL").
    // Wartość i tak przyjdzie z formularza, więc wystarczy zwykły string().
    billingCountry: z.string(),
  })
  .refine(
    (data) => {
      if (data.billingType === "company") {
        return !!data.billingNip && nipRegex.test(data.billingNip);
      }
      return true;
    },
    {
      message: "Poprawny NIP (10 cyfr) jest wymagany dla firmy.",
      path: ["billingNip"],
    },
  );

export type BillingFormData = z.infer<typeof BillingSchema>;
