# Groq chat setup

The chat backend calls Groq from the server. Keep the API key in the root `.env` file; never put it in browser JavaScript.

```dotenv
AI_PROVIDER=groq
AI_MODEL=openai/gpt-oss-20b
AI_API_KEY=your_groq_api_key
```

Create a key at [Groq Console](https://console.groq.com/keys). Choose an active model ID from [Groq's supported models](https://console.groq.com/docs/models). Restart Flask after changing `.env`.
