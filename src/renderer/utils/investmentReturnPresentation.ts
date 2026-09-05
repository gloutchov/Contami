import type { ReturnPeriod } from "../components/ReturnChart";

export function investmentCardReturnPeriod(openedAt: string, activeYear: number): ReturnPeriod {
  return openedAt.startsWith(`${activeYear}-`) ? "monthly" : "annual";
}
