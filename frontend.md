# Frontend-to-Backend Integration Specification

> **App**: ExplainableMed AI Platform
> **Base URL**: `process.env.REACT_APP_API_URL || ''` (defaults to same-origin)
> **Current state**: Only `POST /api/analyze` exists as an API call. All auth and patient data use `localStorage`. Endpoints marked 🟡 are **required for production** (currently client-only). Endpoints marked 🟢 are **already called from the frontend**.

---

## Table of Contents

1. [Authentication (Login / Register)](#1-authentication)
2. [Image Analysis Pipeline](#2-image-analysis-pipeline)
3. [Upload Wizard Controls](#3-upload-wizard-controls)
4. [Analysis Workspace](#4-analysis-workspace)
5. [Patient Management](#5-patient-management)
6. [Doctor Notes / Chat](#6-doctor-notes--chat)
7. [Report Generation](#7-report-generation)
8. [Contact Form](#8-contact-form)
9. [Navigation & UI State](#9-navigation--ui-state)

---

## 1. Authentication

**Source file**: [DoctorLogin.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/DoctorLogin.js) + [authStore.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/authStore.js)

### 1.1 🟡 Doctor Login

| Field | Value |
|---|---|
| **Element** | `<form onSubmit={handleSubmit}>` in [DoctorLogin.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/DoctorLogin.js) (line 171) |
| **Trigger** | Submit button click or Enter key |
| **Current behavior** | Calls `authStore.login(email, password)` — validates against `localStorage` |

**Required API endpoint**:

```
POST /api/auth/login
```

**Request**:
```json
Content-Type: application/json

{
  "email": "doctor@explainablemed.com",
  "password": "demo1234"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "token": "jwt-token-string",
  "doctor": {
    "id": "doc-001",
    "name": "Dr. Sarah Mitchell",
    "email": "doctor@explainablemed.com",
    "specialization": "Radiology",
    "avatar": "SM"
  }
}
```

**Error Response** (401):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Input Elements**:

| Input | ID/Ref | Type | Validation |
|---|---|---|---|
| Email | `input[type="email"]` | `email` | Required, HTML email validation |
| Password | `input[type="password"]` | `password` | Required, minLength=4 |
| Show/Hide toggle | `button` next to password | `button` | Toggles `type` between [text](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#17-19)/`password` |

---

### 1.2 🟡 Doctor Registration

| Field | Value |
|---|---|
| **Element** | Same `<form>` — mode toggled to `'register'` |
| **Trigger** | Submit button when `mode === 'register'` |
| **Current behavior** | Calls `authStore.register(name, email, password, specialization)` — saves to `localStorage` |

**Required API endpoint**:

```
POST /api/auth/register
```

**Request**:
```json
Content-Type: application/json

{
  "name": "Dr. John Smith",
  "email": "john@hospital.com",
  "password": "securepass",
  "specialization": "Radiology"
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "token": "jwt-token-string",
  "doctor": {
    "id": "doc-1710345600000",
    "name": "Dr. John Smith",
    "email": "john@hospital.com",
    "specialization": "Radiology",
    "avatar": "JS"
  }
}
```

**Error Response** (409 Conflict):
```json
{
  "success": false,
  "error": "Email already registered"
}
```

**Additional Input Elements**:

| Input | Type | Validation |
|---|---|---|
| Full Name | [text](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#17-19) | Required (validated in [handleSubmit](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/DoctorLogin.js#28-51)) |
| Specialization | [text](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#17-19) | Optional |

---

### 1.3 🟡 Logout

| Field | Value |
|---|---|
| **Element** | Logout button in [Navbar.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/Navbar.js) (line 168) |
| **Trigger** | Button click `onClick={handleLogout}` |
| **Current behavior** | Calls `authStore.logout()` → removes `localStorage` key → navigates to `/login` |

**Required API endpoint**:

```
POST /api/auth/logout
```

**Headers**: `Authorization: Bearer <token>`

**Expected Response** (200): `{ "success": true }`

---

## 2. Image Analysis Pipeline

**Source file**: [UploadScreen.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/UploadScreen.js) (lines 89–222)

### 2.1 🟢 Analyze Medical Image *(the only currently active API call)*

| Field | Value |
|---|---|
| **Element** | "Analyze image →" button (line 670) |
| **Trigger** | Click when `canAnalyze === true` (image uploaded + disease type selected + step 4 reached) |
| **Source code** | [handleAnalyze()](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/UploadScreen.js#89-223) function, line 89 |

**API endpoint**:

```
POST /api/analyze
```

**Request** (`multipart/form-data`):

| Field | Type | Required | Example |
|---|---|---|---|
| `image` | [File](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/UploadScreen.js#52-59) (JPG/PNG) | ✅ | chest_xray.jpg |
| `disease_type` | `string` | ✅ | `"pneumonia"` \| `"skin_cancer"` \| `"stroke"` \| `"diabetic_retinopathy"` \| `"covid"` \| custom string |
| `patient_age` | `number` | ❌ | `45` |
| `patient_gender` | `string` | ❌ | `"male"` \| `"female"` \| `"other"` |

**FormData construction** (lines 122–127):
```js
const formData = new FormData();
formData.append('image', uploadedImage);            // File object
formData.append('disease_type', effectiveDiseaseType); // string
formData.append('patient_age', Number(patientContext.age));  // if present
formData.append('patient_gender', patientContext.gender);    // if present
```

**Expected Response** (200 OK):
```json
{
  "diagnosis_label": "Bacterial Pneumonia",
  "confidence_score": 0.934,
  "severity_score": 7.2,
  "original_image": "data:image/png;base64,...",
  "gradcam_heatmap": "data:image/png;base64,...",
  "shap_overlay": "data:image/png;base64,...",
  "gradcam_region": "Left Lower Lobe",
  "shap_region": "Right Lower Lobe",
  "xai_consensus": "high",
  "shap_values": [
    { "region_name": "Left Lower Lobe", "value": 0.352 },
    { "region_name": "Right Lower Lobe", "value": 0.291 },
    { "region_name": "Cardiac Silhouette", "value": 0.215 },
    { "region_name": "Costophrenic Angle", "value": 0.148 },
    { "region_name": "Hilar Region", "value": 0.097 }
  ],
  "clinical_narrative": "CLINICAL IMPRESSION — BACTERIAL PNEUMONIA\n\nThe AI classification model predicts..."
}
```

**Response field mapping** (how frontend uses each field):

| Response Field | Used In | Purpose |
|---|---|---|
| `diagnosis_label` | Dynamic Island notch, chat, report | Primary diagnosis text |
| `confidence_score` | Notch badge, chat, report | Float 0–1, displayed as percentage |
| `severity_score` | Notch badge, chat, report | Float 0–10 |
| `original_image` | Workspace image viewer | Base64 or URL of original |
| `gradcam_heatmap` | Workspace (viewMode='gradcam'), Report | Base64 or URL of heatmap overlay |
| `shap_overlay` | Workspace (viewMode='shap') | Base64 or URL of SHAP overlay |
| `gradcam_region` | Chat message | Text label of focused region |
| `shap_region` | Chat message | Text label of SHAP focus |
| `xai_consensus` | Notch badge, report | `"high"` \| `"medium"` \| `"low"` |
| `shap_values` | Recharts bar chart, report bars | Array of `{region_name, value}` |
| `clinical_narrative` | Chat message, report section | Multi-line narrative string |

**Error handling** (line 135–181): On `fetch` failure, the frontend generates **demo mock data** and proceeds normally. The backend 500/network error is logged with `console.warn`.

**Dependencies**:
- Requires `uploadedImage` (File) and `effectiveDiseaseType` (string) to be set
- Triggers [setIsLoading(true)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#20-21) → shows [AnalysisLoader](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/App.js#208-315) canvas animation
- On completion: creates patient record, session, and chat messages → navigates to workspace

---

## 3. Upload Wizard Controls

**Source file**: [UploadScreen.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/UploadScreen.js)

> These controls are **purely client-side** (state changes only, no API calls).

### 3.1 File Upload (Step 1)

| Field | Value |
|---|---|
| **Element** | Drag-drop zone + hidden `<input type="file">` (line 503) |
| **Triggers** | Click → `fileInputRef.current.click()`, or drag-and-drop `onDrop` |
| **Accept** | `image/png, image/jpeg` |
| **Action** | Calls [setUploadedImage(file)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#15-16) → stores [File](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/UploadScreen.js#52-59) object in `appStore` |
| **Side effect** | Auto-advances to step 2 after 600ms delay |

### 3.2 Disease Type Selection (Step 2)

| Element | Action |
|---|---|
| 5 disease option buttons (`pneumonia`, `skin_cancer`, `stroke`, `diabetic_retinopathy`, `covid`) | [setDiseaseType(opt.id)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#16-17) |
| Custom disease text input (line 549) | Sets `customDisease` local state, overrides `diseaseType` |

### 3.3 Patient Info (Step 3)

| Element | Store Action |
|---|---|
| Patient Name input | Local state `patientName` |
| Age input (`number`, 0–120) | [setPatientContext({ age: value })](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#17-19) |
| Gender select (`male/female/other`) | [setPatientContext({ gender: value })](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#17-19) |

### 3.4 Navigation Buttons

| Element | Action |
|---|---|
| "Continue" buttons (each step) | `setStep(step + 1)` |
| "Back" buttons | `setStep(step - 1)` |
| Step tracker dots (left sidebar) | `setStep(clickedIndex)` if step is completed |

---

## 4. Analysis Workspace

**Source file**: [AnalysisWorkspace.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/AnalysisWorkspace.js)

### 4.1 View Mode Tabs (Right Panel)

| Element | Action | API |
|---|---|---|
| "Original" tab | [setViewMode('original')](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#21-22) | None — toggles UI |
| "Grad-CAM" tab | [setViewMode('gradcam')](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#21-22) | None — shows `gradcam_heatmap` overlay |
| "SHAP" tab | [setViewMode('shap')](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#21-22) | None — shows `shap_overlay` |
| "Split" tab | [setViewMode('split')](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#21-22) | None — side-by-side view |

### 4.2 Heatmap Opacity Slider

| Field | Value |
|---|---|
| **Element** | `<input type="range" min={0} max={1} step={0.01}>` (line 764) |
| **Action** | [setHeatmapOpacity(parseFloat(value))](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#22-23) |
| **Applied to** | Overlay `<img>` opacity in image viewer |

### 4.3 Top Bar Actions

| Element | Action | API |
|---|---|---|
| "New Analysis" button | [setAnalysisResult(null); setActiveScreen('upload')](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#19-20) | None |
| "Hide/Show Panel" toggle | `setShowImagePanel(!showImagePanel)` | None |
| "Report" button | [setActiveScreen('report')](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#23-24) | None |

### 4.4 Dynamic Island (DiagnosisNotch)

| Field | Value |
|---|---|
| **Trigger** | Automatically on new `activeSessionId` change, or when analysis completes |
| **Displayed data** | `diagnosis_label`, `confidence_score`, `severity_score`, `xai_consensus` |
| **Dismiss** | Click/tap anywhere, or auto-dismiss after 4 seconds |
| **API** | None — reads from `analysisResult` in store |

---

## 5. Patient Management

**Source file**: [patientStore.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/patientStore.js) + [AnalysisWorkspace.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/AnalysisWorkspace.js)

> Currently **all client-side** (`localStorage`). For production, replace with API calls:

### 5.1 🟡 Create/Find Patient

| Field | Value |
|---|---|
| **Trigger** | [handleAnalyze()](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/UploadScreen.js#89-223) in UploadScreen (line 96) |
| **Current** | [findOrCreatePatient(name, age, gender)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/patientStore.js#47-57) — deduplicates by name in localStorage |

**Required API endpoint**:

```
POST /api/patients
```

```json
{
  "name": "Rahul Sharma",
  "age": 45,
  "gender": "male"
}
```

**Response** (200/201):
```json
{
  "id": "patient-1710345600000",
  "name": "Rahul Sharma",
  "age": 45,
  "gender": "male",
  "createdAt": "2026-03-13T12:00:00.000Z",
  "sessions": []
}
```

### 5.2 🟡 List Patients (Sidebar)

| Field | Value |
|---|---|
| **Element** | [PatientSidebar](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/AnalysisWorkspace.js#237-300) component (line 240) |
| **Trigger** | On workspace mount |
| **Current** | Reads `patients` array from `patientStore` (localStorage) |

**Required API endpoint**:

```
GET /api/patients
```

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "id": "patient-001",
    "name": "Rahul Sharma",
    "age": 45,
    "gender": "male",
    "createdAt": "2026-03-13T10:30:00.000Z",
    "sessionCount": 3,
    "lastSessionDate": "2026-03-13T12:00:00.000Z"
  }
]
```

### 5.3 🟡 Create Session

| Field | Value |
|---|---|
| **Trigger** | [addSession(patientId, sessionData)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/patientStore.js#58-77) in UploadScreen (line 116) |
| **When** | After form submission, before API call to `/api/analyze` |

**Required API endpoint**:

```
POST /api/patients/:patientId/sessions
```

```json
{
  "diseaseType": "pneumonia",
  "imagePreview": "data:image/jpeg;base64,...",
  "messages": [
    {
      "role": "patient",
      "content": "📎 Uploaded: chest_xray.jpg\n🔍 Analysis type: pneumonia",
      "timestamp": "2026-03-13T12:00:00.000Z"
    }
  ]
}
```

**Response** (201):
```json
{
  "id": "session-1710345600000",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "diseaseType": "pneumonia",
  "analysisResult": null,
  "messages": [...]
}
```

### 5.4 🟡 Update Session with Results

| Field | Value |
|---|---|
| **Trigger** | [updateSessionResult(patientId, sessionId, result, messages)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/patientStore.js#78-100) (line 217) |
| **When** | After `/api/analyze` response (or demo fallback) completes |

**Required API endpoint**:

```
PATCH /api/patients/:patientId/sessions/:sessionId
```

```json
{
  "analysisResult": { /* full analysis result object */ },
  "messages": [ /* full message array */ ]
}
```

**Response** (200): `{ "success": true }`

### 5.5 Patient Selection (Sidebar Click)

| Field | Value |
|---|---|
| **Element** | Patient row button in [PatientSidebar](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/AnalysisWorkspace.js#237-300) (line 260) |
| **Action** | [setActivePatient(id)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/patientStore.js#26-27) → [setActiveSession(lastSession.id)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/patientStore.js#28-29) |
| **API** | None (state change only), but could trigger `GET /api/patients/:id/sessions` |

### 5.6 Session Tab Selection

| Field | Value |
|---|---|
| **Element** | Session tab buttons in [SessionList](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/AnalysisWorkspace.js#301-335) (line 316) |
| **Action** | [setActiveSession(sessionId)](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/patientStore.js#28-29) |
| **Side effect** | Triggers Dynamic Island notch animation |

---

## 6. Doctor Notes / Chat

**Source file**: [AnalysisWorkspace.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/AnalysisWorkspace.js) (lines 405–415, 628–683)

### 6.1 🟡 Send Doctor Note

| Field | Value |
|---|---|
| **Element** | `<textarea>` + Send `<button>` (lines 651–675) |
| **Trigger** | Click send button or press Enter (non-Shift) |
| **Current** | [addMessage(patientId, sessionId, { role: 'doctor', content })](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/patientStore.js#101-125) → saves to localStorage |

**Required API endpoint**:

```
POST /api/patients/:patientId/sessions/:sessionId/messages
```

```json
{
  "role": "doctor",
  "content": "Recommend follow-up CT scan in 2 weeks given severity."
}
```

**Response** (201):
```json
{
  "id": "msg-1710345600000",
  "role": "doctor",
  "content": "Recommend follow-up CT scan in 2 weeks given severity.",
  "timestamp": "2026-03-13T12:05:00.000Z"
}
```

**Message roles used by frontend**:

| Role | Avatar Color | Icon | Origin |
|---|---|---|---|
| `patient` | Blue (`#3b82f6`) | `User` | Auto-generated from upload metadata |
| [ai](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/PixelMosaic.js#3-79) | Purple (`#7c5cfc`) | `Bot` | Generated from analysis results |
| `doctor` | Green (`#10b981`) | `Stethoscope` | Manual input from doctor |

---

## 7. Report Generation

**Source file**: [ReportView.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/components/ReportView.js)

### 7.1 Print Report

| Field | Value |
|---|---|
| **Element** | "Print" button (line 52) |
| **Action** | `window.print()` — browser print dialog |
| **API** | None |

### 7.2 Download PDF

| Field | Value |
|---|---|
| **Element** | "Download PDF" button (line 66) |
| **Action** | Injects `@media print` CSS → `window.print()` → removes CSS after 1s |
| **API** | None (client-side print-to-PDF) |

### 7.3 🟡 Server-side PDF Generation (recommended)

```
GET /api/patients/:patientId/sessions/:sessionId/report?format=pdf
```

**Headers**: `Authorization: Bearer <token>`

**Response**: `Content-Type: application/pdf` (binary stream)

### 7.4 Back to Workspace

| Field | Value |
|---|---|
| **Element** | "Back to Workspace" button (line 38) |
| **Action** | [setActiveScreen('analysis')](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#23-24) |

---

## 8. Contact Form

**Source file**: [Contact.js](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/pages/Contact.js)

### 8.1 🟡 Submit Contact Form

| Field | Value |
|---|---|
| **Element** | `<button type="submit">` in `<motion.form>` (line 182) |
| **Trigger** | Form submit (no `onSubmit` wired yet — needs implementation) |
| **Current** | Default browser form submission (page reload) |

**Required API endpoint**:

```
POST /api/contact
```

```json
Content-Type: application/json

{
  "name": "Dr. Jane Doe",
  "email": "jane@hospital.com",
  "company": "City Med Center",
  "role": "Radiologist",
  "message": "Interested in integrating ExplainableMed with our PACS system."
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Thank you! We'll be in touch shortly."
}
```

**Input elements**:

| Field | ID | Type | Required |
|---|---|---|---|
| Full name | `name` | text | Implied |
| Work email | `email` | email | Implied |
| Company | `company` | text | Optional |
| Role | `role` | text | Optional |
| Message | `message` | textarea | Implied |

---

## 9. Navigation & UI State (No API, State Only)

These elements change application state and route without API calls:

| Element | Location | Action |
|---|---|---|
| Logo click | Navbar (line 66) | `navigate('/')` |
| Upload/Workspace/Report pills | Navbar (line 93) | [setActiveScreen(id); navigate('/workspace')](file:///c:/Users/paltr/OneDrive/Desktop/Watumull/eqtylab-ai-platform/src/store/appStore.js#23-24) |
| "Upload medical image" CTA | HeroSimple (line 319) | `navigate('/workspace')` |
| "Learn more" button | HeroSimple (line 352) | `scrollIntoView('.features-section')` |
| "Doctor Login" button | Navbar (line 185) | `navigate('/login')` |
| Login/Register mode toggle | DoctorLogin (line 276) | `setMode('login'|'register')` |
| Step 1–4 navigation (Continue/Back) | UploadScreen | `setStep(n)` |

---

## Summary: All Required Backend Endpoints

| # | Method | Endpoint | Status | Source Component |
|---|---|---|---|---|
| 1 | `POST` | `/api/auth/login` | 🟡 Needed | DoctorLogin |
| 2 | `POST` | `/api/auth/register` | 🟡 Needed | DoctorLogin |
| 3 | `POST` | `/api/auth/logout` | 🟡 Needed | Navbar |
| 4 | `POST` | `/api/analyze` | 🟢 **Active** | UploadScreen |
| 5 | `POST` | `/api/patients` | 🟡 Needed | UploadScreen |
| 6 | `GET` | `/api/patients` | 🟡 Needed | AnalysisWorkspace |
| 7 | `POST` | `/api/patients/:id/sessions` | 🟡 Needed | UploadScreen |
| 8 | `PATCH` | `/api/patients/:id/sessions/:sid` | 🟡 Needed | UploadScreen |
| 9 | `POST` | `/api/patients/:id/sessions/:sid/messages` | 🟡 Needed | AnalysisWorkspace |
| 10 | `GET` | `/api/patients/:id/sessions/:sid/report` | 🟡 Needed | ReportView |
| 11 | `POST` | `/api/contact` | 🟡 Needed | Contact page |

> [!IMPORTANT]
> **Only endpoint #4 (`POST /api/analyze`) is currently wired with a `fetch()` call.** All other data flows use `localStorage` via Zustand stores. The frontend includes a **demo fallback** (lines 136–181 in UploadScreen) that generates mock results when the backend is unreachable.
