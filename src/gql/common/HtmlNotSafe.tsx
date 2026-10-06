import {sanitizeBasicHtml} from "@/lib/sanitize";

export default function HtmlNotSafe({ htmlData, allowHtml = false }: { htmlData: string | undefined; allowHtml: boolean | undefined }) {
  if (!htmlData) {
    return <span></span>;
  }

  const cleanHtmlData = sanitizeBasicHtml(htmlData, allowHtml);

  if (allowHtml) {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: cleanHtmlData,
        }}
      />
    );
  }

  return <span>{cleanHtmlData}</span>;
}
