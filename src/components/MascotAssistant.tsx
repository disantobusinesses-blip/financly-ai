import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  variant?: "error";
};

type MascotAssistantProps = {
  region: string;
};

const QUICK_CHIPS = [
  { label: "Spending last 30 days", prompt: "Calculate my spending in the last 30 days." },
  { label: "Top categories", prompt: "Show my top spending categories from recent transactions." },
  { label: "Subscriptions", prompt: "List my recurring subscriptions and their monthly cost." },
  { label: "Biggest expenses", prompt: "What are my biggest expenses recently?" },
  { label: "How can I save more?", prompt: "Give me basic budgeting tips based on my recent spending." },
];

const STORAGE_KEY = "myaibank_mascot_messages_v1";

function safeParseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractAssistantText(payload: any): string | null {
  if (!payload) return null;

  // Common shapes
  const direct =
    payload.answer ??
    payload.content ??
    payload.message ??
    payload.reply ??
    payload.response ??
    payload.text;

  if (typeof direct === "string" && direct.trim()) return direct.trim();

  // Nested shapes
  const nested =
    payload?.data?.answer ??
    payload?.data?.message ??
    payload?.data?.content ??
    payload?.result?.answer ??
    payload?.result?.message;

  if (typeof nested === "string" && nested.trim()) return nested.trim();

  return null;
}

const MascotAssistant: React.FC<MascotAssistantProps> = ({ region }) => {
  const { session } = useAuth();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [imageError, setImageError] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const quickChips = useMemo(() => QUICK_CHIPS, []);

  const appendMessage = (next: Message) => {
    setMessages((prev) => [...prev, next]);
  };

  // Restore messages (prevents remount wiping chat history)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = safeParseJson(raw);
      if (Array.isArray(parsed)) setMessages(parsed);
    } catch {
      // ignore
    }
  }, []);

  // Persist messages
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, thinking, open]);

  const handleSend = async (message: string, quickAction?: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (thinking) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const now = Date.now();

    appendMessage({
      id: `${now}-user`,
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
          content: "Please sign in to ask about your MyAiBank finances.",
        });
        return;
      }

      const response = await fetch("/api/mascot-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          quickAction,
          context: { region },
        }),
      });

      const rawText = await response.text();
      const payload = rawText ? safeParseJson(rawText) : null;

      if (!response.ok) {
        const errMsg =
          (payload && (payload.error || payload.message)) ||
          rawText ||
          "Unable to reach the assistant.";
        throw new Error(typeof errMsg === "string" ? errMsg : "Unable to reach the assistant.");
      }

      const assistantText =
        extractAssistantText(payload) ||
        (rawText && rawText.trim()) ||
        "I can only help with your MyAiBank finances. Ask about spending, income, bills, subscriptions, or saving tips.";

      appendMessage({
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: assistantText,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      appendMessage({
        id: `${Date.now()}-assistant-error`,
        role: "assistant",
        variant: "error",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I couldn't reach MyAiBank right now. Please try again.",
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
                    : message.variant === "error"
                      ? "bg-rose-500/20 text-rose-100"
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

            <div ref={bottomRef} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSend(chip.prompt, chip.label)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={thinking}
              >
                {chip.label}
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

export default MascotAssistant;
