import { SYSTEM_PROMPT, PROMPT_TEMPLATE } from "../prompts/prompt.ts";
import { tavily } from "@tavily/core";
import { GoogleGenAI } from "@google/genai";
import express from "express";

const GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "global";

if (!GOOGLE_CLOUD_PROJECT) {
  throw new Error("GOOGLE_CLOUD_PROJECT is not set");
}

export const init = async () => {
  const webSearchClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
  });

  const llmClient = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
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
  const webSearchResults: { title?: string; url?: string; content?: string }[] = webSearchResponse.results;

  // do some context engineering on the prompt and the web search
  const prompt = PROMPT_TEMPLATE.replace(
    "{{WEB_SEARCH_RESULTS}}",
    JSON.stringify(webSearchResults)
  ).replace("{{USER_QUERY}}", query);

  const llmResponseStream = await llmClient.models.generateContentStream({
    model: GEMINI_MODEL_ID || "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  for await (const chunk of llmResponseStream) {
    const content = chunk.text;
    if (content) {
      res.write(content);
    }
  }

  res.write("\n-------------Sources-------------\n");
  webSearchResults
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
