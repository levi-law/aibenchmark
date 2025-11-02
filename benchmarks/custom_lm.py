"""Custom LM adapter for user-provided REST API to work with lm-evaluation-harness."""

import requests
from typing import List, Tuple, Optional
from lm_eval.api.model import LM
from lm_eval.api.registry import register_model


@register_model("custom")
class CustomLM(LM):
    """Custom LM class that interfaces with user-provided REST API."""
    
    def __init__(
        self,
        api_url: str,
        timeout: int = 120,
        **kwargs
    ):
        super().__init__()
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout
        self._rank = 0
        self._world_size = 1
        
        # Test connection
        try:
            health_response = requests.get(f"{self.api_url}/health", timeout=10)
            health_response.raise_for_status()
            print(f"✓ Connected to API: {health_response.json()}")
        except Exception as e:
            print(f"⚠ Health check failed (continuing anyway): {e}")
    
    @property
    def eot_token_id(self):
        """End of text token ID."""
        return 0
    
    @property
    def max_length(self):
        """Maximum sequence length."""
        return 4096
    
    @property
    def max_gen_toks(self):
        """Maximum generation tokens."""
        return 1024
    
    @property
    def batch_size(self):
        """Batch size for evaluation."""
        return 1  # Process one at a time for REST API
    
    @property
    def device(self):
        """Device (not applicable for REST API)."""
        return "api"
    
    def tok_encode(self, string: str, **kwargs) -> List[int]:
        """Encode string to token IDs (approximate for API)."""
        # Rough approximation: ~4 chars per token
        return list(range(len(string) // 4))
    
    def tok_decode(self, tokens: List[int], **kwargs) -> str:
        """Decode token IDs to string (not used for generation)."""
        return ""
    
    def loglikelihood(self, request_list: List[Tuple]) -> List[Tuple[float, bool]]:
        """Approximate log-likelihood for multiple choice tasks via grading."""

        results = []

        grading_system_message = (
            "You are a meticulous evaluator. Reply with 'YES' if the proposed answer is fully correct "
            "and directly addresses the question. Reply with 'NO' otherwise. Do not add explanations."
        )

        for request_tuple in request_list:
            # Handle both Instance objects and plain tuples
            if hasattr(request_tuple, "args"):
                context, continuation = request_tuple.args
            else:
                context, continuation = request_tuple

            payload = {
                "messages": [
                    {"role": "system", "content": grading_system_message},
                    {
                        "role": "user",
                        "content": (
                            f"Question and context:\n{context}\n\n"
                            f"Proposed answer choice:\n{continuation}\n\n"
                            "Is this proposed answer fully correct?"
                        ),
                    },
                ],
                "max_tokens": 4,
                "temperature": 0.0,
            }

            try:
                response = requests.post(
                    f"{self.api_url}/v1/chat/completions",
                    json=payload,
                    timeout=self.timeout,
                )
                response.raise_for_status()

                answer = (
                    response.json()["choices"][0]["message"]["content"].strip().upper()
                )
                is_correct = answer.startswith("YES")

                # Use a simple scoring scheme that prefers correct answers.
                score = 0.0 if is_correct else -20.0
                results.append((score, is_correct))

            except Exception as e:
                print(f"Error in loglikelihood: {e}")
                results.append((-100.0, False))

        return results
    
    def loglikelihood_rolling(self, request_list: List[Tuple]) -> List[float]:
        """Compute rolling log-likelihood (not implemented for API)."""
        return [-1.0] * len(request_list)
    
    def generate_until(self, request_list: List[Tuple]) -> List[str]:
        """
        Generate text until stopping condition.
        Each request is (context, generation_kwargs) tuple.
        """
        results = []
        
        for request_tuple in request_list:
            # Handle both Instance objects and plain tuples
            if hasattr(request_tuple, 'args'):
                context, gen_kwargs = request_tuple.args
            else:
                context, gen_kwargs = request_tuple
            
            try:
                # Extract generation parameters
                max_tokens = gen_kwargs.get("max_gen_toks", 1024)
                temperature = gen_kwargs.get("temperature", 0.0)
                
                response = requests.post(
                    f"{self.api_url}/v1/chat/completions",
                    json={
                        "messages": [{"role": "user", "content": context}],
                        "max_tokens": max_tokens,
                        "temperature": temperature
                    },
                    timeout=self.timeout
                )
                response.raise_for_status()
                
                result = response.json()
                generated_text = result["choices"][0]["message"]["content"]
                results.append(generated_text)
                
            except Exception as e:
                print(f"Error in generate_until: {e}")
                results.append("")
        
        return results
