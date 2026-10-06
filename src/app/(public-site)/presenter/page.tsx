import {permanentRedirect} from "next/navigation";
import {getCurrentCodeCampYear} from "@/lib/staticData/common/utils/getCurrentCodeCampYear";

export default async function Page() {
  const { year } = await getCurrentCodeCampYear();
  permanentRedirect(`/presenter/${year}/`); // trailing slash (STATIC-SITE-PLAN.md Step 4)
}
