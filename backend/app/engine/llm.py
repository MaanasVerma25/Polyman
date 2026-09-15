import json
import logging
import itertools
import httpx
from typing import Dict, Any, List, Optional
from ..core.config import settings

logger = logging.getLogger("polyman.llm")

def mask_key(key: str) -> str:
    if not key:
        return "none"
    if len(key) <= 8:
        return "****"
    return f"{key[:6]}...{key[-4:]}"

class LLMGateway:
    def __init__(self):
        self._round_robin_counter = itertools.count()

    def get_api_key_for_agent(self, provider: str = "gemini", agent_role: Optional[str] = None) -> str:
        """
        Resolve the appropriate API key for a specific agent role or return a round-robin key from the pool.
        """
        provider = (provider or "gemini").lower()
        if provider == "gemini":
            # 1. Check dedicated per-agent key
            if agent_role and agent_role in settings.gemini_agent_keys:
                key = settings.gemini_agent_keys[agent_role]
                if key:
                    return key
            
            # 2. Check pool of Gemini keys
            pool = settings.gemini_api_keys or ([settings.gemini_api_key] if settings.gemini_api_key else [])
            if pool:
                idx = next(self._round_robin_counter) % len(pool)
                return pool[idx]

            return settings.gemini_api_key or ""

        elif provider == "groq":
            return settings.groq_api_key or ""
        elif provider == "openai":
            return settings.openai_api_key or ""
        elif provider == "anthropic":
            return settings.anthropic_api_key or ""

        return ""

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        agent_role: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> str:
        # Determine provider and model from settings.agent_models if not explicitly given
        if agent_role and agent_role in settings.agent_models:
            preferred = settings.agent_models[agent_role]
            provider = provider or preferred.get("provider")
            model = model or preferred.get("model")

        provider = (provider or "gemini").lower()

        # Resolve API key for this specific agent execution
        if not api_key:
            api_key = self.get_api_key_for_agent(provider=provider, agent_role=agent_role)

        logger.info(
            f"Agent [{agent_role or 'orchestrator'}] invoking LLM via {provider} "
            f"(model={model or 'default'}) using key {mask_key(api_key)}"
        )

        # Primary execution by provider with automatic fallback
        if provider == "groq" and settings.groq_api_key:
            try:
                return await self._call_groq(system_prompt, user_prompt, model or "groq/compound", temperature, api_key)
            except Exception as e:
                logger.warning(f"Groq API call failed ({e}). Falling back to Gemini multi-key pool.")
                gemini_key = self.get_api_key_for_agent(provider="gemini", agent_role=agent_role)
                return await self._call_gemini(system_prompt, user_prompt, "gemini-2.5-flash", temperature, gemini_key)

        elif provider == "gemini" and (api_key or settings.gemini_api_key or settings.gemini_api_keys):
            try:
                return await self._call_gemini(system_prompt, user_prompt, model or "gemini-2.5-flash", temperature, api_key)
            except Exception as e:
                if settings.groq_api_key:
                    logger.warning(f"Gemini API call failed ({e}). Falling back to Groq.")
                    return await self._call_groq(system_prompt, user_prompt, "groq/compound", temperature, settings.groq_api_key)
                raise

        elif provider == "openai" and settings.openai_api_key:
            return await self._call_openai(system_prompt, user_prompt, model or "gpt-4o-mini", temperature, api_key or settings.openai_api_key)
        elif provider == "anthropic" and settings.anthropic_api_key:
            return await self._call_anthropic(system_prompt, user_prompt, model or "claude-3-5-sonnet-20241022", temperature, api_key or settings.anthropic_api_key)
        elif provider == "ollama":
            try:
                return await self._call_ollama(system_prompt, user_prompt, model or "llama3", temperature)
            except Exception as e:
                logger.warning(f"Ollama call failed: {e}")

        # If provider wasn't directly handled, attempt whatever key is available
        if settings.gemini_api_key or settings.gemini_api_keys:
            key = self.get_api_key_for_agent(provider="gemini", agent_role=agent_role)
            return await self._call_gemini(system_prompt, user_prompt, "gemini-2.5-flash", temperature, key)
        elif settings.groq_api_key:
            return await self._call_groq(system_prompt, user_prompt, "groq/compound", temperature, settings.groq_api_key)

        raise RuntimeError("No active LLM API key configured. Please configure GEMINI_API_KEY or GROQ_API_KEY in your environment.")

    async def _call_groq(self, system: str, prompt: str, model: str, temp: float, api_key: Optional[str] = None) -> str:
        """
        Execute request against ultra-fast Groq API with robust headers.
        """
        key = api_key or settings.groq_api_key
        if not model or "/" not in model:
            model = "groq/compound"

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "Polyman/1.0"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "temperature": temp
        }
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                elif resp.status_code == 404:
                    # Fallback to compound-mini
                    payload["model"] = "groq/compound-mini"
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    resp.raise_for_status()
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise RuntimeError(f"Groq API error: {e}")

    async def _call_gemini(self, system: str, prompt: str, model: str, temp: float, api_key: Optional[str] = None) -> str:
        """
        Execute request against Google Gemini API with candidate model routing and multi-key failover.
        """
        primary_key = api_key or settings.gemini_api_key or (settings.gemini_api_keys[0] if settings.gemini_api_keys else "")
        keys_to_try = [primary_key]
        for k in settings.gemini_api_keys:
            if k and k not in keys_to_try:
                keys_to_try.append(k)

        # Normalize model to current valid Gemini versions
        if not model or "gpt" in model.lower() or "claude" in model.lower() or "2.0" in model:
            model = "gemini-2.5-flash"

        candidate_models = [model]
        for m in ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest"]:
            if m not in candidate_models:
                candidate_models.append(m)

        errors = []

        for current_key in keys_to_try:
            for m in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={current_key}"
                headers = {
                    "Content-Type": "application/json",
                    "User-Agent": "Polyman/1.0"
                }
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
                        elif resp.status_code == 429:
                            # Rate limited on this key, attempt failover to next key in pool
                            errors.append(f"Key {mask_key(current_key)} 429 Rate Limit on {m}")
                            break
                        else:
                            errors.append(f"{m} (HTTP {resp.status_code}): {resp.text[:160]}")
                except Exception as e:
                    errors.append(f"{m} error with key {mask_key(current_key)}: {str(e)}")

        err_summary = " | ".join(errors[:2])
        logger.error(f"Gemini API returned error: {err_summary}")
        raise RuntimeError(f"Google Gemini API error: {err_summary}")

    async def _call_openai(self, system: str, prompt: str, model: str, temp: float, api_key: Optional[str] = None) -> str:
        key = api_key or settings.openai_api_key
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": "Polyman/1.0"
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

    async def _call_anthropic(self, system: str, prompt: str, model: str, temp: float, api_key: Optional[str] = None) -> str:
        key = api_key or settings.anthropic_api_key
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
            "User-Agent": "Polyman/1.0"
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
