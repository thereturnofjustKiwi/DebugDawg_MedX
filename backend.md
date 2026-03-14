<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## ExplainableMed Backend — Complete Technical Summary


***

## Project Overview

**ExplainableMed** is a multi-model medical image diagnosis system with Explainable AI. The backend is a **FastAPI** application that accepts medical images, runs inference through disease-specific EfficientNet-B0 pipelines, and returns predictions with visual explanations (Grad-CAM heatmaps, SHAP attribution overlays), risk levels, anatomical explanations, and LLM-generated clinical narratives.

***

## Tech Stack

```
Language     : Python 3.10+
Framework    : FastAPI + Uvicorn
ML           : PyTorch, TorchVision (EfficientNet-B0)
XAI          : Grad-CAM (custom), Integrated Gradients (SHAP-style)
LLM          : Groq API (llama/mixtral) — fallback if key missing
Image        : OpenCV, Pillow, NumPy
Server       : Uvicorn (localhost:8000 in dev)
```


***

## File Structure

```
backend/
├── app/
│   ├── main.py                          # FastAPI app entry, startup pipeline init
│   ├── core/
│   │   └── config.py                    # Settings (GROQ_API_KEY, paths, etc.)
│   ├── models/
│   │   └── registry.py                  # MODEL_REGISTRY — single source of truth
│   ├── schemas/
│   │   └── analysis.py                  # Pydantic request/response models
│   ├── pipeline/
│   │   ├── medical_pipeline.py          # Core inference + XAI pipeline
│   │   ├── gradcam.py                   # Grad-CAM extractor
│   │   ├── shap_explainer.py            # Integrated Gradients
│   │   ├── severity.py                  # Severity score calculator
│   │   ├── xai_consensus.py             # Grad-CAM vs SHAP region agreement
│   │   ├── quality_checker.py           # Pre-inference image quality gate
│   │   └── explanation.py              # Rule-based anatomical explanations
│   ├── services/
│   │   ├── analysis_service.py          # Orchestrates pipeline + Groq
│   │   └── groq_service.py             # LLM narrative generation
│   └── api/
│       └── routes/
│           └── analyze.py              # /api/analyze + /api/analyze/batch
├── model_weights/
│   ├── pneumonia_efficientnetb0.pth
│   ├── braintumor_efficientnetb0.pth
│   ├── skincancer_efficientnetb0.pth
│   ├── lungcolon_efficientnetb0.pth
│   └── retinal_efficientnetb0_best.pth
└── scripts/
    └── verify_weights.py
```


***

## MODEL_REGISTRY — All 5 Models

```python
MODEL_REGISTRY = {
    "pneumonia": {
        "path": "model_weights/pneumonia_efficientnetb0.pth",
        "classes": ["NORMAL", "PNEUMONIA"],
        "num_classes": 2,
        "modality": "Chest X-Ray",
        "display_name": "Pneumonia",
    },
    "braintumor": {
        "path": "model_weights/braintumor_efficientnetb0.pth",
        "classes": ["glioma", "meningioma", "notumor", "pituitary"],
        "num_classes": 4,
        "modality": "MRI",
        "display_name": "Brain Tumor",
    },
    "skincancer": {
        "path": "model_weights/skincancer_efficientnetb0.pth",
        "classes": ["mel", "nv", "bcc", "akiec", "bkl", "df", "vasc"],
        "num_classes": 7,
        "modality": "Dermoscopy",
        "display_name": "Skin Cancer (HAM10000)",
    },
    "lungcolon": {
        "path": "model_weights/lungcolon_efficientnetb0.pth",
        "classes": ["colon_aca", "colon_n", "lung_aca", "lung_n", "lung_scc"],
        "num_classes": 5,
        "modality": "Histopathology",
        "display_name": "Lung & Colon Cancer",
    },
    "retina": {
        "path": "model_weights/retinal_efficientnetb0_best.pth",
        "classes": ["normal", "Retinal Disease"],
        "num_classes": 2,
        "modality": "Fundus Photography",
        "display_name": "Diabetic Retinopathy",
    },
}
```


***

## API Endpoints

### Base URL

```
http://localhost:8000
```


***

### `GET /` — Health Check

```
Response: {"status": "ok"}
```


***

### `GET /api/models` *(if implemented)* — List Available Models

Returns all entries from MODEL_REGISTRY. Frontend uses this to populate disease selector dropdown.

***

### `POST /api/analyze` — Single Image Diagnosis ⭐ Primary Endpoint

**Request:** `multipart/form-data`


| Field | Type | Required | Values |
| :-- | :-- | :-- | :-- |
| `image` | `File` | ✅ | JPG or PNG, max 10MB |
| `disease_type` | `str` (Form) | ✅ | `"pneumonia"` \| `"braintumor"` \| `"skincancer"` \| `"lungcolon"` \| `"retina"` |
| `patient_age` | `int` (Form) | ❌ | e.g. `45` |
| `patient_gender` | `str` (Form) | ❌ | `"male"` \| `"female"` \| `"other"` |

**Success Response `200`:** `application/json`

```json
{
  "diagnosis_label":     "Pneumonia Detected",
  "confidence_score":    0.9423,
  "severity_score":      7.8,

  "risk_level":          "HIGH",
  "risk_reason":         "Model confidence of 94.2% strongly indicates pathological findings. Immediate clinical correlation recommended.",

  "original_image":      "data:image/png;base64,<base64string>",
  "gradcam_heatmap":     "data:image/png;base64,<base64string>",
  "shap_overlay":        "data:image/png;base64,<base64string>",

  "gradcam_region":      "Lower Right",
  "shap_region":         "Lower Right",
  "xai_consensus":       "high",

  "gradcam_explanation": "The lower-right lung lobe showed peak activation — the most frequent anatomical site for lobar pneumonia.",

  "explanation_points": [
    "Primary finding: Pneumonia Detected with 94.2% model confidence.",
    "Anatomical focus: The lower-right lung lobe showed peak activation — the most frequent anatomical site for lobar pneumonia.",
    "XAI agreement: Both Grad-CAM and attribution analysis agree on the Lower Right region — model certainty is high.",
    "Severity score 7.8/10 — activation intensity indicates significant imaging abnormality in the highlighted region.",
    "Recommendation: Clinical action recommended: refer for specialist consultation and confirmatory testing."
  ],

  "shap_values": [
    {"region_name": "Lower Right", "value": 0.342},
    {"region_name": "Lower Left",  "value": 0.187},
    {"region_name": "Middle Right","value": 0.098}
  ],

  "clinical_narrative":  "Analysis of the chest X-ray reveals Pneumonia with 94.2% confidence, with peak model activation in the lower-right lung lobe. The Grad-CAM heatmap highlights consolidation patterns in the right lower lobe consistent with lobar pneumonia, with strong agreement between gradient and attribution-based XAI methods. Immediate referral for confirmatory diagnostics and antibiotic therapy initiation is recommended given the HIGH risk classification. This is an AI-assisted analysis. Always consult a qualified medical professional.",

  "all_probabilities": [
    {"class": "NORMAL",    "probability": 0.0577},
    {"class": "PNEUMONIA", "probability": 0.9423}
  ],

  "disease_type":  "pneumonia",
  "modality":      "Chest X-Ray",
  "patient_age":   45,
  "patient_gender": "male",

  "image_quality": {
    "passed":     true,
    "blur_score": 142.3,
    "brightness": 118.7,
    "resolution": "1024x768",
    "issue":      null,
    "message":    "Image quality is acceptable for diagnosis."
  }
}
```

**Error Responses:**

```json
// 400 — Invalid disease_type
{"detail": "Invalid disease_type. Valid: ['pneumonia', 'braintumor', 'skincancer', 'lungcolon', 'retina']"}

// 400 — Wrong file type
{"detail": "Unsupported type 'image/gif'. Use JPG or PNG."}

// 413 — File too large
{"detail": "File too large. Maximum: 10 MB."}

// 422 — Image quality failed
{
  "detail": {
    "error":    "image_quality_failed",
    "message":  "Image appears blurry or out of focus. Please upload a sharper, clearer scan.",
    "hint":     "Please upload a clearer, properly exposed, higher-resolution scan."
  }
}

// 500 — Pipeline error
{"detail": "<error message>"}
```


***

### `POST /api/analyze/batch` — Multi-Image Ensemble Diagnosis

**Request:** `multipart/form-data`


| Field | Type | Required | Notes |
| :-- | :-- | :-- | :-- |
| `images` | `List[File]` | ✅ | 1–5 JPG/PNG images, each max 10MB |
| `disease_type` | `str` (Form) | ✅ | Same valid values as single endpoint |
| `patient_age` | `int` (Form) | ❌ | Optional |
| `patient_gender` | `str` (Form) | ❌ | Optional |

**Success Response `200`:** `application/json`

```json
{
  "ensemble_diagnosis":   "Pneumonia Detected",
  "ensemble_confidence":  0.9156,
  "ensemble_risk_level":  "HIGH",
  "ensemble_risk_reason": "Model confidence of 91.6% strongly indicates pathological findings. Immediate clinical correlation recommended.",
  "clinical_narrative":   "Ensemble analysis of 3 chest X-ray images indicates Pneumonia with 91.6% confidence...",

  "individual_results": [
    {
      "image_index":      0,
      "filename":         "xray1.jpg",
      "diagnosis_label":  "Pneumonia Detected",
      "confidence_score": 0.943,
      "risk_level":       "HIGH",
      "gradcam_heatmap":  "data:image/png;base64,<base64string>",
      "gradcam_region":   "Lower Right",
      "image_quality": {
        "passed": true,
        "blur_score": 142.3,
        "brightness": 118.7,
        "resolution": "1024x768",
        "issue": null,
        "message": "Image quality is acceptable for diagnosis."
      }
    },
    {
      "image_index":      1,
      "filename":         "xray2.jpg",
      "diagnosis_label":  "Rejected — Quality Check Failed",
      "confidence_score": 0.0,
      "risk_level":       "LOW",
      "gradcam_heatmap":  "",
      "gradcam_region":   "N/A",
      "image_quality": {
        "passed": false,
        "blur_score": 12.1,
        "brightness": 95.2,
        "resolution": "800x600",
        "issue": "blurry",
        "message": "Image appears blurry or out of focus..."
      }
    }
  ],

  "images_analyzed":   2,
  "images_rejected":   1,

  "all_probabilities": [
    {"class": "NORMAL",    "probability": 0.0844},
    {"class": "PNEUMONIA", "probability": 0.9156}
  ],

  "disease_type": "pneumonia",
  "modality":     "Chest X-Ray"
}
```

**Error Responses:**

```json
// 400 — Too many images
{"detail": "Maximum 5 images per batch request."}

// 422 — All images rejected by quality check
{
  "detail": {
    "error":   "batch_failed",
    "message": "All uploaded images failed the quality check. Please upload clearer scans."
  }
}
```


***

## Key Data Types Reference

### `risk_level` values

```
"HIGH"     → confidence ≥ 90% AND pathology detected
"MODERATE" → confidence 70–89% AND pathology detected
"LOW"      → confidence < 70% OR normal/benign prediction
```


### `xai_consensus` values

```
"high"   → Grad-CAM region === SHAP region (exact match)
"medium" → Adjacent regions (e.g. Upper Left ↔ Middle Left)
"low"    → Conflicting regions (e.g. Upper Left ↔ Lower Right)
```


### `gradcam_region` / `shap_region` values

```
"Upper Left" | "Upper Right" | "Middle Left" |
"Middle Right" | "Lower Left" | "Lower Right" | "Diffuse"
```


### `image_quality.issue` values

```
null              → passed
"blurry"          → variance_of_laplacian below modality threshold
"too_dark"        → mean brightness < 15
"too_bright"      → mean brightness > 240
"low_resolution"  → image smaller than 64×64px
```


### Images in response

All three image fields (`original_image`, `gradcam_heatmap`, `shap_overlay`) are:

```
"data:image/png;base64,<base64_encoded_png_string>"
```

Frontend can directly assign these as `src` of `<img>` tags.

***

## Blur Thresholds Per Modality (Quality Checker)

```
Fundus Photography  → 15.0   (retina — large black border)
Chest X-Ray         → 20.0   (pneumonia — grayscale, low contrast)
MRI                 → 25.0   (braintumor — smooth gradients)
Dermoscopy          → 60.0   (skincancer — detailed texture)
Histopathology      → 80.0   (lungcolon — high-detail slides)
```


***

## LABEL_MAP — Raw Class → Display Label

```python
"NORMAL"          → "Normal — No Disease Detected"
"PNEUMONIA"       → "Pneumonia Detected"
"notumor"         → "Normal — No Tumor Detected"
"glioma"          → "Glioma Detected"
"meningioma"      → "Meningioma Detected"
"pituitary"       → "Pituitary Tumor Detected"
"mel"             → "Melanoma Detected"
"nv"              → "Melanocytic Nevi (Benign)"
"bcc"             → "Basal Cell Carcinoma Detected"
"akiec"           → "Actinic Keratosis / Intraepithelial Carcinoma"
"bkl"             → "Benign Keratosis-like Lesion"
"df"              → "Dermatofibroma"
"vasc"            → "Vascular Lesion"
"colon_aca"       → "Colon Adenocarcinoma Detected"
"colon_n"         → "Normal Colon Tissue"
"lung_aca"        → "Lung Adenocarcinoma Detected"
"lung_n"          → "Normal Lung Tissue"
"lung_scc"        → "Lung Squamous Cell Carcinoma Detected"
"normal"          → "Normal — No Retinal Disease Detected"
"Retinal Disease" → "Diabetic Retinopathy / Retinal Disease Detected"
```


***

## Startup Behaviour

On server start, `initialize_pipelines()` runs for all 5 disease types. If a `.pth` file is missing, that pipeline falls back to **random weights** (logs a WARNING) but does NOT crash — the remaining models still load. Pipelines ready log:

```
INFO  Pipelines ready: ['pneumonia', 'braintumor', 'skincancer', 'lungcolon', 'retina']
```


***

## Environment Variables Required

```bash
# .env
GROQ_API_KEY=gsk_xxxx          # Required for LLM narratives (free at console.groq.com)
GROQ_MODEL=llama3-8b-8192      # or mixtral-8x7b-32768
BACKGROUND_SAMPLES_DIR=        # Optional: path to background images for SHAP baseline
```


***

## Frontend Integration Checklist for Antigravity Agent

| What to display | Source field | Notes |
| :-- | :-- | :-- |
| Diagnosis text | `diagnosis_label` | Large, prominent |
| Confidence % | `confidence_score × 100` | e.g. "94.2%" |
| Risk badge | `risk_level` | Color: RED=HIGH, ORANGE=MODERATE, GREEN=LOW |
| Risk explanation | `risk_reason` | Subtitle under badge |
| Original image | `original_image` | `<img src={original_image}>` directly |
| Grad-CAM heatmap | `gradcam_heatmap` | `<img src={gradcam_heatmap}>` directly |
| SHAP overlay | `shap_overlay` | `<img src={shap_overlay}>` directly |
| Anatomical region | `gradcam_region` | "Model focused on: Lower Right" |
| XAI agreement | `xai_consensus` | "HIGH / MEDIUM / LOW confidence" |
| Region explanation | `gradcam_explanation` | 1-sentence anatomical context |
| Bullet findings | `explanation_points` | Render as ordered list, 5 items |
| LLM narrative | `clinical_narrative` | Full paragraph, italic/card style |
| Class probabilities | `all_probabilities` | Bar chart — `class` vs `probability` |
| SHAP values | `shap_values` | Horizontal bar chart — region importance |
| Quality status | `image_quality.passed` | Show warning if false before results |
| Quality message | `image_quality.message` | Error toast if passed=false |
| Severity score | `severity_score` | `/10` scale — progress bar or gauge |
| Modality | `modality` | Tag/badge: "Chest X-Ray", "MRI", etc. |
| Batch ensemble result | `ensemble_diagnosis` + `ensemble_confidence` | Batch results page header |
| Per-image batch cards | `individual_results[]` | One card per image with mini heatmap |
| Images rejected | `images_rejected` | Warning: "X images rejected — quality too low" |

