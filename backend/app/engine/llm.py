import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from ..core.config import settings

logger = logging.getLogger("polyman.llm")

class LLMGateway:
    def __init__(self):
        pass

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        provider: str = "gemini",
        model: str = "gemini-2.5-flash",
        temperature: float = 0.2
    ) -> str:
        provider = provider.lower()

        # Prioritize Gemini whenever configured
        if settings.gemini_api_key:
            return await self._call_gemini(system_prompt, user_prompt, model, temperature)

        # Fallback to other providers if explicitly configured with keys
        if provider == "openai" and settings.openai_api_key:
            return await self._call_openai(system_prompt, user_prompt, model, temperature)
        elif provider == "anthropic" and settings.anthropic_api_key:
            return await self._call_anthropic(system_prompt, user_prompt, model, temperature)
        elif provider == "ollama":
            try:
                return await self._call_ollama(system_prompt, user_prompt, model, temperature)
            except Exception as e:
                logger.warning(f"Ollama call failed: {e}")

        raise RuntimeError("No active LLM API key configured. Please add GEMINI_API_KEY to your environment.")

    async def _call_gemini(self, system: str, prompt: str, model: str, temp: float) -> str:
        """
        Execute request against Google Gemini API with candidate model routing
        supporting both v1beta generateContent and modern Interactions API.
        """
        # Normalize model to current valid Gemini versions
        if not model or "gpt" in model.lower() or "claude" in model.lower() or "2.0" in model:
            model = "gemini-2.5-flash"

        candidate_models = [model]
        for m in ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"]:
            if m not in candidate_models:
                candidate_models.append(m)

        errors = []

        # 1. Try generateContent on standard models
        for m in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={settings.gemini_api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": temp}
            }
            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
                        return json.dumps(data)
                    else:
                        errors.append(f"{m} (HTTP {resp.status_code}): {resp.text[:160]}")
            except Exception as e:
                errors.append(f"{m} error: {str(e)}")

        # 2. Try Interactions API endpoint
        interactions_url = "https://generativelanguage.googleapis.com/v1beta/interactions"
        int_headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": settings.gemini_api_key
        }
        for m in candidate_models:
            int_payload = {
                "model": m,
                "input": f"System Instructions:\n{system}\n\nUser Task:\n{prompt}",
                "generation_config": {"temperature": temp}
            }
            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    resp = await client.post(interactions_url, headers=int_headers, json=int_payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        if "output" in data:
                            out = data["output"]
                            return out if isinstance(out, str) else json.dumps(out)
                        elif "candidates" in data:
                            return data["candidates"][0]["content"]["parts"][0]["text"]
                        return json.dumps(data)
                    else:
                        errors.append(f"interactions-{m} (HTTP {resp.status_code}): {resp.text[:160]}")
            except Exception as e:
                errors.append(f"interactions-{m} error: {str(e)}")

        # If Google's API returned permission denied or deprecated models, surface the exact response
        err_summary = " | ".join(errors[:2])
        logger.error(f"Gemini API returned error: {err_summary}")
        raise RuntimeError(f"Google Gemini API error: {err_summary}")

    async def _call_openai(self, system: str, prompt: str, model: str, temp: float) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "temperature": temp
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def _call_anthropic(self, system: str, prompt: str, model: str, temp: float) -> str:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": settings.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "max_tokens": 4096,
            "system": system,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": temp
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]

    async def _call_ollama(self, system: str, prompt: str, model: str, temp: float) -> str:
        url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "stream": False,
            "options": {"temperature": temp}
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"]

llm_gateway = LLMGateway()
