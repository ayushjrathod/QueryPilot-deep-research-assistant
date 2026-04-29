import { useRef, useState } from "react";
import type { SubmitEventHandler } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Source = {
  title?: string;
  url?: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const addAssistantChunk = (assistantId: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantId
          ? { ...message, content: `${message.content}${chunk}` }
          : message
      )
    );
    scrollToBottom();
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSources([]);
    setQuery("");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuery,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    scrollToBottom();

    try {
      const apiUrl = `${window.location.protocol}//${window.location.hostname}:3001/ask`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to generate response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const delimiter = "\n-------------Sources-------------\n";
      let buffer = "";
      let answerBuffer = "";
      let foundDelimiter = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        if (!foundDelimiter) {
          const delimiterIndex = buffer.indexOf(delimiter);
          if (delimiterIndex === -1) {
            answerBuffer += buffer;
            addAssistantChunk(assistantMessage.id, buffer);
            buffer = "";
            continue;
          }

          const answerChunk = buffer.slice(0, delimiterIndex);
          if (answerChunk) {
            answerBuffer += answerChunk;
            addAssistantChunk(assistantMessage.id, answerChunk);
          }
          buffer = buffer.slice(delimiterIndex + delimiter.length);
          foundDelimiter = true;
          continue;
        }
      }

      buffer += decoder.decode();

      if (!answerBuffer.trim()) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: "No response received from the model." }
              : message
          )
        );
      }

      if (foundDelimiter && buffer) {
        const parsedSources = buffer
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            try {
              return JSON.parse(line) as Source;
            } catch {
              return null;
            }
          })
          .filter((source): source is Source => Boolean(source));

        if (parsedSources.length > 0) {
          setSources(parsedSources);
        }
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while connecting to the API."
      );
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content:
                  "I could not complete this request. Please check the API server and try again.",
              }
            : message
        )
      );
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <h1>QueryPilot</h1>
          <p>Ask research questions and get streamed answers with sources.</p>
        </header>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              Start with a clear question to begin your research thread.
            </div>
          ) : (
            messages.map((message) => (
              <article key={message.id} className={`chat-message ${message.role}`}>
                <span className="chat-role">
                  {message.role === "user" ? "You" : "Assistant"}
                </span>
                <p>{message.content || (isLoading && message.role === "assistant" ? "..." : "")}</p>
              </article>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {sources.length > 0 && (
          <aside className="chat-sources">
            <h2>Sources</h2>
            <ul>
              {sources.map((source, index) => (
                <li key={`${source.url ?? "source"}-${index}`}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title || source.url}
                    </a>
                  ) : (
                    <span>{source.title || "Untitled source"}</span>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        )}

        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask anything..."
            rows={3}
            disabled={isLoading}
          />
          <div className="chat-form-actions">
            {error && <p className="chat-error">{error}</p>}
            <button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? "Generating..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
