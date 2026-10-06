// Shared by every [year]-only generateStaticParams (STATIC-SITE-PLAN.md
// Step 4): every [year] route uses ALL getCodeCampYears() tokens, including
// 2006/2007 -- the nav links every year, and some pages (session/[year])
// call their data helpers before the FirstYearsNoData check.
import { getCodeCampYears } from "@/lib/staticData/codeCampYears/codeCampYears";

export async function getAllYearTokens(): Promise<{ year: string }[]> {
  const years = await getCodeCampYears();
  return years.map((y: any) => ({ year: y.urlPostToken }));
}
