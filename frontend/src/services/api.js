/**
 * api.js
 *
 * Centralized API communication layer for ExplainableMed.
 * All backend HTTP calls go through this module.
 * Components must NOT call fetch() directly.
 *
 * Backend base URL: process.env.REACT_APP_API_URL (e.g. http://localhost:8000)
 * If not set, falls back to same-origin (useful when frontend is served by backend).
 */

import { mapAnalysisResponse } from './responseMapper';

const BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * Parse a backend error response into a user-readable error object.
 * Backend error shapes:
 *   400/413 → { detail: "string" }
 *   422     → { detail: { error, message, hint } }
 *   500     → { detail: "string" }
 */
async function parseApiError(response) {
  let detail = null;
  try {
    const json = await response.json();
    detail = json.detail;
  } catch {
    // Response body not JSON
  }

  // 422 image quality failure — structured detail
  if (response.status === 422 && detail && typeof detail === 'object') {
    return {
      code: detail.error || 'image_quality_failed',
      message: detail.message || 'Image quality check failed.',
      hint: detail.hint || 'Please upload a clearer, properly exposed scan.',
    };
  }

  // All other errors — string detail
  const msg =
    typeof detail === 'string'
      ? detail
      : `Server returned ${response.status}: ${response.statusText}`;

  const codeMap = {
    400: 'invalid_request',
    413: 'file_too_large',
    500: 'server_error',
  };

  return {
    code: codeMap[response.status] || 'api_error',
    message: msg,
    hint: null,
  };
}

/**
 * POST /api/analyze
 *
 * @param {File}   imageFile     - The image File object (JPG/PNG)
 * @param {string} diseaseType   - Backend disease key (e.g. 'pneumonia')
 * @param {number|null} patientAge
 * @param {string|null} patientGender
 * @returns {Promise<object>}    - Enriched analysis result (via responseMapper)
 * @throws {object}              - { code, message, hint }
 */
export async function analyzeImage({ imageFile, diseaseType, patientAge, patientGender }) {
  // ── Client-side pre-validation ──────────────────────────────────────────
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
  if (imageFile.size > MAX_BYTES) {
    throw {
      code: 'file_too_large',
      message: `File is ${(imageFile.size / 1024 / 1024).toFixed(1)} MB — maximum allowed is 10 MB.`,
      hint: 'Please compress or resize the image before uploading.',
    };
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!ALLOWED_TYPES.includes(imageFile.type)) {
    throw {
      code: 'invalid_file_type',
      message: `Unsupported file type '${imageFile.type}'. Only JPG and PNG are accepted.`,
      hint: 'Convert your image to JPG or PNG format and try again.',
    };
  }

  // ── Build multipart/form-data payload ───────────────────────────────────
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('disease_type', diseaseType);
  if (patientAge !== null && patientAge !== undefined && patientAge !== '') {
    formData.append('patient_age', Number(patientAge));
  }
  if (patientGender) {
    formData.append('patient_gender', patientGender);
  }

  // ── Send request ─────────────────────────────────────────────────────────
  let response;
  try {
    response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type header — browser sets it with boundary automatically
    });
  } catch (networkError) {
    throw {
      code: 'network_error',
      message: 'Unable to reach the backend server. Is it running on port 8000?',
      hint: 'Start the backend: uvicorn app.main:app --reload --port 8000',
    };
  }

  // ── Handle non-OK responses ───────────────────────────────────────────────
  if (!response.ok) {
    throw await parseApiError(response);
  }

  // ── Parse and enrich successful response ──────────────────────────────────
  const raw = await response.json();
  return mapAnalysisResponse(raw);
}

/**
 * GET /api/health
 * Returns pipeline health status.
 */
export async function getHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * GET /api/models  (documented in backend.md, returns MODEL_REGISTRY)
 * Fetches available disease models from backend.
 * Used to validate disease types against the live backend.
 */
export async function getModels() {
  try {
    const response = await fetch(`${BASE_URL}/api/models`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * POST /api/chat
 *
 * Sends conversation history + analysis context to Groq llama-3.3-70b-versatile.
 * The LLM is strictly scoped to the provided analysis result.
 *
 * @param {Array}  messages         - [{role:'user'|'assistant', content:string}]
 * @param {string} analysisContext  - stringified summary of the analysis result
 * @param {string} patientContext   - "Name: X · Age: Y · Gender: Z"
 * @returns {Promise<string>}        - LLM reply text
 * @throws {object}                  - { code, message }
 */
export async function chatWithLLM({ messages, analysisContext, patientContext }) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        analysis_context: analysisContext,
        patient_context: patientContext,
      }),
    });
  } catch {
    throw {
      code: 'network_error',
      message: 'Unable to reach the backend. Is it running on port 8000?',
    };
  }

  if (!response.ok) {
    const err = await parseApiError(response);
    throw err;
  }

  const data = await response.json();
  return data.reply;
}
