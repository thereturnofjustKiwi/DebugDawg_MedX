import numpy as np


class SeverityCalculator:
    """
    Severity score 1.0 – 10.0.
    Formula: weighted combination of Grad-CAM top-20% intensity,
             model confidence, and high-activation coverage.
    """

    def compute(self, cam: np.ndarray, confidence: float) -> float:
        flat = cam.flatten()
        top_pixels = flat[flat >= np.percentile(flat, 80)]
        intensity = float(top_pixels.mean()) if len(top_pixels) > 0 else 0.0
        coverage = float((cam > 0.5).mean())

        raw = 0.50 * intensity + 0.30 * confidence + 0.20 * coverage
        return round(max(1.0, min(10.0, 1.0 + raw * 9.0)), 1)