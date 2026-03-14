import { create } from 'zustand';

const initialResult = null;

// Persist dark mode preference
const getInitialTheme = () => {
  try { return localStorage.getItem('explainablemed_theme') !== 'light'; } catch { return true; }
};

export const useAppStore = create((set, get) => ({
  uploadedImage: null,
  diseaseType: 'pneumonia',
  patientContext: { age: '', gender: '' },
  analysisResult: initialResult,
  analysisError: null,
  isLoading: false,
  viewMode: 'gradcam',
  heatmapOpacity: 0.7,
  activeScreen: 'upload',
  isDarkMode: getInitialTheme(),

  setUploadedImage: (file) => set({ uploadedImage: file }),
  setDiseaseType: (diseaseType) => set({ diseaseType }),
  setPatientContext: (patch) =>
    set((state) => ({ patientContext: { ...state.patientContext, ...patch } })),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setAnalysisError: (analysisError) => set({ analysisError }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setViewMode: (viewMode) => set({ viewMode }),
  setHeatmapOpacity: (heatmapOpacity) => set({ heatmapOpacity }),
  setActiveScreen: (activeScreen) => set({ activeScreen }),
  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    try { localStorage.setItem('explainablemed_theme', next ? 'dark' : 'light'); } catch {}
    set({ isDarkMode: next });
  },
}));
