"""
Rule-based GradCAM region explanation generator.
Produces human-readable, disease-specific anatomical context
for each activation region — no LLM needed, instant, no API cost.
"""

from typing import List

# ── Per-disease, per-region anatomical explanations ──────────────────────────
REGION_EXPLANATIONS: dict[str, dict[str, str]] = {
    "pneumonia": {
        "Upper Left":   "The model focused on the upper-left lung zone. Apical involvement may suggest atypical or TB-related pneumonia.",
        "Upper Right":  "Activation in the upper-right lung zone. Right upper lobe consolidation can indicate Klebsiella or aspiration pneumonia.",
        "Lower Left":   "The lower-left lung zone was highlighted — a common site for community-acquired bacterial pneumonia consolidation.",
        "Lower Right":  "The lower-right lung lobe showed peak activation — the most frequent anatomical site for lobar pneumonia.",
        "Middle Left":  "Mid-zone left lung activation detected. May suggest peri-hilar infiltrate or left middle lobe involvement.",
        "Middle Right": "Mid-zone right lung activation. Consistent with right middle lobe pneumonia or perihilar consolidation.",
        "Diffuse":      "Activation is distributed across multiple lung zones, suggesting bilateral or diffuse pulmonary involvement.",
    },
    "braintumor": {
        "Upper Left":   "The model identified suspicious features in the left cerebral cortex — possible involvement of the frontal or parietal lobe.",
        "Upper Right":  "Right cerebral hemisphere activation detected, suggesting potential lesion in the right frontal or parietal region.",
        "Lower Left":   "Lower-left brain region highlighted, indicating possible temporal or occipital lobe involvement on the left side.",
        "Lower Right":  "Lower-right brain activation detected. May indicate lesion in the right temporal, occipital, or cerebellar region.",
        "Middle Left":  "Central-left brain activation may indicate involvement near the basal ganglia or thalamus on the left side.",
        "Middle Right": "Central-right activation may suggest a lesion near the right thalamus, basal ganglia, or midbrain.",
        "Diffuse":      "Widespread brain activation detected. May suggest a diffuse glioma or multifocal lesion.",
    },
    "skincancer": {
        "Upper Left":   "The model focused on the upper-left region of the lesion — asymmetric border or pigmentation patterns detected.",
        "Upper Right":  "Upper-right lesion activation detected. Irregular surface texture or atypical pigmentation noted in this zone.",
        "Lower Left":   "Lower-left lesion area highlighted. Unusual vascular structures or regression zones may be present.",
        "Lower Right":  "Lower-right lesion activation. Dermoscopic features like blue-white veil or atypical network detected.",
        "Middle Left":  "Central-left lesion activation suggests possible radial growth pattern or central regression.",
        "Middle Right": "Central-right lesion features activated — potential atypical pigment network or central hyperpigmentation.",
        "Diffuse":      "Activation across the entire lesion suggests global structural atypia or widespread dermoscopic irregularity.",
    },
    "lungcolon": {
        "Upper Left":   "Upper-left tissue region activated — may indicate irregular glandular structures or stromal invasion in this zone.",
        "Upper Right":  "Upper-right histological region highlighted. Abnormal cellular architecture or mitotic activity detected.",
        "Lower Left":   "Lower-left tissue activation — possible mucin production or tumor nests in the lower section of the slide.",
        "Lower Right":  "Lower-right region shows peak activation. Irregular gland formation or nuclear atypia likely detected here.",
        "Middle Left":  "Mid-tissue left zone highlighted. May indicate perineural invasion or lymphovascular involvement.",
        "Middle Right": "Mid-tissue right zone activation suggests abnormal epithelial patterns or stromal desmoplasia.",
        "Diffuse":      "Widespread tissue activation across the histological slide suggests diffuse cellular atypia or sheet-like growth.",
    },
    "bonefracture": {
        "Upper Left":   "Activation in the upper-left region suggests possible fracture in the shoulder, clavicle, or proximal humerus.",
        "Upper Right":  "Upper-right zone activation indicates potential fracture in the right shoulder or upper arm region.",
        "Lower Left":   "Lower-left activation detected — possible fracture in the left wrist, radius, or distal forearm.",
        "Lower Right":  "Lower-right focus may indicate fracture in the right wrist, hand, or distal radius.",
        "Middle Left":  "Mid-zone left activation — possible fracture in the left elbow, mid-shaft femur, or tibia.",
        "Middle Right": "Mid-zone right activation — possible fracture in the right elbow joint or mid-shaft long bone.",
        "Diffuse":      "Widespread activation detected — may indicate comminuted fracture or multiple fracture lines across the bone.",
    },
}

_DEFAULT_EXPLANATION = "The model identified imaging features in this region that were statistically associated with the predicted diagnosis."


def get_gradcam_explanation(disease_type: str, gradcam_region: str) -> str:
    """Return anatomically-specific explanation for this disease + activation region."""
    disease_map = REGION_EXPLANATIONS.get(disease_type, {})
    return disease_map.get(gradcam_region, _DEFAULT_EXPLANATION)


def get_explanation_points(
    disease_type: str,
    diagnosis_label: str,
    confidence: float,
    severity: float,
    xai_consensus: str,
    gradcam_region: str,
    shap_region: str,
    risk_level: str,
) -> List[str]:
    """
    Generate structured bullet-point findings for the Explanation Panel.
    Purely rule-based — instant, no API cost, always available.
    """
    points = []

    # 1. Primary finding
    points.append(f"Primary finding: {diagnosis_label} with {confidence*100:.1f}% model confidence.")

    # 2. Anatomical focus
    region_exp = get_gradcam_explanation(disease_type, gradcam_region)
    points.append(f"Anatomical focus: {region_exp}")

    # 3. XAI agreement
    consensus_text = {
        "high":   f"Both Grad-CAM and attribution analysis agree on the {gradcam_region} region — model certainty is high.",
        "medium": f"Grad-CAM highlights {gradcam_region} while attribution analysis suggests {shap_region} — partial agreement indicates moderate certainty.",
        "low":    f"Grad-CAM ({gradcam_region}) and attribution ({shap_region}) disagree — model is uncertain. Independent clinical review is strongly advised.",
    }
    points.append(f"XAI agreement: {consensus_text.get(xai_consensus, 'XAI methods evaluated.')}")

    # 4. Severity context
    if severity >= 7.0:
        points.append(f"Severity score {severity}/10 — activation intensity indicates significant imaging abnormality in the highlighted region.")
    elif severity >= 4.0:
        points.append(f"Severity score {severity}/10 — moderate activation intensity detected. Findings warrant clinical attention.")
    else:
        points.append(f"Severity score {severity}/10 — low activation intensity. Findings may represent early-stage or subtle pathology.")

    # 5. Risk recommendation
    risk_recs = {
        "HIGH":     "Clinical action recommended: refer for specialist consultation and confirmatory testing.",
        "MODERATE": "Clinical review advised: correlate findings with patient history and symptoms.",
        "LOW":      "Low risk: routine follow-up recommended. Monitor for symptom progression.",
    }
    points.append(f"Recommendation: {risk_recs.get(risk_level, 'Consult a qualified clinician.')}")

    return points
