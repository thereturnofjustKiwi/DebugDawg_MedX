import cv2
import numpy as np
from PIL import Image

from ..schemas.analysis import ImageQualityReport

# ── Modality-specific blur thresholds ─────────────────────────────────────────
# Variance of Laplacian scores differ massively across medical imaging types.
# Fundus/X-Ray score low by nature — don't penalize them with a photo threshold.
BLUR_THRESHOLDS: dict[str, float] = {
    "Fundus Photography": 15.0,    # large black border + soft retinal gradients
    "Chest X-Ray":        20.0,    # grayscale, low contrast by nature
    "MRI":                25.0,    # smooth tissue gradients
    "Dermoscopy":         60.0,    # color, detailed skin texture
    "Histopathology":     80.0,    # high-detail tissue slides
    "default":            50.0,    # fallback for unknown modalities
}

BRIGHTNESS_MIN  = 15.0     # very dark — lower than photos because X-rays are dark
BRIGHTNESS_MAX  = 240.0    # overexposed
MIN_DIMENSION   = 64       # minimum px per side


class ImageQualityChecker:
    """
    Pre-inference image quality gate.
    Uses modality-aware thresholds — fundus/X-ray images are NOT penalized
    for naturally lower sharpness scores.
    """

    def check(self, image: Image.Image, modality: str = "default") -> ImageQualityReport:
        img_rgb    = np.array(image.convert("RGB"))
        gray       = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        h, w       = gray.shape
        resolution = f"{w}x{h}"

        # 1. Resolution check
        if h < MIN_DIMENSION or w < MIN_DIMENSION:
            return ImageQualityReport(
                passed=False,
                blur_score=0.0,
                brightness=float(gray.mean()),
                resolution=resolution,
                issue="low_resolution",
                message=f"Image too small ({resolution}). Minimum: {MIN_DIMENSION}x{MIN_DIMENSION}px. Please upload a higher resolution scan.",
            )

        # 2. For fundus images — mask out the black circular border before measuring blur
        #    The dark border is ~30-40% of pixels and artificially crushes Laplacian variance
        if modality == "Fundus Photography":
            gray_for_blur = _crop_fundus_roi(gray)
        else:
            gray_for_blur = gray

        # 3. Blur check — variance of Laplacian on the relevant region
        blur_score       = float(cv2.Laplacian(gray_for_blur, cv2.CV_64F).var())
        blur_threshold   = BLUR_THRESHOLDS.get(modality, BLUR_THRESHOLDS["default"])

        # 4. Brightness check — use full image, not cropped
        brightness = float(gray.mean())

        # ── Evaluate in priority order ──
        if blur_score < blur_threshold:
            return ImageQualityReport(
                passed=False,
                blur_score=round(blur_score, 2),
                brightness=round(brightness, 2),
                resolution=resolution,
                issue="blurry",
                message=(
                    f"Image appears blurry or out of focus (sharpness score: {blur_score:.1f}, "
                    f"minimum for {modality}: {blur_threshold:.0f}). "
                    "Please upload a sharper, clearer scan for accurate diagnosis."
                ),
            )

        if brightness < BRIGHTNESS_MIN:
            return ImageQualityReport(
                passed=False,
                blur_score=round(blur_score, 2),
                brightness=round(brightness, 2),
                resolution=resolution,
                issue="too_dark",
                message="Image is too dark for reliable analysis. Please upload a properly exposed scan.",
            )

        if brightness > BRIGHTNESS_MAX:
            return ImageQualityReport(
                passed=False,
                blur_score=round(blur_score, 2),
                brightness=round(brightness, 2),
                resolution=resolution,
                issue="too_bright",
                message="Image is overexposed. Please upload a properly exposed scan.",
            )

        return ImageQualityReport(
            passed=True,
            blur_score=round(blur_score, 2),
            brightness=round(brightness, 2),
            resolution=resolution,
            issue=None,
            message="Image quality is acceptable for diagnosis.",
        )


def _crop_fundus_roi(gray: np.ndarray) -> np.ndarray:
    """
    For fundus images: extract only the circular retinal region,
    ignoring the black border that dominates ~30-40% of the frame.
    Uses Otsu threshold to find the bright retinal disc.
    Falls back to center 60% crop if thresholding fails.
    """
    try:
        _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        roi_pixels = gray[mask > 0]
        if len(roi_pixels) > 1000:          # enough pixels to compute meaningful variance
            # Reconstruct a 2D array of only ROI pixels for Laplacian
            # Best approach: apply mask and compute on masked image
            masked = cv2.bitwise_and(gray, gray, mask=mask)
            return masked
    except Exception:
        pass

    # Fallback: center 60% crop removes most border artifacts
    h, w = gray.shape
    margin_h = int(h * 0.2)
    margin_w = int(w * 0.2)
    return gray[margin_h: h - margin_h, margin_w: w - margin_w]
