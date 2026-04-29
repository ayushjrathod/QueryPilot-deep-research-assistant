import { SYSTEM_PROMPT, PROMPT_TEMPLATE } from "../prompts/prompt.ts";
import { buildCompactWebSearchResults, MAX_WEB_RESULTS } from "../utils/helper.ts";
import { tavily } from "@tavily/core";
import Groq from "groq-sdk";
import express from "express";

export const init = async () => {
  const webSearchClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
  });

  const llmClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  return { webSearchClient, llmClient };
};

export const askController = async (
  req: express.Request,
  res: express.Response
) => {
  // get query from user
  const { query } = req.body;
  const { webSearchClient, llmClient } = await init();

  // make sure user has credits or access

  // check if we have web search indexed for similar query

  // web search to gather resources
  const webSearchResponse = await webSearchClient.search(query, {
    searchDepth: "advanced",
  });
  const webSearchResults = webSearchResponse.results;
  const compactWebSearchResults = buildCompactWebSearchResults(
    webSearchResults
  );

  // do some context engineering on the prompt and the web search
  const prompt = PROMPT_TEMPLATE.replace(
    "{{WEB_SEARCH_RESULTS}}",
    compactWebSearchResults
  ).replace("{{USER_QUERY}}", query);

  const llmResponseStream = await llmClient.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  });

  for await (const chunk of llmResponseStream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      res.write(content);
    }
  }

  res.write("\n-------------Sources-------------\n");
  webSearchResults
    .slice(0, MAX_WEB_RESULTS)
    .forEach(
      (result: { title?: string; url?: string; content?: string }) =>
        res.write(JSON.stringify({ title: result.title, url: result.url }) + "\n")
    );
  res.end();
};

export const askFollowUpController = async (
  req: express.Request,
  res: express.Response
) => {
  // get existing chat from db
  // forward full history to llm
  // Do some context engineering if needed
  // stream response back to the user
};
