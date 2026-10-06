// Static mirror of src/lib/prismaData/common/utils/getCodeCampYearIdByYear.ts
import { global } from "@/lib/staticData/load";

export async function getCodeCampYearIdByYear(yearIn: string | number | undefined | null) {
  if (typeof yearIn === "undefined" || yearIn === null) {
    return undefined;
  }
  const token = typeof yearIn === "number" ? yearIn.toString() : yearIn;
  return global().idByToken[token] ?? undefined;
}
