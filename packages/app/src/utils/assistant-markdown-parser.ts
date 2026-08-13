import MarkdownIt from "markdown-it";
import { markdownMath } from "./markdown-math";

export function createAssistantMarkdownParser(renderMath = false): MarkdownIt {
  const parser = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });
  if (renderMath) {
    parser.use(markdownMath);
  }
  const defaultValidateLink = parser.validateLink.bind(parser);

  parser.validateLink = (url: string) =>
    url.trim().toLowerCase().startsWith("file://") || defaultValidateLink(url);

  return parser;
}
