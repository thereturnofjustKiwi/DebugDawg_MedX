# AI Based Medical Image Classification Platform (MedX)

ExplainableMed is an AI-powered medical image analysis workspace designed to assist healthcare professionals by providing accurate diagnostic classification and transparent, explainable AI (XAI) visual insights. This platform supports diagnosing conditions from a variety of scans, including Brain MRI, Chest X-Rays, Retinal OCT, and Skin Lesion dermoscopy.

By integrating advanced deep learning models with visual interpretability methods (like **Grad-CAM** and **SHAP**), ExplainableMed helps clinicians understand *why* the AI made a particular diagnosis, building trust and augmenting medical decision-making.

---

## 🌟 Key Features
- **Multi-Modal Diagnosis:** Support for multiple disease classifications (Brain Tumors, Pneumonia, Tuberculosis, Retinal conditions, Skin Cancer).
- **Explainable AI (XAI) Overlay:** 
  - **Grad-CAM:** Highlights the critical regions in medical scans influencing the AI prediction via heatmaps.
  - **SHAP Region Contributions:** Details granular region-wise significance percentiles.
- **Clinical Narrative & Assistant:** Powered by an LLM-backend that generates structured medical reports and enables an interactive chat workspace for clinicians to query the AI about specific findings. 
- **Workspace UI:** A comprehensive dashboard to organize patient scans, visually compare analysis features (Original / Grad-CAM / SHAP / Split view), and download full clinical reports in PDF format.
- **Dynamic Risk Annotations:** Provides interactive bounding box "pins" identifying localized high-risk areas.

---

## 💻 Tech Stack
- **Frontend:** React.js, Zustand (state management), Framer Motion (animations), Recharts.
- **Backend:** FastAPI (Python), PyTorch / torchvision.
- **Explainability:** Captum (Integrated Gradients/SHAP implementations), Custom Grad-CAM.
- **LLM Integration:** Base transformers pipeline.

---

## ⚙️ Setup & Installation Instructions

### Prerequisites
- Python 3.9+ (Python 3.11 recommended)
- Node.js 18+ and npm

### 1. Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment:
```bash
# Windows
python -m venv venv3.11

# macOS/Linux
python3 -m venv venv3.11
```

Activate the virtual environment:
```bash
# Windows
.\venv3.11\Scripts\activate

# macOS/Linux
source venv3.11/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

*(Optional)* Configure environment variables by copying `.env.example` to `.env` if required by the LLM features.

### 2. Frontend Setup

Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend
```

Install the required Node packages:
```bash
npm install
```

Configure environment variables:
Create a `.env` file in the `frontend` root directory and set the API endpoint (if the backend isn't running on the default localhost:8000).
```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

---

## 🚀 Startup Instructions

### Running the Backend

Ensure your Python virtual environment is activated, then run the FastAPI server:
```bash
cd backend
# Run server
uvicorn app.main:app --reload
```
*The backend API will be available at `http://127.0.0.1:8000`.*
*You can access the interactive Swagger API documentation at `http://127.0.0.1:8000/docs`.*

### Running the Frontend

In your other terminal, start the React development server:
```bash
cd frontend
npm start
```
*The web platform will open automatically in your browser at `http://localhost:3000`.*

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
