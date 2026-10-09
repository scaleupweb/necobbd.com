import sanitizeHtml from "sanitize-html";

/**
 * Cleans HTML written in the admin rich-text editor so it is safe to show on the
 * public site: only formatting tags, colours, sizes, alignment, links and images
 * survive — no scripts, iframes, event handlers or javascript: links.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: ["p", "br", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "span", "mark", "ul", "ol", "li", "blockquote", "a", "img", "hr", "code", "pre"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
        "font-size": [/^\d{1,2}(\.\d+)?(px|rem|em)$/],
        "text-align": [/^(left|right|center|justify)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" } }),
    },
  }).trim();
}

/** True when the editor content has no visible text or images. */
export const isRichTextEmpty = (html: string) => !html || !/<img\b/i.test(html) && !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
