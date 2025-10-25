import { useCallback, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const API_KEY =
  import.meta.env.VITE_BREVO_KEY ||
  import.meta.env.VITE_NEWSLETTER_KEY ||
  import.meta.env.VITE_API_KEY ||
  "";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/contacts";
const DEFAULT_LIST_ID = Number(import.meta.env.VITE_BREVO_LIST_ID || 5);

const sendNewsletterRequest = async (targetEmail: string): Promise<boolean> => {
  const trimmedEmail = targetEmail.trim();
  if (!trimmedEmail) {
    return false;
  }

  if (!API_KEY) {
    console.warn("Brevo API key missing - treating newsletter opt-in as successful for preview builds.");
    return true;
  }

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "api-key": API_KEY,
      },
      body: JSON.stringify({
        email: trimmedEmail,
        listIds: [DEFAULT_LIST_ID],
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Brevo newsletter error", text);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Brevo request failed", error);
    return false;
  }
};

export const subscribeEmailToNewsletter = async (email: string): Promise<boolean> =>
  sendNewsletterRequest(email);

export const useNewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const reset = useCallback(() => {
    setEmail("");
    setStatus("idle");
  }, []);

  const submit = useCallback(
    async (overrideEmail?: string) => {
      const targetEmail = (overrideEmail ?? email).trim();
      if (!targetEmail) return false;

      setStatus("loading");
      const success = await sendNewsletterRequest(targetEmail);
      setStatus(success ? "success" : "error");
      return success;
    },
    [email]
  );

  return {
    email,
    setEmail,
    status,
    submit,
    reset,
  };
};
