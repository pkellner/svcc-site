// Static mirror of src/lib/prismaData/configData.ts, keyed by id (not token):
// the "2014"/"2018" token collision means a per-token dict would be wrong for
// one of the two rows that share it (STATIC-SITE-PLAN.md Step 2).
import { global } from "@/lib/staticData/load";

export async function getConfigDataDict(codeCampYearId: number) {
  return global().configDictById[codeCampYearId] ?? {};
}
