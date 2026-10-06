// Static mirror of src/lib/prismaData/sessions/sessionsWithInterestLevelDict.ts.
// No logged-in users on a static, no-auth site. (STATIC-SITE-PLAN.md Step 3.)
export default async function getSessionsWithInterestLevelDict(_year?: string, _username?: string): Promise<Record<number, number>> {
  return {};
}
