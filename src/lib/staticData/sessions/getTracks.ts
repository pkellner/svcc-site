// Static mirror of src/lib/prismaData/sessions/getTracks.ts
import { global, year } from "@/lib/staticData/load";

export async function getTracks(codeCampYearId: number) {
  const token = Object.keys(global().idByToken).find((t) => global().idByToken[t] === codeCampYearId);
  if (!token) return [];
  return year(token)?.tracks ?? [];
}
