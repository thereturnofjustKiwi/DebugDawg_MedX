import base64
import io
import json
import logging
import re
from typing import Optional

from groq import Groq
from PIL import Image

from ..core.config import settings
from ..models.registry import MODEL_REGISTRY

logger = logging.getLogger(__name__)

_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
_FALLBACK_VISION_MODEL = "llama-3.2-11b-vision-preview"

_ROUTING_PROMPT = """\
You are a medical image modality classifier. Analyze this image carefully and classify it.

Return ONLY a valid JSON object — no explanation, no markdown, no code block.

Classify into exactly one of these disease_type values:

- "pneumonia"    → Chest X-ray: wide thoracic view showing BOTH lungs + heart + ribs together
- "bonefracture" → Skeletal X-ray: single limb, joint, wrist, arm, leg, hand, foot, spine, or pelvis ONLY (NOT full chest)
- "braintumor"   → Brain MRI: grayscale axial/coronal/sagittal cross-section of brain tissue
- "skincancer"   → Dermoscopy: close-up skin lesion image, often with dermoscope ring border or ruler
- "lungcolon"    → Histopathology: microscopic tissue slide with pink/purple H&E staining
- "retina"       → Fundus Photography: circular retinal image with characteristic dark vignette border

CRITICAL DISTINCTIONS:
- Chest X-ray shows BOTH lungs + heart together → "pneumonia"
- Bone X-ray shows a SINGLE bone or joint, NO lung fields → "bonefracture"
- If you see a circular image with orange/red blood vessels on dark background → "retina"
- If you see microscopic cells/tissue in pink/purple → "lungcolon"

Return this exact JSON format:
{"disease_type": "<one of the 6 values above>", "confidence": "high|medium|low", "reasoning": "<one sentence>"}
"""


class RouterService:
    def __init__(self):
        self._client: Optional[Groq] = None
        if settings.GROQ_API_KEY:
            self._client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info(f"RouterService initialized — vision model: {_VISION_MODEL}")
        else:
            logger.warning("RouterService: GROQ_API_KEY not set — smart routing unavailable.")

    @property
    def available(self) -> bool:
        return self._client is not None

    def route_image(self, image_bytes: bytes) -> dict:
        """
        Sends image to Groq Vision LLM and returns routing result.
        Returns: {"disease_type": str, "confidence": str, "reasoning": str,
                  "display_name": str, "modality": str}
        Raises: RuntimeError if routing fails or Groq unavailable.
        """
        if not self._client:
            raise RuntimeError("GROQ_API_KEY not configured. Use /api/analyze with manual disease_type.")

        b64 = self._to_base64(image_bytes)

        for model in (_VISION_MODEL, _FALLBACK_VISION_MODEL):
            try:
                resp = self._client.chat.completions.create(
                    model=model,
                    messages=[{
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                            },
                            {
                                "type": "text",
                                "text": _ROUTING_PROMPT,
                            },
                        ],
                    }],
                    max_tokens=120,
                    temperature=0.05,
                )
                raw = resp.choices[0].message.content.strip()
                logger.info(f"[router] {model} raw response: {raw}")
                return self._parse(raw)

            except Exception as e:
                logger.warning(f"[router] {model} failed: {e}")
                continue

        raise RuntimeError("All vision models failed. Please use /api/analyze with manual disease_type selection.")

    # ── Helpers ───────────────────────────────────────────────────────────────
    @staticmethod
    def _to_base64(image_bytes: bytes) -> str:
        """Resize to 512×512 max before sending — reduces tokens, faster routing."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img.thumbnail((512, 512), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return base64.b64encode(buf.getvalue()).decode()

    @staticmethod
    def _parse(raw: str) -> dict:
        """Parse LLM JSON response — handles markdown code fences if present."""
        # Strip markdown code fences if model wraps in ```json ... ```
        cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw).strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            # Last resort: regex extract
            match = re.search(r'"disease_type"\s*:\s*"([^"]+)"', cleaned)
            if not match:
                raise RuntimeError(f"Could not parse router response: {raw}")
            data = {
                "disease_type": match.group(1),
                "confidence":   "low",
                "reasoning":    "Parsed via regex fallback.",
            }

        disease_type = data.get("disease_type", "").strip().lower()
        if disease_type not in MODEL_REGISTRY:
            raise RuntimeError(
                f"Router returned unknown disease_type '{disease_type}'. "
                f"Valid: {list(MODEL_REGISTRY.keys())}"
            )

        cfg = MODEL_REGISTRY[disease_type]
        return {
            "disease_type": disease_type,
            "confidence":   data.get("confidence", "medium"),
            "reasoning":    data.get("reasoning", ""),
            "display_name": cfg["display_name"],
            "modality":     cfg["modality"],
        }
