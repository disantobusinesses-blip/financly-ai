import React, { useMemo, useRef, useState } from "react";
import type { Account, Transaction } from "../types";
import { buildFinanceContext } from "../utils/financeContext";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type MascotAssistantProps = {
  accounts: Account[];
  transactions: Transaction[];
  region: string;
  lastUpdated?: string;
};

const QUICK_CHIPS = [
  "Spending last 30 days",
  "Top categories",
  "Subscriptions",
  "Biggest expenses",
  "How can I save more?",
];

const MascotAssistant: React.FC<MascotAssistantProps> = ({
  accounts,
  transactions,
  region,
  lastUpdated,
}) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [imageError, setImageError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const financeContext = useMemo(
    () => buildFinanceContext(accounts, transactions, region, lastUpdated),
    [accounts, transactions, region, lastUpdated]
  );

  const appendMessage = (next: Message) => {
    setMessages((prev) => [...prev, next]);
  };

  const handleSend = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };

    appendMessage(userMessage);
    setInput("");
    setThinking(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          financeContext,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to reach the assistant.");
      }

      appendMessage({
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content:
          typeof payload.reply === "string"
            ? payload.reply
            : "I can only help with your MyAiBank finances. Ask about spending, income, bills, subscriptions, or saving tips.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      appendMessage({
        id: `${Date.now()}-assistant-error`,
        role: "assistant",
        content:
          "I can only help with your MyAiBank finances. Ask about spending, income, bills, subscriptions, or saving tips.",
      });
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open Mascot Assistant"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/70 shadow-lg shadow-black/40 transition hover:shadow-black/60"
      >
        <span className="mascot-avatar relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1F0051] bg-[#14002f]">
          {!imageError ? (
            <img
              src="/mascot/myaibank-mascot.jpg"
              alt="MyAiBank mascot"
              className="mascot-bob h-11 w-11 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="mascot-fallback h-8 w-8 rounded-full bg-[#1F0051]" />
          )}
        </span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex w-[92vw] max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b10]/95 shadow-2xl shadow-black/50 backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Mascot Assistant</p>
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
                Ask me about spending trends, subscriptions, or saving tips based on your MyAiBank data.
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  message.role === "user"
                    ? "ml-auto bg-[#1F0051] text-white"
                    : "bg-white/10 text-white/90"
                }`}
              >
                {message.content}
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
                key={chip}
                type="button"
                onClick={() => handleSend(chip)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your spending…"
              className="flex-1 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-[#1F0051] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2a0a6c]"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default MascotAssistant;
