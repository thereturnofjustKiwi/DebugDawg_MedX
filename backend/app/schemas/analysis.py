from typing import List, Optional, Any
from pydantic import BaseModel, Field


class SHAPValue(BaseModel):
    region_name: str
    value: float

class BoundingBox(BaseModel):
    x: float          # left edge, normalized 0-1
    y: float          # top edge, normalized 0-1
    width: float      # box width, normalized 0-1
    height: float     # box height, normalized 0-1

class AnnotationPin(BaseModel):
    peak_x: float             # crosshair center X, normalized 0-1
    peak_y: float             # crosshair center Y, normalized 0-1
    bbox: Optional[BoundingBox]
    region_label: str         # "Lower Right"
    short_explanation: str    # truncated gradcam_explanation (≤80 chars)
    full_explanation: str     # full gradcam_explanation for tooltip
    confidence_pct: str       # "94.2%"
    risk_level: str           # "HIGH" | "MODERATE" | "LOW"
    risk_color: str           # "#DC3232" | "#E6A01E" | "#32C850" — ready-to-use hex

class SHAPQuadrant(BaseModel):
    region_name: str          # "Upper Left" etc.
    value: float              # attribution score
    pct: str                  # "34.2%" — pre-formatted for display
    norm_x: float             # center X of this quadrant, normalized
    norm_y: float             # center Y of this quadrant, normalized

class AnnotationData(BaseModel):
    gradcam_pin: AnnotationPin
    shap_quadrants: List[SHAPQuadrant]   # 4 quadrant labels with positions

class ImageQualityReport(BaseModel):
    passed: bool
    blur_score: float
    brightness: float
    resolution: str
    issue: Optional[str] = None        # "blurry" | "too_dark" | "too_bright" | "low_resolution"
    message: str


class AnalysisResponse(BaseModel):
    # Core diagnosis
    diagnosis_label: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    severity_score: float = Field(ge=1.0, le=10.0)

    # Phase 1 — Risk level
    risk_level: str                    # "HIGH" | "MODERATE" | "LOW"
    risk_reason: str                   # human-readable reason for the risk level

    # Images — plain (annotation OFF)
    original_image: str
    gradcam_heatmap: str
    shap_overlay: str

    # Images — annotated (annotation ON)          ← ADD THESE 3 LINES
    annotated_original: str = ""
    annotated_gradcam:  str = ""
    annotated_shap:     str = ""
    annotation_data: Optional[AnnotationData] = None

    # XAI metadata
    gradcam_region: str
    shap_region: str
    xai_consensus: str
    shap_values: List[SHAPValue]

    # Phase 3 — Enhanced explanation
    gradcam_explanation: str           # rule-based region explanation
    explanation_points: List[str]      # bullet-point style key findings

    # LLM narrative
    clinical_narrative: str

    # Context
    disease_type: str
    modality: str
    all_probabilities: List[dict]
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None

    # Phase 2 — Quality report
    image_quality: ImageQualityReport



class BatchImageResult(BaseModel):
    image_index: int
    filename: str
    diagnosis_label: str
    confidence_score: float
    risk_level: str
    gradcam_heatmap: str
    gradcam_region: str
    image_quality: ImageQualityReport


class BatchAnalysisResponse(BaseModel):
    # Ensemble result
    ensemble_diagnosis: str
    ensemble_confidence: float
    ensemble_risk_level: str
    ensemble_risk_reason: str
    clinical_narrative: str

    # Per-image results
    individual_results: List[BatchImageResult]
    images_analyzed: int
    images_rejected: int               # failed quality check
    all_probabilities: List[dict]      # averaged across all valid images

    disease_type: str
    modality: str
# ── Add these at the bottom of analysis.py ───────────────────────────────────

class RouteResult(BaseModel):
    disease_type: str          # e.g. "pneumonia"
    confidence:   str          # "high" | "medium" | "low"
    reasoning:    str          # one-sentence LLM explanation
    display_name: str          # e.g. "Pneumonia"
    modality:     str          # e.g. "Chest X-Ray"


class RouteResponse(BaseModel):
    route: RouteResult


class SmartAnalysisResponse(AnalysisResponse):
    """Full analysis response + routing metadata."""
    route: RouteResult
