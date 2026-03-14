import { create } from 'zustand';

// localStorage helpers
const STORAGE_KEY = 'explainablemed_patients';

const loadPatients = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const savePatients = (patients) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  } catch (e) {
    console.warn('Failed to save patients:', e);
  }
};

export const usePatientStore = create((set, get) => ({
  patients: loadPatients(),
  activePatientId: null,
  activeSessionId: null,

  setActivePatient: (id) => set({ activePatientId: id, activeSessionId: null }),

  setActiveSession: (id) => set({ activeSessionId: id }),

  // Atomically set patient + session without the intermediate null-reset on activeSessionId
  setActivePatientAndSession: (patientId, sessionId) =>
    set({ activePatientId: patientId, activeSessionId: sessionId }),

  deletePatient: (patientId) => {
    const updated = get().patients.filter(p => p.id !== patientId);
    savePatients(updated);
    const { activePatientId, activeSessionId } = get();
    set({
      patients: updated,
      activePatientId: activePatientId === patientId ? null : activePatientId,
      activeSessionId: activePatientId === patientId ? null : activeSessionId,
    });
  },

  addPatient: (patient) => {
    const newPatient = {
      id: 'patient-' + Date.now(),
      name: patient.name || 'Unknown',
      age: patient.age || '',
      gender: patient.gender || '',
      createdAt: new Date().toISOString(),
      sessions: [],
      ...patient,
    };
    if (!newPatient.id.startsWith('patient-')) newPatient.id = 'patient-' + Date.now();
    const updated = [...get().patients, newPatient];
    savePatients(updated);
    set({ patients: updated, activePatientId: newPatient.id });
    return newPatient.id;
  },

  findOrCreatePatient: (name, age, gender) => {
    const existing = get().patients.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      set({ activePatientId: existing.id });
      return existing.id;
    }
    return get().addPatient({ name, age, gender });
  },

  addSession: (patientId, session) => {
    const sessionObj = {
      id: 'session-' + Date.now(),
      timestamp: new Date().toISOString(),
      diseaseType: session.diseaseType || '',
      imagePreview: session.imagePreview || null,
      analysisResult: session.analysisResult || null,
      messages: session.messages || [],
    };
    const patients = get().patients.map(p => {
      if (p.id === patientId) {
        return { ...p, sessions: [...p.sessions, sessionObj] };
      }
      return p;
    });
    savePatients(patients);
    set({ patients, activeSessionId: sessionObj.id });
    return sessionObj.id;
  },

  updateSessionResult: (patientId, sessionId, analysisResult, messages) => {
    const patients = get().patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          sessions: p.sessions.map(s => {
            if (s.id === sessionId) {
              return {
                ...s,
                analysisResult,
                messages: messages || s.messages,
              };
            }
            return s;
          }),
        };
      }
      return p;
    });
    savePatients(patients);
    set({ patients });
  },

  addMessage: (patientId, sessionId, message) => {
    const msgObj = {
      id: 'msg-' + Date.now(),
      role: message.role || 'doctor',
      content: message.content,
      timestamp: new Date().toISOString(),
    };
    const patients = get().patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          sessions: p.sessions.map(s => {
            if (s.id === sessionId) {
              return { ...s, messages: [...s.messages, msgObj] };
            }
            return s;
          }),
        };
      }
      return p;
    });
    savePatients(patients);
    set({ patients });
  },

  getActivePatient: () => {
    const { patients, activePatientId } = get();
    return patients.find(p => p.id === activePatientId) || null;
  },

  getActiveSession: () => {
    const patient = get().getActivePatient();
    if (!patient) return null;
    const { activeSessionId } = get();
    return patient.sessions.find(s => s.id === activeSessionId) || null;
  },
}));
