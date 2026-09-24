import os

import requests

TIMEOUT = 30


def ask_ai(system, messages):
    """Return the AI's reply text, or None when running in mock mode."""
    provider = os.getenv("AI_PROVIDER", "mock").lower()
    if provider in {"grok", "xai"}:
        return _grok(system, messages)
    if provider == "gemini":
        return _gemini(system, messages)
    if provider == "groq":
        return _openai_style("https://api.groq.com/openai/v1/chat/completions", "Groq", system, messages)
    if provider == "openai":
        return _openai_style("https://api.openai.com/v1/chat/completions", "OpenAI", system, messages)
    if provider == "anthropic":
        return _anthropic(system, messages)
    return None


def _key():
    key = os.getenv("AI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("AI_API_KEY is empty in .env")
    return key


def _model(provider):
    model = os.getenv("AI_MODEL", "").strip()
    if not model:
        raise RuntimeError(f"Set AI_MODEL in .env. Copy a current model name from the {provider} docs.")
    return model


def _grok(system, messages):
    """Call xAI's OpenAI-compatible chat completions endpoint."""
    key = (os.getenv("XAI_API_KEY") or os.getenv("AI_API_KEY", "")).strip()
    if not key:
        raise RuntimeError("XAI_API_KEY is empty in .env")
    # Keep the model configurable while providing a current xAI default.
    model = os.getenv("AI_MODEL", "grok-4.7").strip() or "grok-4.7"
    r = requests.post(
        "https://api.x.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": model,
              "messages": [{"role": "system", "content": system}] + messages,
              "stream": False},
        timeout=TIMEOUT,
    )
    _check(r, "Grok")
    try:
        text = r.json()["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError, AttributeError):
        text = ""
    if not text:
        raise RuntimeError("Grok returned no answer. Try rephrasing your message.")
    return text


def _check(r, provider):
    if r.status_code in (401, 403) or (r.status_code == 400 and "api key" in r.text.lower()):
        if provider == "Grok":
            raise RuntimeError(
                "xAI rejected the key. Set XAI_API_KEY (or AI_API_KEY) to an active API key "
                "from the xAI Console; a Grok account password or another provider's key will not work."
            )
        raise RuntimeError(f"{provider} rejected the key. Check AI_API_KEY in .env")
    if r.status_code == 429:
        raise RuntimeError(f"{provider} free limit reached. Wait a minute and try again")
    r.raise_for_status()


def _gemini(system, messages):
    key, model = _key(), _model("Gemini")
    contents = [{"role": "model" if m["role"] == "assistant" else "user",
                 "parts": [{"text": m["content"]}]} for m in messages]
    r = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        json={"system_instruction": {"parts": [{"text": system}]}, "contents": contents,
              "generationConfig": {"maxOutputTokens": 1024}},
        timeout=TIMEOUT)
    _check(r, "Gemini")
    try:
        parts = r.json()["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts).strip()
    except (KeyError, IndexError):
        text = ""
    if not text:
        raise RuntimeError("Gemini returned no answer (it may have been blocked). Try rephrasing.")
    return text


def _openai_style(url, provider, system, messages):
    key, model = _key(), _model(provider)
    r = requests.post(url, headers={"Authorization": f"Bearer {key}"},
                      json={"model": model,
                            "messages": [{"role": "system", "content": system}] + messages},
                      timeout=TIMEOUT)
    _check(r, provider)
    return r.json()["choices"][0]["message"]["content"].strip()


def _anthropic(system, messages):
    key = _key()
    r = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={"x-api-key": key, "anthropic-version": "2023-06-01",
                 "content-type": "application/json"},
        json={"model": os.getenv("AI_MODEL") or "claude-haiku-4-5-20251001",
              "max_tokens": 500, "system": system, "messages": messages},
        timeout=TIMEOUT)
    _check(r, "Claude")
    return r.json()["content"][0]["text"].strip()
