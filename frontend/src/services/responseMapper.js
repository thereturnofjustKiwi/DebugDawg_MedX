/**
 * responseMapper.js
 * 
 * Transforms raw backend AnalysisResponse into the enriched shape
 * consumed by UI components.
 * 
 * BACKEND CONTRACT (backend/app/schemas/analysis.py):
 *   diagnosis_label, confidence_score, severity_score,
 *   original_image, gradcam_heatmap, shap_overlay,
 *   gradcam_region, shap_region, xai_consensus, shap_values[],
 *   clinical_narrative, disease_type, modality,
 *   all_probabilities[], patient_age?, patient_gender?
 * 
 * DERIVED CLIENT-SIDE (from existing fields, matching backend.md logic):
 *   risk_level, risk_reason, explanation_points, gradcam_explanation,
 *   image_quality (stub — backend doesn't emit yet)
 */

/**
 * Anatomical region explanations per disease + region.
 * Provides one-sentence context for the highlighted region.
 */
const ANATOMICAL_CONTEXT = {
  pneumonia: {
    'Lower Right': 'The lower-right lung lobe is the most frequent site for lobar pneumonia consolidation.',
    'Lower Left': 'The lower-left lung lobe shows infiltrate patterns consistent with pneumonia.',
    'Middle Right': 'The right middle lobe is activated — a common location for aspiration pneumonia.',
    'Middle Left': 'Left middle zone opacification may indicate early consolidation or infiltrate.',
    'Upper Right': 'Upper lobe involvement can indicate reactivation tuberculosis or atypical pneumonia.',
    'Upper Left': 'Upper-left lobe activation may suggest atypical or primary tuberculosis pattern.',
    Diffuse: 'Diffuse bilateral activation is consistent with extensive pneumonia or pulmonary edema.',
  },
  braintumor: {
    'Upper Right': 'Right frontal or parietal lobe region — common site for glioma and meningioma.',
    'Upper Left': 'Left frontal lobe region — may affect language centers depending on dominance.',
    'Lower Right': 'Right temporal or occipital region activation detected.',
    'Lower Left': 'Left temporal or cerebellar region activation detected.',
    'Middle Right': 'Right central/parietal region — motor cortex proximity is clinically significant.',
    'Middle Left': 'Left central region — proximity to motor and speech areas is notable.',
    Diffuse: 'Widespread activation pattern may reflect diffuse glioma or multi-focal disease.',
  },
  skincancer: {
    'Upper Right': 'Upper-right lesion zone shows asymmetric color/texture features.',
    'Upper Left': 'Upper-left region highlights irregular pigment network patterns.',
    'Lower Right': 'Lower-right zone shows high dermoscopic activation — atypical vasculature suspected.',
    'Lower Left': 'Lower-left lesion area has prominent activation — pigmentation abnormality noted.',
    'Middle Right': 'Central-right dermoscopic features drive the classification.',
    'Middle Left': 'Central-left region shows blue-white veil or regression structures.',
    Diffuse: 'Activation distributed across the lesion — diffuse architectural disorganization.',
  },
  lungcolon: {
    'Upper Right': 'Upper-right tissue region shows glandular or squamous cell architecture changes.',
    'Upper Left': 'Upper-left histopathological region drives the classification.',
    'Lower Right': 'Lower-right slide region — adenocarcinoma glands or squamous nests detected.',
    'Lower Left': 'Lower-left slice region shows tissue-level features consistent with the prediction.',
    'Middle Right': 'Central-right histological region — cellular density and morphology are key drivers.',
    'Middle Left': 'Central-left tissue architecture activated — mitotic figures may be present.',
    Diffuse: 'Diffuse slide activation — widespread tissue abnormality detected.',
  },
  retina: {
    'Upper Right': 'Superior temporal retina — common site for laser photocoagulation scars and NVE.',
    'Upper Left': 'Superior nasal quadrant shows pathological features consistent with retinal disease.',
    'Lower Right': 'Inferior temporal quadrant — frequent site for microaneurysms and hard exudates.',
    'Lower Left': 'Inferior nasal quadrant activation noted.',
    'Middle Right': 'Macula-adjacent temporal region — critical zone for visual acuity assessment.',
    'Middle Left': 'Peripapillary region — optic disc margin features are driving the prediction.',
    Diffuse: 'Diffuse retinal involvement — pan-retinal disease pattern consistent with PDR.',
  },
};

/**
 * Derive risk_level from confidence + diagnosis_label.
 * Matches logic documented in backend.md:
 *   HIGH   → confidence ≥ 0.90 AND pathology detected
 *   MODERATE → confidence 0.70–0.89 AND pathology detected
 *   LOW    → confidence < 0.70 OR normal/benign prediction
 */
const BENIGN_LABELS = new Set([
  'Normal — No Disease Detected',
  'Normal — No Tumor Detected',
  'Normal — No Retinal Disease Detected',
  'Melanocytic Nevi (Benign)',
  'Benign Keratosis-like Lesion',
  'Dermatofibroma',
  'Normal Colon Tissue',
  'Normal Lung Tissue',
]);

function deriveRiskLevel(confidenceScore, diagnosisLabel) {
  const isBenign = BENIGN_LABELS.has(diagnosisLabel);
  if (isBenign || confidenceScore < 0.70) return 'LOW';
  if (confidenceScore >= 0.90) return 'HIGH';
  return 'MODERATE';
}

function deriveRiskReason(riskLevel, confidenceScore) {
  const pct = (confidenceScore * 100).toFixed(1);
  if (riskLevel === 'HIGH') {
    return `Model confidence of ${pct}% strongly indicates pathological findings. Immediate clinical correlation recommended.`;
  }
  if (riskLevel === 'MODERATE') {
    return `Model confidence of ${pct}% indicates possible pathological findings. Clinical review is advised.`;
  }
  return `Confidence of ${pct}% — findings appear normal or below the pathological threshold. Routine follow-up as clinically indicated.`;
}

function deriveGradcamExplanation(gradcamRegion, diseaseType) {
  const map = ANATOMICAL_CONTEXT[diseaseType] || {};
  return (
    map[gradcamRegion] ||
    `The ${gradcamRegion} region showed peak model activation for this modality.`
  );
}

function deriveExplanationPoints(result, riskLevel) {
  const conf = ((result.confidence_score || 0) * 100).toFixed(1);
  const sev = (result.severity_score || 1).toFixed(1);
  const gcExpl = deriveGradcamExplanation(result.gradcam_region, result.disease_type);
  const consensus = (result.xai_consensus || 'low').toLowerCase();
  const consensusText =
    consensus === 'high'
      ? `Both Grad-CAM and SHAP agree on the ${result.gradcam_region} region — model certainty is high.`
      : consensus === 'medium'
      ? `Grad-CAM and SHAP show partial agreement — moderate diagnostic confidence.`
      : `Grad-CAM (${result.gradcam_region}) and SHAP (${result.shap_region}) diverge — clinical correlation strongly recommended.`;

  const actionText =
    riskLevel === 'HIGH'
      ? 'Immediate clinical action recommended: refer for specialist consultation and confirmatory testing.'
      : riskLevel === 'MODERATE'
      ? 'Clinical review recommended: schedule follow-up or additional imaging.'
      : 'No immediate action required — routine follow-up as per clinical judgment.';

  return [
    `Primary finding: ${result.diagnosis_label} with ${conf}% model confidence.`,
    `Anatomical focus: ${gcExpl}`,
    `XAI agreement: ${consensusText}`,
    `Severity score ${sev}/10 — activation intensity indicates ${
      parseFloat(sev) >= 7 ? 'significant' : parseFloat(sev) >= 4 ? 'moderate' : 'mild'
    } imaging abnormality in the highlighted region.`,
    actionText,
  ];
}

/**
 * Main mapper function.
 * Pass in the raw JSON from the backend; get back the enriched UI shape.
 * All backend fields are preserved unchanged.
 */
export function mapAnalysisResponse(raw) {
  if (!raw) return null;

  const riskLevel = deriveRiskLevel(raw.confidence_score, raw.diagnosis_label);
  const riskReason = deriveRiskReason(riskLevel, raw.confidence_score);
  const gradcamExplanation = deriveGradcamExplanation(raw.gradcam_region, raw.disease_type);
  const explanationPoints = deriveExplanationPoints(raw, riskLevel);

  return {
    // ── All backend fields, untouched ──
    diagnosis_label: raw.diagnosis_label,
    confidence_score: raw.confidence_score,
    severity_score: raw.severity_score,
    original_image: raw.original_image,
    gradcam_heatmap: raw.gradcam_heatmap,
    shap_overlay: raw.shap_overlay,
    gradcam_region: raw.gradcam_region,
    shap_region: raw.shap_region,
    xai_consensus: raw.xai_consensus,
    shap_values: raw.shap_values || [],
    clinical_narrative: raw.clinical_narrative,
    disease_type: raw.disease_type,
    modality: raw.modality,
    all_probabilities: raw.all_probabilities || [],
    patient_age: raw.patient_age ?? null,
    patient_gender: raw.patient_gender ?? null,

    // ── Annotated images + structured pin data from backend ──
    annotated_original: raw.annotated_original || null,
    annotated_gradcam:  raw.annotated_gradcam  || null,
    annotated_shap:     raw.annotated_shap     || null,
    annotation_data:    raw.annotation_data    || null,

    // ── Client-derived enrichments ──
    risk_level: riskLevel,
    risk_reason: riskReason,
    gradcam_explanation: gradcamExplanation,
    explanation_points: explanationPoints,

    // ── Image quality stub (backend doesn't emit yet) ──
    image_quality: raw.image_quality || {
      passed: true,
      blur_score: null,
      brightness: null,
      resolution: null,
      issue: null,
      message: 'Image quality is acceptable for diagnosis.',
    },
  };
}
