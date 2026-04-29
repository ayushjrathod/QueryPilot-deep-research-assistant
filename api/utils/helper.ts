export const MAX_WEB_RESULTS = 3;
const MAX_RESULT_CHARS = 350;

export const buildCompactWebSearchResults = (results: Array<{ title?: string; url?: string; content?: string }>) => {
  return results
    .slice(0, MAX_WEB_RESULTS)
    .map((result, index) => {
      const content = result.content?.slice(0, MAX_RESULT_CHARS) ?? "";

      return [
        `Result ${index + 1}`,
        result.title ? `Title: ${result.title}` : null,
        result.url ? `URL: ${result.url}` : null,
        content ? `Snippet: ${content}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
};
