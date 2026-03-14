class XAIConsensusChecker:
    """
    Compare GradCAM region vs attribution region.
    high   → exact match
    medium → same vertical or horizontal half
    low    → divergent
    """

    _VERT = {
        "Upper Left": "upper", "Upper Right": "upper", "Upper Middle": "upper",
        "Lower Left": "lower", "Lower Right": "lower", "Lower Middle": "lower",
        "Middle Left": "mid",  "Middle Right": "mid",
    }
    _HORIZ = {
        "Upper Left": "left",  "Lower Left": "left",  "Middle Left": "left",
        "Upper Right": "right","Lower Right": "right","Middle Right": "right",
    }

    def check(self, gradcam_region: str, shap_region: str) -> str:
        if gradcam_region == shap_region:
            return "high"
        gc_v, gc_h = self._VERT.get(gradcam_region), self._HORIZ.get(gradcam_region)
        sh_v, sh_h = self._VERT.get(shap_region),    self._HORIZ.get(shap_region)
        if (gc_v and gc_v == sh_v) or (gc_h and gc_h == sh_h):
            return "medium"
        return "low"
