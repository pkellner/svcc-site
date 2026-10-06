// Static mirror of src/lib/prismaData/common/utils/getCurrentCodeCampYear.ts
import { global } from "@/lib/staticData/load";

export async function getCurrentCodeCampYear() {
  return global().currentCodeCampYear;
}
