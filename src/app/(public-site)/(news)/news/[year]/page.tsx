import React from "react";
import NewsList from "@/app/(public-site)/(news)/news/NewsList";
import NewsHeader from "@/app/(public-site)/(news)/news/NewsHeader";
import {getCodeCampYearByYearOrCcyId} from "@/lib/utils";
import {notFound} from "next/navigation";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getAllYearTokens} from "@/lib/staticData/allYearTokens";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export default async function PageNewsYear(props: { params: Promise<{ year: string }> }) {
  const params = await props.params;
  const codeCampYears = await getCodeCampYears();
  const codeCampYear = await getCodeCampYearByYearOrCcyId(codeCampYears, params.year);
  if (!codeCampYear) {
    notFound();
  }

  return (
    <>
      <NewsHeader year={params.year} />
      <section className="rd-nae-body">
        <div className="rd-wrap">
          <NewsList year={params.year ?? ""} />
        </div>
      </section>
    </>
  );
}
