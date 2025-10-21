import { useCallback, useMemo, useState } from "react";

type NewsletterStatus = "idle" | "loading" | "success" | "error";

type SubscribeResult = {
  ok: boolean;
  message?: string;
};

const BREVO_ENDPOINT = "https://api.brevo.com/v3/contacts";

const extractErrorMessage = async (response: Response): Promise<string | undefined> => {
  try {
    const data = await response.json();
    if (data?.message) {
      return data.message as string;
    }

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      if (typeof firstError === "string") {
        return firstError;
      }

      if (firstError?.message) {
        return String(firstError.message);
      }
    }
  } catch (error) {
    console.error("Failed to parse Brevo error", error);
  }

  return undefined;
};

export const useBrevoNewsletter = () => {
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async (email: string): Promise<SubscribeResult> => {
    if (!email) {
      return { ok: false, message: "Please provide an email address." };
    }

    const apiKey = import.meta.env.VITE_BREVO_KEY;

    if (!apiKey) {
      const message = "Newsletter signup is unavailable at the moment. Please try again later.";
      setStatus("error");
      setError(message);
      return { ok: false, message };
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          email,
          updateEnabled: true,
        }),
      });

      if (!response.ok) {
        const fallback = response.statusText || "Unable to subscribe at this time.";
        const message = (await extractErrorMessage(response)) ?? fallback;
        setStatus("error");
        setError(message);
        return { ok: false, message };
      }

      setStatus("success");
      return { ok: true };
    } catch (subscribeError) {
      console.error("Failed to subscribe to Brevo newsletter", subscribeError);
      const message = subscribeError instanceof Error ? subscribeError.message : "Something went wrong.";
      setStatus("error");
      setError(message);
      return { ok: false, message };
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const state = useMemo(
    () => ({
      status,
      error,
      subscribe,
      reset,
    }),
    [status, error, subscribe, reset],
  );

  return state;
};

export type UseBrevoNewsletterReturn = ReturnType<typeof useBrevoNewsletter>;
