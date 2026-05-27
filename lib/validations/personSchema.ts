import { z } from "zod";

export const personSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(60, "Too long"),
    middleNames: z.string().max(120, "Too long").nullable().optional(),
    surname: z.string().min(1, "Surname is required").max(60, "Too long"),
    dateOfBirth: z.string().nullable().optional(),
    status: z.enum(["alive", "deceased"]),
    dateOfDeath: z.string().nullable().optional(),
    causeOfDeath: z.string().max(200, "Too long").nullable().optional(),
    placeOfBirth: z.string().max(200, "Too long").nullable().optional(),
    birthLat: z.number().nullable().optional(),
    birthLng: z.number().nullable().optional(),
    placeOfDeath: z.string().max(200, "Too long").nullable().optional(),
    deathLat: z.number().nullable().optional(),
    deathLng: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "deceased" && data.dateOfDeath && data.dateOfBirth) {
        return new Date(data.dateOfDeath) >= new Date(data.dateOfBirth);
      }
      return true;
    },
    { message: "Date of death cannot be before date of birth", path: ["dateOfDeath"] }
  );

export type PersonFormValues = z.infer<typeof personSchema>;
