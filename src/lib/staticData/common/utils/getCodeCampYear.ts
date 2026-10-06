// Static mirror of src/lib/prismaData/common/utils/getCodeCampYear.ts
import { global } from "@/lib/staticData/load";

export async function getCodeCampYear(codeCampYearId: number | null | undefined = 0) {
  if (typeof codeCampYearId === "undefined" || codeCampYearId === null) {
    return undefined;
  }
  return global().codeCampYearRecById[codeCampYearId];
}
