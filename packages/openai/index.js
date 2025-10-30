const OPENAI_API_URL = "https://api.openai.com/v1";

class OpenAI {
  constructor(options = {}) {
    const { apiKey } = options;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required to initialize OpenAI client");
    }
    this.apiKey = apiKey;
    this.chat = {
      completions: {
        create: (params) => this.#createChatCompletion(params),
      },
    };
  }

  async #createChatCompletion(params = {}) {
    const { model, messages, temperature = 0, response_format } = params;
    if (!model) {
      throw new Error("model is required");
    }
    if (!Array.isArray(messages)) {
      throw new Error("messages must be an array");
    }

    const body = {
      model,
      messages,
      temperature,
    };

    if (response_format) {
      body.response_format = response_format;
    }

    const res = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
    }

    return res.json();
  }
}

export default OpenAI;
