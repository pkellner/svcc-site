// Static mirror of src/lib/prismaData/sponsors/sponsorsUtils.ts.
// donationAmount is dropped at export time (STATIC-SITE-PLAN.md Step 2
// whitelist) -- see sanitizeSponsor() in scripts/export-static-data.ts.
import { year } from "@/lib/staticData/load";

export async function getSponsorsData(urlPostToken: string): Promise<any[]> {
  return year(urlPostToken)?.sponsors ?? [];
}
