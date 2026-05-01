# api

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## LLM provider setup (`@google/genai`)

This API now uses Google Gen AI SDK for streaming responses.

Set these env vars for Gemini Developer API mode:

- `GEMINI_API_KEY`
- `GEMINI_MODEL_ID` (example: `gemini-2.5-flash`)

`TAVILY_API_KEY` is still required for web search.
