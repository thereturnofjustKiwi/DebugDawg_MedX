import base64
import io
import logging
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms
from .annotator import MedicalAnnotator
from torchvision.models import EfficientNet_B0_Weights, efficientnet_b0

from ..models.registry import MODEL_REGISTRY
from .gradcam import GradCAMExtractor
from .severity import SeverityCalculator
from .shap_explainer import SHAPExplainer
from .xai_consensus import XAIConsensusChecker
from .explanation import get_gradcam_explanation, get_explanation_points

logger = logging.getLogger(__name__)

LABEL_MAP = {
    # Pneumonia (Kaggle — UPPERCASE folders)
    "NORMAL":           "Normal — No Disease Detected",
    "PNEUMONIA":        "Pneumonia Detected",
    # Brain Tumor
    "notumor":          "Normal — No Tumor Detected",
    "glioma":           "Glioma Detected",
    "meningioma":       "Meningioma Detected",
    "pituitary":        "Pituitary Tumor Detected",
    # Skin Cancer (HAM10000)
    "mel":              "Melanoma Detected",
    "nv":               "Melanocytic Nevi (Benign)",
    "bcc":              "Basal Cell Carcinoma Detected",
    "akiec":            "Actinic Keratosis / Intraepithelial Carcinoma",
    "bkl":              "Benign Keratosis-like Lesion",
    "df":               "Dermatofibroma",
    "vasc":             "Vascular Lesion",
    # Lung & Colon Cancer
    "colon_aca":        "Colon Adenocarcinoma Detected",
    "colon_n":          "Normal Colon Tissue",
    "lung_aca":         "Lung Adenocarcinoma Detected",
    "lung_n":           "Normal Lung Tissue",
    "lung_scc":         "Lung Squamous Cell Carcinoma Detected",
    # Retina
    "normal":           "Normal — No Retinal Disease Detected",
    "Retinal Disease":  "Diabetic Retinopathy / Retinal Disease Detected",
    "Fractured":            "Bone Fracture Detected",
    "Non-Fractured":        "Normal — No Fracture Detected",
}                        # ← closing brace was missing



class MedicalAIPipeline:

    def __init__(
        self,
        disease_type: str,
        device: torch.device,
        background_dir: Optional[Path] = None,
    ):
        if disease_type not in MODEL_REGISTRY:
            raise ValueError(f"Unknown disease_type: '{disease_type}'")

        self.disease_type = disease_type
        self.device = device
        self.infer_transform = None

        cfg = MODEL_REGISTRY[disease_type]
        self.classes: List[str] = list(cfg["classes"])
        self.modality: str = cfg["modality"]

        self.model = self._load_model(Path(cfg["path"]), cfg["num_classes"])
        self.gradcam = GradCAMExtractor(self.model, device)
        self.shap = SHAPExplainer(self.model, disease_type, device, background_dir)
        self.severity_calc = SeverityCalculator()
        self.consensus = XAIConsensusChecker()
        self.annotator = MedicalAnnotator()


    # ------------------------------------------------------------------ #
    def _build_transform(self, mean: list, std: list):
        self.infer_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=mean, std=std),
        ])

    @staticmethod
    def _get_risk_level(confidence: float, diagnosis_label: str) -> tuple[str, str]:
        """
        Returns (risk_level, risk_reason).
        Normal/benign predictions are always LOW regardless of confidence.
        """
        is_normal = any(word in diagnosis_label.lower() for word in ["normal", "benign", "no disease", "no tumor"])

        if is_normal:
            return "LOW", "Prediction indicates no pathology detected with sufficient confidence."

        if confidence >= 0.90:
            return "HIGH", f"Model confidence of {confidence*100:.1f}% strongly indicates pathological findings. Immediate clinical correlation recommended."
        elif confidence >= 0.70:
            return "MODERATE", f"Model confidence of {confidence*100:.1f}% suggests probable pathology. Clinical review advised."
        else:
            return "LOW", f"Model confidence of {confidence*100:.1f}% is below threshold. Findings are inconclusive — repeat imaging or specialist review recommended."

    # ------------------------------------------------------------------ #
    def _build_arch_from_state_dict(self, state_dict: dict, num_classes: int) -> nn.Module:
        model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
        in_features = model.classifier[1].in_features  # always 1280

        keys = list(state_dict.keys())

        # Pattern A — Nested Sequential: classifier.1.0.weight
        if any(k == "classifier.1.0.weight" for k in keys):
            hidden = state_dict["classifier.1.0.weight"].shape[0]
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.4),
                nn.Sequential(
                    nn.Linear(in_features, hidden),
                    nn.ReLU(),
                    nn.Dropout(p=0.2),
                    nn.Linear(hidden, num_classes),
                ),
            )
            logger.info(f"[{self.disease_type}] Arch → Nested Sequential (hidden={hidden})")

        # Pattern E — BatchNorm head (MUST check before Pattern B)
        # Keys: classifier.0.weight (Linear), classifier.1.running_mean (BatchNorm)
        elif "classifier.0.weight" in keys and "classifier.1.running_mean" in keys:
            hidden = state_dict["classifier.0.weight"].shape[0]
            model.classifier = nn.Sequential(
                nn.Linear(in_features, hidden),
                nn.BatchNorm1d(hidden),
                nn.ReLU(),
                nn.Dropout(p=0.4),
                nn.Linear(hidden, num_classes),
            )
            logger.info(f"[{self.disease_type}] Arch → BatchNorm head (hidden={hidden})")

        # Pattern B — Flat Sequential: Dropout→Linear→ReLU→Dropout→Linear
        # classifier.1.weight is Linear (shape [hidden, 1280]), classifier.4.weight exists
        elif "classifier.1.weight" in keys and "classifier.4.weight" in keys:
            hidden = state_dict["classifier.1.weight"].shape[0]
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.4),
                nn.Linear(in_features, hidden),
                nn.ReLU(),
                nn.Dropout(p=0.2),
                nn.Linear(hidden, num_classes),
            )
            logger.info(f"[{self.disease_type}] Arch → Flat Sequential (hidden={hidden})")

        # Pattern D — Single Linear head only
        elif "classifier.1.weight" in keys and "classifier.4.weight" not in keys:
            out_features = state_dict["classifier.1.weight"].shape[0]
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.2),
                nn.Linear(in_features, out_features),
            )
            logger.info(f"[{self.disease_type}] Arch → Single Linear head (out={out_features})")

        # Pattern C — fallback
        else:
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.4),
                nn.Linear(in_features, 256),
                nn.ReLU(),
                nn.Dropout(p=0.2),
                nn.Linear(256, num_classes),
            )
            logger.info(f"[{self.disease_type}] Arch → Default flat head (hidden=256)")

        return model



    def _build_default_arch(self, num_classes: int) -> nn.Module:
        model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes),
        )
        return model

    # ------------------------------------------------------------------ #
    def _load_model(self, path: Path, num_classes: int) -> nn.Module:
        if not path.exists():
            logger.warning(f"[{self.disease_type}] Weights not found at {path} — using random weights.")
            self._build_transform([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            return self._build_default_arch(num_classes).to(self.device).eval()

        ckpt = torch.load(path, map_location=self.device, weights_only=False)
        state_dict = ckpt.get("model_state_dict", ckpt)

        mean = ckpt.get("normalize_mean", [0.485, 0.456, 0.406])
        std  = ckpt.get("normalize_std",  [0.229, 0.224, 0.225])
        self._build_transform(mean, std)
        logger.info(f"[{self.disease_type}] Norm mean={mean} std={std}")

        if isinstance(ckpt, dict):
            num_classes = ckpt.get("num_classes", num_classes)
            if "classes" in ckpt:
                self.classes = list(ckpt["classes"])

        model = self._build_arch_from_state_dict(state_dict, num_classes)
        model.load_state_dict(state_dict)
        model = model.to(self.device).eval()
        logger.info(f"[{self.disease_type}] ✓ Loaded from {path}")
        return model

    # ------------------------------------------------------------------ #
    @staticmethod
    def _get_risk_level(confidence: float, diagnosis_label: str) -> tuple:
        is_normal = any(w in diagnosis_label.lower() for w in ["normal", "benign", "no disease", "no tumor", "no retinal"])
        if is_normal:
            return "LOW", "Prediction indicates no pathology detected with sufficient confidence."
        if confidence >= 0.90:
            return "HIGH", f"Model confidence of {confidence*100:.1f}% strongly indicates pathological findings. Immediate clinical correlation recommended."
        elif confidence >= 0.70:
            return "MODERATE", f"Model confidence of {confidence*100:.1f}% suggests probable pathology. Clinical review advised."
        else:
            return "LOW", f"Model confidence of {confidence*100:.1f}% is below threshold. Findings inconclusive — repeat imaging recommended."

    # ------------------------------------------------------------------ #
    def analyze(self, image: Image.Image) -> dict:
        img_rgb = image.convert("RGB")
        img_224 = img_rgb.resize((224, 224))
        orig_np = np.array(img_224)

        tensor = self.infer_transform(img_rgb).unsqueeze(0).to(self.device)

        # 1. Predict
        self.model.eval()
        with torch.no_grad():
            probs = F.softmax(self.model(tensor), dim=1)[0]

        conf_val, idx_val = torch.max(probs, 0)
        class_name = self.classes[idx_val.item()]
        confidence = float(conf_val.item())
        class_idx  = idx_val.item()

        all_probs = [
            {"class": c, "probability": round(float(p.item()), 4)}
            for c, p in zip(self.classes, probs)
        ]

        diagnosis_label = LABEL_MAP.get(class_name, class_name.replace("_", " ").title())

        # 2. Grad-CAM
        cam        = self.gradcam.generate(tensor, class_idx)
        gc_region  = self.gradcam.get_region(cam)
        gc_overlay = self.gradcam.to_overlay(cam, orig_np)

        # 3. SHAP / Integrated Gradients
        attr_map, shap_vals = self.shap.explain(tensor, class_idx)
        shap_region  = shap_vals[0]["region_name"] if shap_vals else "Diffuse"
        shap_overlay = self.shap.to_overlay(attr_map, orig_np)

        # 4. Severity
        severity = self.severity_calc.compute(cam, confidence)

        # 5. XAI Consensus
        xai_consensus = self.consensus.check(gc_region, shap_region)

        # ── NEW: Smart Annotation ──────────────────────────────────────────
        # Run BEFORE risk_level so we can pass risk_level into annotator.
        # We compute risk_level early here just for annotation color.
        _risk_tmp, _ = self._get_risk_level(
            confidence, LABEL_MAP.get(class_name, class_name)
        )
        ann_orig, ann_gcam, ann_shap = self.annotator.annotate_all(
            orig_np             = orig_np,
            gc_overlay          = gc_overlay,
            shap_overlay        = shap_overlay,
            cam                 = cam,
            attr_map            = attr_map,
            shap_vals           = shap_vals,
            diagnosis_label     = LABEL_MAP.get(class_name, class_name.replace("_", " ").title()),
            confidence          = confidence,
            risk_level          = _risk_tmp,
            gc_region           = gc_region,
            gradcam_explanation = get_gradcam_explanation(self.disease_type, gc_region),
            xai_consensus       = xai_consensus,
        )


        # NEW — raw coordinate data for frontend-rendered pins
        annotation_data = self.annotator.get_annotation_data(
            cam                 = cam,
            shap_vals           = shap_vals,
            gc_region           = gc_region,
            gradcam_explanation = get_gradcam_explanation(self.disease_type, gc_region),
            confidence          = confidence,
            risk_level          = _risk_tmp,
        )

        # 6. Risk level (Phase 1)
        risk_level, risk_reason = self._get_risk_level(confidence, LABEL_MAP.get(class_name, class_name))

        # 7. Explanation panel (Phase 3)
        gradcam_explanation = get_gradcam_explanation(self.disease_type, gc_region)
        explanation_points  = get_explanation_points(
            disease_type    = self.disease_type,
            diagnosis_label = LABEL_MAP.get(class_name, class_name),
            confidence      = confidence,
            severity        = severity,
            xai_consensus   = xai_consensus,
            gradcam_region  = gc_region,
            shap_region     = shap_region,
            risk_level      = risk_level,
        )

        return {
            "diagnosis_label":    diagnosis_label,
            "confidence_score":   round(confidence, 4),
            "severity_score":     severity,
            "risk_level":         risk_level,
            "risk_reason":        risk_reason,
            "original_image":     _img_to_b64(img_224),
            "gradcam_heatmap":    _arr_to_b64(gc_overlay),
            "shap_overlay":       _arr_to_b64(shap_overlay),
            "annotated_original":  _arr_to_b64(ann_orig),
            "annotated_gradcam":   _arr_to_b64(ann_gcam),
            "annotated_shap":      _arr_to_b64(ann_shap),
            "annotation_data": annotation_data,
            "gradcam_region":     gc_region,
            "shap_region":        shap_region,
            "xai_consensus":      xai_consensus,
            "shap_values":        shap_vals,
            "gradcam_explanation": gradcam_explanation,
            "explanation_points":  explanation_points,
            "all_probabilities":  all_probs,
            "disease_type":       self.disease_type,
            "modality":           self.modality,
        }


# ------------------------------------------------------------------ #
def _img_to_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _arr_to_b64(arr: np.ndarray) -> str:
    return _img_to_b64(Image.fromarray(arr.astype(np.uint8)))
