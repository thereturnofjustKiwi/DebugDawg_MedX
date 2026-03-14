import io
import logging
from pathlib import Path
from typing import Optional, List

import torch
from PIL import Image
from .router_service import RouterService
from ..core.config import settings
from ..models.registry import MODEL_REGISTRY
from ..pipeline.medical_pipeline import MedicalAIPipeline
from ..pipeline.quality_checker import ImageQualityChecker
from .groq_service import GroqService

logger = logging.getLogger(__name__)

_pipelines: dict[str, MedicalAIPipeline] = {}
_groq: Optional[GroqService] = None
_quality_checker = ImageQualityChecker()       # stateless — one instance for all requests
_router: Optional[RouterService] = None

def initialize_pipelines():
    global _pipelines, _groq,  _router
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Initializing pipelines on: {device}")
    bg_dir = settings.BACKGROUND_SAMPLES_DIR
    bg_dir_resolved = bg_dir if bg_dir.exists() else None

    for disease_type in MODEL_REGISTRY:
        try:
            _pipelines[disease_type] = MedicalAIPipeline(disease_type, device, bg_dir_resolved)
            logger.info(f"  ✓ {disease_type}")
        except Exception as e:
            logger.error(f"  ✗ {disease_type}: {e}")

    _groq = GroqService()
    _router = RouterService() 
    logger.info(f"Pipelines ready: {list(_pipelines.keys())}")


def get_pipeline(disease_type: str) -> MedicalAIPipeline:
    if disease_type not in _pipelines:
        raise KeyError(f"Pipeline not loaded for '{disease_type}'")
    return _pipelines[disease_type]


async def run_analysis(
    image_bytes: bytes,
    disease_type: str,
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
) -> dict:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Get modality from registry to pass to quality checker
    from ..models.registry import MODEL_REGISTRY
    modality = MODEL_REGISTRY[disease_type]["modality"]

    # Quality check with modality-aware thresholds
    quality_report = _quality_checker.check(image, modality=modality)
    if not quality_report.passed:
        raise ValueError(f"QUALITY_FAIL:{quality_report.message}")

    pipeline = get_pipeline(disease_type)
    result   = pipeline.analyze(image)

    narrative = await _groq.generate_narrative(**{
        "disease_type":     disease_type,
        "modality":         result["modality"],
        "diagnosis_label":  result["diagnosis_label"],
        "confidence_score": result["confidence_score"],
        "severity_score":   result["severity_score"],
        "gradcam_region":   result["gradcam_region"],
        "shap_region":      result["shap_region"],
        "xai_consensus":    result["xai_consensus"],
        "gradcam_explanation": result["gradcam_explanation"],
        "explanation_points":  result["explanation_points"],
        "patient_age":      patient_age,
        "patient_gender":   patient_gender,
    }) if _groq else "Clinical narrative unavailable."

    result["clinical_narrative"] = narrative
    result["image_quality"]      = quality_report
    result["patient_age"]        = patient_age
    result["patient_gender"]     = patient_gender
    return result

async def run_smart_analysis(
    image_bytes:    bytes,
    patient_age:    Optional[int] = None,
    patient_gender: Optional[str] = None,
) -> dict:
    """
    Auto-routes image to correct disease pipeline via Groq Vision,
    then runs full analysis. Returns AnalysisResponse fields + route metadata.
    """
    if not _router or not _router.available:
        raise RuntimeError(
            "Smart routing unavailable — GROQ_API_KEY not configured. "
            "Use POST /api/analyze with disease_type field instead."
        )

    # Step 1 — Route
    route_result = _router.route_image(image_bytes)
    disease_type = route_result["disease_type"]
    logger.info(
        f"[smart-analyze] Routed → {disease_type} "
        f"(confidence: {route_result['confidence']}) | {route_result['reasoning']}"
    )

    # Step 2 — Full analysis using detected disease_type
    result = await run_analysis(image_bytes, disease_type, patient_age, patient_gender)

    # Step 3 — Attach routing metadata
    result["route"] = route_result
    return result


async def run_route_only(image_bytes: bytes) -> dict:
    if not _router or not _router.available:
        raise RuntimeError(
            "Smart routing unavailable — GROQ_API_KEY not configured."
        )
    return _router.route_image(image_bytes)  # sync call inside async fn — fine



async def run_batch_analysis(
    images_bytes: List[tuple[str, bytes]],   # list of (filename, bytes)
    disease_type: str,
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
) -> dict:
    """Phase 4 — Batch analysis with probability ensemble averaging."""
    from ..models.registry import MODEL_REGISTRY

    pipeline        = get_pipeline(disease_type)
    individual      = []
    valid_probs     = []
    rejected_count  = 0

    for idx, (filename, img_bytes) in enumerate(images_bytes):
        image        = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        quality      = _quality_checker.check(image)

        if not quality.passed:
            rejected_count += 1
            individual.append({
                "image_index":     idx,
                "filename":        filename,
                "diagnosis_label": "Rejected — Quality Check Failed",
                "confidence_score": 0.0,
                "risk_level":      "LOW",
                "gradcam_heatmap": "",
                "gradcam_region":  "N/A",
                "image_quality":   quality,
            })
            continue

        result = pipeline.analyze(image)
        valid_probs.append(result["all_probabilities"])

        individual.append({
            "image_index":     idx,
            "filename":        filename,
            "diagnosis_label": result["diagnosis_label"],
            "confidence_score": result["confidence_score"],
            "risk_level":      result["risk_level"],
            "gradcam_heatmap": result["gradcam_heatmap"],
            "gradcam_region":  result["gradcam_region"],
            "image_quality":   quality,
        })

    if not valid_probs:
        raise ValueError("All uploaded images failed the quality check. Please upload clearer scans.")

    # Ensemble: average probabilities across all valid images
    class_names   = [p["class"] for p in valid_probs[0]]
    avg_probs     = []
    for i, cls in enumerate(class_names):
        avg_val = sum(vp[i]["probability"] for vp in valid_probs) / len(valid_probs)
        avg_probs.append({"class": cls, "probability": round(avg_val, 4)})

    top           = max(avg_probs, key=lambda x: x["probability"])
    ensemble_conf = top["probability"]
    ensemble_cls  = top["class"]

    from ..pipeline.medical_pipeline import LABEL_MAP
    ensemble_label = LABEL_MAP.get(ensemble_cls, ensemble_cls.replace("_", " ").title())
    risk_level, risk_reason = MedicalAIPipeline._get_risk_level(ensemble_conf, ensemble_label)

    cfg = MODEL_REGISTRY[disease_type]
    narrative = await _groq.generate_batch_narrative(
        disease_type=disease_type,
        modality=cfg["modality"],
        ensemble_label=ensemble_label,
        ensemble_confidence=ensemble_conf,
        images_count=len(valid_probs),
        risk_level=risk_level,
        patient_age=patient_age,
        patient_gender=patient_gender,
    ) if _groq else f"Ensemble analysis of {len(valid_probs)} images indicates {ensemble_label}."

    return {
        "ensemble_diagnosis":   ensemble_label,
        "ensemble_confidence":  round(ensemble_conf, 4),
        "ensemble_risk_level":  risk_level,
        "ensemble_risk_reason": risk_reason,
        "clinical_narrative":   narrative,
        "individual_results":   individual,
        "images_analyzed":      len(valid_probs),
        "images_rejected":      rejected_count,
        "all_probabilities":    avg_probs,
        "disease_type":         disease_type,
        "modality":             cfg["modality"],
    }
