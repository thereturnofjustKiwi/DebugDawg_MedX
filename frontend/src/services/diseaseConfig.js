/**
 * diseaseConfig.js
 * Single source of truth for disease options.
 * The `id` field is the EXACT key the backend expects.
 * Derived from MODEL_REGISTRY in backend/app/models/registry.py.
 */

export const DISEASE_OPTIONS = [
  {
    id: 'pneumonia',
    label: 'Pneumonia',
    emoji: '🫁',
    modality: 'Chest X-Ray',
    description: 'Bacterial or viral pneumonia from chest radiography',
  },
  {
    id: 'braintumor',
    label: 'Brain Tumor',
    emoji: '🧠',
    modality: 'MRI',
    description: 'Glioma, meningioma, pituitary, or no tumor from MRI',
  },
  {
    id: 'skincancer',
    label: 'Skin Cancer',
    emoji: '🔬',
    modality: 'Dermoscopy',
    description: 'Melanoma, basal cell carcinoma, nevi and more (HAM10000)',
  },
  {
    id: 'lungcolon',
    label: 'Lung & Colon Cancer',
    emoji: '🫀',
    modality: 'Histopathology',
    description: 'Lung adenocarcinoma, squamous cell carcinoma, colon cancer',
  },
  {
    id: 'retina',
    label: 'Diabetic Retinopathy',
    emoji: '👁️',
    modality: 'Fundus Photography',
    description: 'Retinal disease detection from fundus photography',
  },
];

/**
 * Look up display label for a disease ID.
 * Falls back to the raw id if not found.
 */
export function getDiseaseLabel(id) {
  const found = DISEASE_OPTIONS.find((d) => d.id === id);
  return found ? found.label : id;
}

/**
 * Look up modality string for a disease ID.
 */
export function getDiseaseModality(id) {
  const found = DISEASE_OPTIONS.find((d) => d.id === id);
  return found ? found.modality : '';
}

/**
 * Validate that a disease_type string is one the backend accepts.
 */
export function isValidDiseaseType(id) {
  return DISEASE_OPTIONS.some((d) => d.id === id);
}
