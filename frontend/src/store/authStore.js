import { create } from 'zustand';

// Simple localStorage helpers
const loadAuth = () => {
  try {
    const data = localStorage.getItem('explainablemed_auth');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const loadDoctors = () => {
  try {
    const data = localStorage.getItem('explainablemed_doctors');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

// Default demo doctor
const DEMO_DOCTOR = {
  id: 'demo-001',
  name: 'Dr. Sarah Mitchell',
  email: 'doctor@explainablemed.com',
  password: 'demo1234',
  specialization: 'Radiology',
  avatar: 'SM',
};

const initialDoctors = loadDoctors();
if (!initialDoctors.find(d => d.email === DEMO_DOCTOR.email)) {
  initialDoctors.push(DEMO_DOCTOR);
  localStorage.setItem('explainablemed_doctors', JSON.stringify(initialDoctors));
}

const saved = loadAuth();

export const useAuthStore = create((set, get) => ({
  isAuthenticated: !!saved,
  doctor: saved || null,

  login: (email, password) => {
    const doctors = loadDoctors();
    const found = doctors.find(
      d => d.email.toLowerCase() === email.toLowerCase() && d.password === password
    );
    if (!found) return { success: false, error: 'Invalid email or password' };
    const profile = { id: found.id, name: found.name, email: found.email, specialization: found.specialization, avatar: found.avatar };
    localStorage.setItem('explainablemed_auth', JSON.stringify(profile));
    set({ isAuthenticated: true, doctor: profile });
    return { success: true };
  },

  register: (name, email, password, specialization) => {
    const doctors = loadDoctors();
    if (doctors.find(d => d.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email already registered' };
    }
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const newDoc = {
      id: 'doc-' + Date.now(),
      name,
      email,
      password,
      specialization,
      avatar: initials,
    };
    doctors.push(newDoc);
    localStorage.setItem('explainablemed_doctors', JSON.stringify(doctors));
    const profile = { id: newDoc.id, name: newDoc.name, email: newDoc.email, specialization: newDoc.specialization, avatar: newDoc.avatar };
    localStorage.setItem('explainablemed_auth', JSON.stringify(profile));
    set({ isAuthenticated: true, doctor: profile });
    return { success: true };
  },

  logout: () => {
    localStorage.removeItem('explainablemed_auth');
    set({ isAuthenticated: false, doctor: null });
  },
}));
