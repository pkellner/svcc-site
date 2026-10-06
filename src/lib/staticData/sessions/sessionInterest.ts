// Static mirror of src/lib/prismaData/sessions/sessionInterest.ts.
// No logged-in users on a static, no-auth site, so there is never any
// interest data to show. (STATIC-SITE-PLAN.md Step 3.)
export async function getSessionInterestData(_codeCampYearId?: number, _sessionId?: number): Promise<any[]> {
  return [];
}
