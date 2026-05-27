import { format, differenceInYears, parseISO, isValid } from "date-fns";

export function formatYear(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "yyyy") : "—";
}

export function formatFullDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "d MMMM yyyy") : "—";
}

export function calculateAge(
  dateOfBirth: string | null,
  dateOfDeath?: string | null
): number | null {
  if (!dateOfBirth) return null;
  const birth = parseISO(dateOfBirth);
  if (!isValid(birth)) return null;
  const reference = dateOfDeath ? parseISO(dateOfDeath) : new Date();
  return differenceInYears(reference, birth);
}

export function lifeSpan(
  dateOfBirth: string | null,
  dateOfDeath: string | null
): string {
  const birth = formatYear(dateOfBirth);
  const death = formatYear(dateOfDeath);
  if (birth === "—" && death === "—") return "";
  if (death === "—") return `b. ${birth}`;
  return `${birth} – ${death}`;
}
