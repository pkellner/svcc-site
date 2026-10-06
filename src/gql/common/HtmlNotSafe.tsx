import {sanitizeBasicHtml} from "@/lib/sanitize";

// Session descriptions and speaker bios are stored HTML whatever their allowHtml flag says, so they
// are always rendered as sanitized HTML (inline formatting only). Rendering the sanitizer's output as
// React text instead showed its escaping to visitors ("R&amp;D", "&lt;p&gt;").
export default function HtmlNotSafe({ htmlData }: { htmlData: string | undefined; allowHtml?: boolean | undefined }) {
  if (!htmlData) {
    return <span></span>;
  }

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: sanitizeBasicHtml(htmlData, true),
      }}
    />
  );
}
