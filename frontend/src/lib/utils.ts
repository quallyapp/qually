import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ALLOWED_TAGS = new Set(['p','br','strong','em','ul','ol','li','h1','h2','h3','h4','h5','h6','a','code','pre']);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
};

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?\/?>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<input[\s\S]*?\/?>/gi, "")
    .replace(/<textarea[\s\S]*?<\/textarea>/gi, "")
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<(\/?)([\w-]+)([^>]*)>/g, (_match, slash, tag, attrs) => {
      const lower = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(lower)) return "";
      if (lower === "a" && !slash) {
        const safeAttrs = attrs.replace(
          /(?:href|title|target|rel)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
          (m: string, dQuote: string, sQuote: string) => {
            const val = dQuote ?? sQuote ?? "";
            if (/^\s*javascript:/i.test(val)) return "";
            return m;
          }
        );
        return `<a${safeAttrs} rel="noopener noreferrer">`;
      }
      return `<${slash}${lower}>`;
    });
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, "")
    .trim();
}
