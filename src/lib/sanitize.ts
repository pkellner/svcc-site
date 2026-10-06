import sanitizeHtml from "sanitize-html";
import { prefixSiteRelativeUrls } from "@/lib/basePath";

/**
 * Every place the site renders database HTML with dangerouslySetInnerHTML goes
 * through one of these two configs. Session and news bodies are written by
 * admins and, historically, pasted in from Word and Facebook, so the stored
 * markup contains <script> and a long tail of on* handlers.
 */

/** Inline formatting only. Used for session descriptions and speaker bios. */
const BASIC_ALLOWED_TAGS = ["b", "br", "i", "em", "strong", "p", "ul", "li"];

export function sanitizeBasicHtml(html: string | undefined | null, allowHtml = true): string {
  return sanitizeHtml(html ?? "", { allowedTags: allowHtml ? BASIC_ALLOWED_TAGS : [] });
}

/**
 * News bodies. The tag and attribute lists were taken from what the News rows
 * actually contain (tables, <font>, images, YouTube embeds), so nothing
 * legitimate stops rendering; <script>, every on* handler and every iframe that
 * is not YouTube are dropped. `style` is deliberately not allowed.
 */
const NEWS_PRESENTATION_ATTRS = ["width", "height", "align", "valign", "bgcolor", "bordercolor", "class", "border", "cellpadding", "cellspacing", "nowrap"];

const newsOptions: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "iframe", "font", "h1", "h2", "u", "center"],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "class", "title"],
    img: ["src", "alt", "title", "width", "height", "align", "border", "hspace", "vspace", "class"],
    iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "allow", "title"],
    font: ["size", "color", "face"],
    table: NEWS_PRESENTATION_ATTRS,
    tr: NEWS_PRESENTATION_ATTRS,
    td: [...NEWS_PRESENTATION_ATTRS, "colspan", "rowspan"],
    th: [...NEWS_PRESENTATION_ATTRS, "colspan", "rowspan"],
    div: ["class", "align", "id"],
    span: ["class"],
    p: ["class", "align"],
    blockquote: ["cite", "class"],
    ul: ["class"],
    ol: ["class"],
    li: ["class"],
  },
  allowedIframeHostnames: ["www.youtube.com", "youtube.com"],
};

export function sanitizeNewsHtml(html: string | undefined | null): string {
  // News bodies link and embed site-relative paths ("/miscpages/x.png").
  return prefixSiteRelativeUrls(sanitizeHtml(html ?? "", newsOptions));
}
