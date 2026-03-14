import cv2
import numpy as np
from typing import List, Optional, Tuple


class MedicalAnnotator:
    """
    Draws geometric annotations only — no text baked into pixels.
    Text/labels are handled by the frontend using annotation_data coordinates.
    """

    _RISK_RGB      = {"HIGH": (220, 50, 50), "MODERATE": (230, 160, 30), "LOW": (50, 200, 80)}
    _YELLOW        = (255, 230, 50)
    _CYAN          = (50,  220, 220)
    _GREY          = (180, 180, 180)
    _DEFAULT_C     = (180, 180, 180)
    _CONSENSUS_RGB = {"high": (50, 200, 80), "medium": (230, 160, 30), "low": (220, 50, 50)}

    # ── Public entry point ────────────────────────────────────────────────────
    def annotate_all(
        self,
        orig_np:             np.ndarray,
        gc_overlay:          np.ndarray,
        shap_overlay:        np.ndarray,
        cam:                 np.ndarray,
        attr_map:            np.ndarray,
        shap_vals:           List[dict],
        diagnosis_label:     str,
        confidence:          float,
        risk_level:          str,
        gc_region:           str,
        gradcam_explanation: str,
        xai_consensus:       str,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        ann_orig = self._annotate_original(orig_np.copy(), cam, risk_level)
        ann_gcam = self._annotate_gradcam(gc_overlay.copy(), cam, xai_consensus)
        ann_shap = self._annotate_shap(shap_overlay.copy(), shap_vals)
        return ann_orig, ann_gcam, ann_shap

    # ── Annotated Original — box + corner ticks only ──────────────────────────
    def _annotate_original(
        self,
        img:       np.ndarray,
        cam:       np.ndarray,
        risk_level: str,
    ) -> np.ndarray:
        color = self._RISK_RGB.get(risk_level, self._DEFAULT_C)
        bbox  = self._cam_bbox(cam)

        if bbox:
            x, y, w, h = bbox

            # Thin full box
            cv2.rectangle(img, (x, y), (x + w, y + h), color, 1)

            # Clinical corner ticks
            tick = max(6, min(w // 4, h // 4, 14))
            for (px, py), (dx, dy) in [
                ((x,     y    ), ( 1,  0)), ((x,     y    ), ( 0,  1)),
                ((x + w, y    ), (-1,  0)), ((x + w, y    ), ( 0,  1)),
                ((x,     y + h), ( 1,  0)), ((x,     y + h), ( 0, -1)),
                ((x + w, y + h), (-1,  0)), ((x + w, y + h), ( 0, -1)),
            ]:
                cv2.line(img, (px, py), (px + dx * tick, py + dy * tick), color, 2)

        return img

    # ── Annotated Grad-CAM — crosshair + box only ────────────────────────────
    def _annotate_gradcam(
        self,
        img:          np.ndarray,
        cam:          np.ndarray,
        xai_consensus: str,
    ) -> np.ndarray:
        # Crosshair at peak activation point
        peak_y, peak_x = np.unravel_index(np.argmax(cam), cam.shape)
        c_color = self._CONSENSUS_RGB.get(xai_consensus, self._YELLOW)
        cv2.drawMarker(
            img, (int(peak_x), int(peak_y)),
            c_color, cv2.MARKER_CROSS, 14, 1, cv2.LINE_AA,
        )

        # Bounding box
        bbox = self._cam_bbox(cam)
        if bbox:
            x, y, w, h = bbox
            cv2.rectangle(img, (x, y), (x + w, y + h), self._YELLOW, 1)

        return img

    # ── Annotated SHAP — quadrant grid lines only ────────────────────────────
    def _annotate_shap(
        self,
        img:       np.ndarray,
        shap_vals: List[dict],
    ) -> np.ndarray:
        H, W  = img.shape[:2]
        mid_h = H // 2
        mid_w = W // 2

        # Faint quadrant divider lines
        cv2.line(img, (mid_w, 0), (mid_w, H), self._GREY, 1)
        cv2.line(img, (0, mid_h), (W, mid_h), self._GREY, 1)

        # Small filled circle at center of top attribution quadrant only
        if shap_vals:
            quad_centers = {
                "Upper Left":  (W // 4,     H // 4),
                "Upper Right": (3 * W // 4, H // 4),
                "Lower Left":  (W // 4,     3 * H // 4),
                "Lower Right": (3 * W // 4, 3 * H // 4),
            }
            top_region = shap_vals[0]["region_name"]
            center     = quad_centers.get(top_region)
            if center:
                cv2.circle(img, center, 5, self._CYAN, -1)

        return img

    # ── Coordinate data for frontend pins ────────────────────────────────────
    def get_annotation_data(
        self,
        cam:                 np.ndarray,
        shap_vals:           List[dict],
        gc_region:           str,
        gradcam_explanation: str,
        confidence:          float,
        risk_level:          str,
    ) -> dict:
        H, W = cam.shape

        peak_y, peak_x = np.unravel_index(np.argmax(cam), cam.shape)
        norm_px = round(float(peak_x) / W, 4)
        norm_py = round(float(peak_y) / H, 4)

        bbox = None
        raw_bbox = self._cam_bbox(cam)
        if raw_bbox:
            x, y, w, h = raw_bbox
            bbox = {
                "x":      round(x / W, 4),
                "y":      round(y / H, 4),
                "width":  round(w / W, 4),
                "height": round(h / H, 4),
            }

        risk_hex = {"HIGH": "#DC3232", "MODERATE": "#E6A01E", "LOW": "#32C850"}

        quad_centers = {
            "Upper Left":  (0.25, 0.25),
            "Upper Right": (0.75, 0.25),
            "Lower Left":  (0.25, 0.75),
            "Lower Right": (0.75, 0.75),
        }

        shap_quadrants = []
        for sv in shap_vals[:4]:
            cx, cy = quad_centers.get(sv["region_name"], (0.5, 0.5))
            shap_quadrants.append({
                "region_name": sv["region_name"],
                "value":       sv["value"],
                "pct":         f"{sv['value'] * 100:.1f}%",
                "norm_x":      cx,
                "norm_y":      cy,
            })

        return {
            "gradcam_pin": {
                "peak_x":            norm_px,
                "peak_y":            norm_py,
                "bbox":              bbox,
                "region_label":      gc_region,
                "short_explanation": self._truncate(gradcam_explanation, 80),
                "full_explanation":  gradcam_explanation,
                "confidence_pct":    f"{confidence * 100:.1f}%",
                "risk_level":        risk_level,
                "risk_color":        risk_hex.get(risk_level, "#AAAAAA"),
            },
            "shap_quadrants": shap_quadrants,
        }

    # ── Helpers ───────────────────────────────────────────────────────────────
    @staticmethod
    def _cam_bbox(cam: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        for threshold in (cam.max() * 0.5, cam.mean()):
            mask        = (cam >= max(threshold, 0.01)).astype(np.uint8) * 255
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                           cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                largest = max(contours, key=cv2.contourArea)
                x, y, w, h = cv2.boundingRect(largest)
                if w >= 10 and h >= 10:
                    return x, y, w, h
        return None

    @staticmethod
    def _truncate(text: str, n: int) -> str:
        if len(text) <= n:
            return text
        return text[:n].rsplit(" ", 1)[0] + "…"
