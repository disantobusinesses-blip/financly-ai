import { useCallback, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const API_KEY =
  import.meta.env.VITE_BREVO_KEY ||
  import.meta.env.VITE_NEWSLETTER_KEY ||
  import.meta.env.VITE_API_KEY ||
  "";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/contacts";
const DEFAULT_LIST_ID = Number(import.meta.env.VITE_BREVO_LIST_ID || 5);

export const useNewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const reset = useCallback(() => {
    setEmail("");
    setStatus("idle");
  }, []);

  const submit = useCallback(async () => {
    if (!email) return;
    if (!API_KEY) {
      console.warn("Brevo API key missing - faking newsletter success for preview.");
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "api-key": API_KEY,
        },
        body: JSON.stringify({
          email,
          listIds: [DEFAULT_LIST_ID],
          updateEnabled: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Brevo newsletter error", text);
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch (error) {
      console.error("Brevo request failed", error);
      setStatus("error");
    }
  }, [email]);

  return {
    email,
    setEmail,
    status,
    submit,
    reset,
  };
};
