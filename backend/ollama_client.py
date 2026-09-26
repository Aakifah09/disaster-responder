import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3"

def generate(prompt: str, json_format: bool = False, timeout: int = 15) -> str:
    """Connect to local Ollama instance and generate a response."""
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }
    if json_format:
        payload["format"] = "json"
        
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        response.raise_for_status()
        return response.json()["response"]
    except requests.exceptions.Timeout:
        print(f"[OLLAMA] Connection timed out after {timeout}s.")
        raise
    except Exception as e:
        print(f"[OLLAMA] Error connecting to Ollama: {e}")
        raise
