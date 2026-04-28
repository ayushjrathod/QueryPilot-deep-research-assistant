import express from "express";
import { tavily } from '@tavily/core';

const webSearchClient = tavily({
  apiKey: process.env.TAVILY_API_KEY
});

const app = express();
app.use(express.json());

app.post("/perplexity_ask", async (req, res) => {
  //get query from user
  const { query } = req.body;
  
  //make sure user has credits or access

  //check if we have web search indexed for similar query

  //web search to gateher resources
  const webSearchResponse = await webSearchClient.search(query, {
    searchDepth: "advanced"
  });
  const webSearchResults = webSearchResponse.results;
  // do some context engineering on the promnpty and the web search
  
  // also stream back the osruces and follow up questions which can get from another llm call in parallel
})

app.listen(3000);
