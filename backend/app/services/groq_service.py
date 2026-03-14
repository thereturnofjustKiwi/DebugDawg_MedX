import logging
from typing import Optional, List
from groq import Groq
from ..core.config import settings

logger = logging.getLogger(__name__)

# ── Single-image prompt — now uses rule-based explanation as context ──────────
_SINGLE_PROMPT = """\
You are an expert radiologist AI. Generate a precise 3-sentence clinical narrative.

ANALYSIS DATA:
- Disease Type   : {disease_type}
- Modality       : {modality}
- Diagnosis      : {diagnosis_label}
- Confidence     : {conf_pct}%
- Severity       : {severity}/10
- Risk Level     : {risk_level}
- Anatomical Focus (Grad-CAM): {gradcam_region}
- Attribution Focus (SHAP)   : {shap_region}
- XAI Consensus  : {consensus}
- Key Finding    : {gradcam_explanation}
- Patient Age    : {age}
- Patient Gender : {gender}

INSTRUCTIONS:
Sentence 1: State the primary diagnosis, its anatomical location, and confidence level.
Sentence 2: Describe what the AI model observed in the highlighted region (use the Key Finding above as context). If XAI consensus is LOW, explicitly flag that methods disagree and clinical correlation is critical.
Sentence 3: Give a specific clinical recommendation based on the risk level.

End with exactly: "This is an AI-assisted analysis. Always consult a qualified medical professional."

Tone: Clinical, concise, trustworthy. Avoid generic statements.
"""

# ── Batch prompt ──────────────────────────────────────────────────────────────
_BATCH_PROMPT = """\
You are an expert radiologist AI. Generate a 3-sentence ensemble clinical narrative.

ENSEMBLE DATA:
- Disease Type       : {disease_type}
- Modality           : {modality}
- Ensemble Diagnosis : {ensemble_label}
- Ensemble Confidence: {conf_pct}%
- Images Analyzed    : {images_count}
- Risk Level         : {risk_level}
- Patient Age        : {age}
- Patient Gender     : {gender}

INSTRUCTIONS:
Sentence 1: State the ensemble diagnosis and that it is based on analysis of {images_count} images.
Sentence 2: Comment on the reliability of multi-image analysis vs single-image and what the confidence implies.
Sentence 3: Give a specific clinical recommendation.

End with: "This is an AI-assisted ensemble analysis. Always consult a qualified medical professional."
"""


class GroqService:
    def __init__(self):
        self._client: Optional[Groq] = None
        if settings.GROQ_API_KEY:
            self._client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info(f"Groq client initialized with model: {settings.GROQ_MODEL}") 
        else:
            logger.warning("GROQ_API_KEY not configured — fallback narratives will be used.")

    # ── Single image ──────────────────────────────────────────────────────────
    async def generate_narrative(
        self,
        disease_type: str,
        modality: str,
        diagnosis_label: str,
        confidence_score: float,
        severity_score: float,
        gradcam_region: str,
        shap_region: str,
        xai_consensus: str,
        gradcam_explanation: str,
        explanation_points: List[str],
        patient_age: Optional[int],
        patient_gender: Optional[str],
    ) -> str:
        if not self._client:
            return self._fallback(diagnosis_label, confidence_score, xai_consensus)

        prompt = _SINGLE_PROMPT.format(
            disease_type=disease_type.replace("_", " ").title(),
            modality=modality,
            diagnosis_label=diagnosis_label,
            conf_pct=round(confidence_score * 100, 1),
            severity=severity_score,
            risk_level="HIGH" if confidence_score >= 0.9 else "MODERATE" if confidence_score >= 0.7 else "LOW",
            gradcam_region=gradcam_region,
            shap_region=shap_region,
            consensus=xai_consensus.upper(),
            gradcam_explanation=gradcam_explanation,
            age=patient_age or "Not provided",
            gender=patient_gender or "Not provided",
        )

        try:
            resp = self._client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a clinical AI assistant. Be precise, anatomically accurate, and concise."},
                    {"role": "user",   "content": prompt},
                ],
                max_tokens=320,
                temperature=0.2,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return self._fallback(diagnosis_label, confidence_score, xai_consensus)

    # ── Batch ─────────────────────────────────────────────────────────────────
    async def generate_batch_narrative(
        self,
        disease_type: str,
        modality: str,
        ensemble_label: str,
        ensemble_confidence: float,
        images_count: int,
        risk_level: str,
        patient_age: Optional[int],
        patient_gender: Optional[str],
    ) -> str:
        if not self._client:
            return f"Ensemble of {images_count} images indicates {ensemble_label} with {ensemble_confidence*100:.1f}% confidence. This is an AI-assisted ensemble analysis. Always consult a qualified medical professional."

        prompt = _BATCH_PROMPT.format(
            disease_type=disease_type.replace("_", " ").title(),
            modality=modality,
            ensemble_label=ensemble_label,
            conf_pct=round(ensemble_confidence * 100, 1),
            images_count=images_count,
            risk_level=risk_level,
            age=patient_age or "Not provided",
            gender=patient_gender or "Not provided",
        )

        try:
            resp = self._client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a clinical AI assistant generating ensemble radiology reports."},
                    {"role": "user",   "content": prompt},
                ],
                max_tokens=280,
                temperature=0.2,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq batch narrative error: {e}")
            return f"Ensemble of {images_count} images indicates {ensemble_label}. Always consult a qualified medical professional."

    @staticmethod
    def _fallback(label: str, conf: float, consensus: str) -> str:
        level = "high" if conf > 0.8 else "moderate" if conf > 0.6 else "low"
        note  = " XAI methods show divergent focus — clinical correlation strongly recommended." if consensus == "low" else ""
        return (
            f"Analysis indicates {label} with {level} confidence ({conf*100:.1f}%). "
            f"The model identified imaging features supporting this diagnosis.{note} "
            "This is an AI-assisted analysis. Always consult a qualified medical professional."
        )
