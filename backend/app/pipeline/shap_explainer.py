import logging
from pathlib import Path
from typing import List, Optional, Tuple

import cv2
import numpy as np
import torch

logger = logging.getLogger(__name__)


class SHAPExplainer:
    """
    Attribution via:
      • SHAP DeepExplainer   — when background_samples/<disease>_background.pt exists
      • Integrated Gradients — automatic fallback (no background needed, theoretically rigorous)

    Both produce identical output shape → transparent swap, no API changes.
    """

    def __init__(
        self,
        model: torch.nn.Module,
        disease_type: str,
        device: torch.device,
        background_dir: Optional[Path] = None,
    ):
        self.model = model
        self.device = device
        self._use_shap = False
        self._explainer = None

        if background_dir and background_dir.exists():
            bg_file = background_dir / f"{disease_type}_background.pt"
            if bg_file.exists():
                try:
                    import shap
                    bg = torch.load(bg_file, map_location=device)
                    self.model.eval()
                    self._explainer = shap.DeepExplainer(self.model, bg)
                    self._use_shap = True
                    logger.info(f"[{disease_type}] SHAP DeepExplainer initialized.")
                except Exception as e:
                    logger.warning(f"[{disease_type}] SHAP init failed ({e}) → Integrated Gradients")

        if not self._use_shap:
            logger.info(f"[{disease_type}] Using Integrated Gradients (no background samples).")

    def explain(
        self, input_tensor: torch.Tensor, class_idx: int
    ) -> Tuple[np.ndarray, List[dict]]:
        """
        Returns:
            attr_map   : normalized attribution [0,1], shape (224, 224)
            shap_values: list of {region_name, value} sorted by importance
        """
        if self._use_shap:
            return self._shap_explain(input_tensor, class_idx)
        return self._integrated_gradients(input_tensor, class_idx)

    # ------------------------------------------------------------------ #
    def _shap_explain(
        self, input_tensor: torch.Tensor, class_idx: int
    ) -> Tuple[np.ndarray, List[dict]]:
        try:
            self.model.eval()
            shap_vals = self._explainer.shap_values(input_tensor)
            class_map = shap_vals[class_idx][0]                     # (3, H, W)
            attr_map = np.mean(np.abs(class_map), axis=0)
            if attr_map.max() > 0:
                attr_map = (attr_map - attr_map.min()) / (attr_map.max() - attr_map.min() + 1e-8)
            return attr_map, self._regional_values(class_map)
        except Exception as e:
            logger.error(f"SHAP explain error: {e}")
            return np.zeros((224, 224)), []

    # ------------------------------------------------------------------ #
    def _integrated_gradients(
        self, input_tensor: torch.Tensor, class_idx: int, steps: int = 30
    ) -> Tuple[np.ndarray, List[dict]]:
        """Integrated Gradients: IG = (x - x') * (1/steps) * Σ ∇f(x' + α(x-x'))"""
        try:
            baseline = torch.zeros_like(input_tensor).to(self.device)
            inp_np = input_tensor.detach().cpu().numpy()[0]
            grads = []

            self.model.eval()
            for i in range(steps + 1):
                alpha = float(i) / steps
                scaled = (baseline + alpha * (input_tensor - baseline)).to(self.device)
                scaled = scaled.requires_grad_(True)
                out = self.model(scaled)
                self.model.zero_grad()
                one_hot = torch.zeros_like(out)
                one_hot[0, class_idx] = 1.0
                out.backward(gradient=one_hot)
                grads.append(scaled.grad.detach().cpu().numpy()[0])  # (3,224,224)

            avg_grads = np.mean(grads, axis=0)                       # (3,224,224)
            ig = avg_grads * (inp_np - np.zeros_like(inp_np))        # (3,224,224)

            attr_map = np.mean(np.abs(ig), axis=0)
            if attr_map.max() > 0:
                attr_map = (attr_map - attr_map.min()) / (attr_map.max() - attr_map.min() + 1e-8)

            return attr_map, self._regional_values(ig)
        except Exception as e:
            logger.error(f"Integrated Gradients error: {e}")
            return np.zeros((224, 224)), []

    # ------------------------------------------------------------------ #
    def _regional_values(self, attr_3c: np.ndarray) -> List[dict]:
        """Quadrant-level attribution summary."""
        agg = attr_3c.mean(axis=0)         # (H, W)
        H, W = agg.shape
        quads = {
            "Upper Left":  agg[: H // 2, : W // 2],
            "Upper Right": agg[: H // 2, W // 2 :],
            "Lower Left":  agg[H // 2 :, : W // 2],
            "Lower Right": agg[H // 2 :, W // 2 :],
        }
        result = [{"region_name": k, "value": float(v.mean())} for k, v in quads.items()]
        total = sum(abs(r["value"]) for r in result) + 1e-8
        for r in result:
            r["value"] = round(r["value"] / total, 4)
        result.sort(key=lambda x: abs(x["value"]), reverse=True)
        return result

    def to_overlay(self, attr_map: np.ndarray, original_rgb: np.ndarray) -> np.ndarray:
        hot = cv2.applyColorMap((attr_map * 255).astype(np.uint8), cv2.COLORMAP_HOT)
        hot_rgb = cv2.cvtColor(hot, cv2.COLOR_BGR2RGB)
        return cv2.addWeighted(original_rgb, 0.5, hot_rgb, 0.5, 0)
