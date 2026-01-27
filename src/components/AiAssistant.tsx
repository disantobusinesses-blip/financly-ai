import React, { useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Account, Transaction } from "../types";
import { buildFinanceContext } from "../utils/financeContext";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  variant?: "error";
};

type AiAssistantProps = {
  region: string;
  accounts: Account[];
  transactions: Transaction[];
  lastUpdated?: string | null;
};

const QUICK_CHIPS = [
  { label: "Spending last 30 days", prompt: "Calculate my spending in the last 30 days." },
  { label: "Top categories", prompt: "Show my top spending categories from recent transactions." },
  { label: "Subscriptions", prompt: "List my recurring subscriptions and their monthly cost." },
  { label: "Biggest expenses", prompt: "What are my biggest expenses recently?" },
  { label: "How can I save more?", prompt: "Give budgeting tips based on my recent spending." },
];

const AiAssistant: React.FC<AiAssistantProps> = ({ region, accounts, transactions, lastUpdated }) => {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const financeContext = useMemo(() => {
    return buildFinanceContext(accounts || [], transactions || [], region, lastUpdated || undefined);
  }, [accounts, transactions, region, lastUpdated]);

  const appendMessage = (next: Message) => {
    setMessages((prev) => [...prev, next]);
  };

  const handleSend = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (thinking) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    appendMessage({
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    });

    setInput("");
    setThinking(true);

    try {
      const accessToken = session?.access_token;
      if (!accessToken) {
        appendMessage({
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          variant: "error",
          content: "Please sign in to use the assistant.",
        });
        return;
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          financeContext,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Unable to reach the assistant.");
      }

      appendMessage({
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: typeof payload.reply === "string" ? payload.reply : "No reply returned.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      appendMessage({
        id: `${Date.now()}-assistant-error`,
        role: "assistant",
        variant: "error",
        content: error instanceof Error ? error.message : "Assistant error. Please try again.",
      });
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open AI Assistant"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/70 shadow-lg shadow-black/40 transition hover:shadow-black/60"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F0051] text-white text-sm font-semibold">
          AI
        </span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex w-[92vw] max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b10]/95 shadow-2xl shadow-black/50 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">AI Assistant</p>
              <h3 className="text-sm font-semibold text-white">MyAiBank finance companion</h3>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/70">
                Ask about spending trends, categories, subscriptions, or saving tips based on your data.
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  m.role === "user"
                    ? "ml-auto bg-[#1F0051] text-white"
                    : m.variant === "error"
                      ? "bg-rose-500/20 text-rose-100"
                      : "bg-white/10 text-white/90"
                }`}
              >
                {m.content}
              </div>
            ))}

            {thinking && (
              <div className="max-w-[70%] rounded-2xl bg-white/10 px-3 py-2 text-white/70">
                Thinking…
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSend(chip.prompt)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={thinking}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your spending…"
              className="flex-1 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              disabled={thinking}
            />
            <button
              type="submit"
              className="rounded-full bg-[#1F0051] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2a0a6c] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={thinking || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiAssistant;
