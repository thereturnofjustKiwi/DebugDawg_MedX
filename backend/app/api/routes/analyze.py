import logging
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ...models.registry import MODEL_REGISTRY
from ...schemas.analysis import (
    AnalysisResponse,
    BatchAnalysisResponse,
    RouteResponse,        # ← NEW
    SmartAnalysisResponse # ← NEW
)
from ...services import analysis_service

router    = APIRouter()
logger    = logging.getLogger(__name__)

_ALLOWED  = {"image/jpeg", "image/jpg", "image/png"}
_MAX_SIZE = 10 * 1024 * 1024   # 10 MB
_MAX_BATCH = 5


# ── Batch images ──────────────────────────────────────────────────────────────
@router.post("/analyze/batch", response_model=BatchAnalysisResponse)
async def analyze_batch(
    images:         List[UploadFile] = File(..., description=f"Up to {_MAX_BATCH} medical images"),
    disease_type:   str              = Form(...),
    patient_age:    Optional[int]    = Form(None),
    patient_gender: Optional[str]    = Form(None),
):
    if len(images) < 1:
        raise HTTPException(400, "At least 1 image required.")
    if len(images) > _MAX_BATCH:
        raise HTTPException(400, f"Maximum {_MAX_BATCH} images per batch request.")
    if disease_type not in MODEL_REGISTRY:
        raise HTTPException(400, f"Invalid disease_type. Valid: {list(MODEL_REGISTRY.keys())}")

    # Read all images
    images_data: List[tuple[str, bytes]] = []
    for img in images:
        if img.content_type not in _ALLOWED:
            raise HTTPException(400, f"File '{img.filename}' has unsupported type '{img.content_type}'.")
        data = await img.read()
        if len(data) > _MAX_SIZE:
            raise HTTPException(413, f"File '{img.filename}' exceeds 10 MB limit.")
        images_data.append((img.filename or f"image_{len(images_data)}.jpg", data))

    try:
        result = await analysis_service.run_batch_analysis(
            images_bytes=images_data,
            disease_type=disease_type,
            patient_age=patient_age,
            patient_gender=patient_gender,
        )
        return BatchAnalysisResponse(**result)
    except ValueError as e:
        raise HTTPException(422, detail={"error": "batch_failed", "message": str(e)})
    except Exception as e:
        logger.exception("Batch analysis error")
        raise HTTPException(500, detail=str(e))

# ── Smart analyze (auto-route + full analysis) ────────────────────────────────
@router.post("/analyze", response_model=SmartAnalysisResponse)
async def smart_analyze(
    image:          UploadFile    = File(...),
    patient_age:    Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
):
    """
    Flagship endpoint — auto-detects image modality via Groq Vision LLM,
    routes to the correct specialist pipeline, and returns full analysis.
    No disease_type selection required from the user.
    """
    if image.content_type not in _ALLOWED:
        raise HTTPException(400, f"Unsupported type '{image.content_type}'. Use JPG or PNG.")

    data = await image.read()
    _validate_size(data)

    try:
        result = await analysis_service.run_smart_analysis(data, patient_age, patient_gender)
        return SmartAnalysisResponse(**result)

    except RuntimeError as e:
        raise HTTPException(503, detail={
            "error":    "routing_unavailable",
            "message":  str(e),
            "fallback": "Use POST /api/analyze with manual disease_type field."
        })
    except ValueError as e:
        err = str(e)
        if err.startswith("QUALITY_FAIL:"):
            raise HTTPException(422, detail={
                "error":   "image_quality_failed",
                "message": err.replace("QUALITY_FAIL:", "").strip(),
                "hint":    "Please upload a clearer, properly exposed, higher-resolution scan."
            })
        raise HTTPException(500, detail=str(e))
    except Exception as e:
        logger.exception("Smart analysis error")
        raise HTTPException(500, detail=str(e))


# ── Helpers ───────────────────────────────────────────────────────────────────
def _validate_file(image: UploadFile, disease_type: str):
    if image.content_type not in _ALLOWED:
        raise HTTPException(400, f"Unsupported type '{image.content_type}'. Use JPG or PNG.")
    if disease_type not in MODEL_REGISTRY:
        raise HTTPException(400, f"Invalid disease_type. Valid: {list(MODEL_REGISTRY.keys())}")

def _validate_size(data: bytes):
    if len(data) > _MAX_SIZE:
        raise HTTPException(413, "File too large. Maximum: 10 MB.")
