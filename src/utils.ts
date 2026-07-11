import sanitizeHtml from "sanitize-html";

export function sanitizeFeedContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "h1", "h2", "h3", "h4", "h5", "h6",
      "figure", "figcaption", "picture", "source",
      "video", "audio", "track", "iframe",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
      "div", "span", "pre", "code", "kbd", "samp", "var",
      "blockquote", "cite", "q", "del", "ins",
      "dl", "dt", "dd",
      "hr", "br", "wbr",
    ]),
    allowedAttributes: {
      "*": ["style", "class", "id", "lang", "dir"],
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "width", "height", "loading", "srcset", "sizes"],
      video: ["src", "controls", "width", "height", "poster", "autoplay", "loop", "muted"],
      audio: ["src", "controls", "autoplay", "loop"],
      source: ["src", "type", "media", "srcset", "sizes"],
      iframe: ["src", "width", "height", "allowfullscreen", "frameborder", "allow"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      col: ["span"],
      colgroup: ["span"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}
