import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '../store/appStore';
import { usePatientStore } from '../store/patientStore';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  ArrowLeft, Download, Eye, Layers, SplitSquareVertical, Image,
  Activity, Send, User, Bot, Stethoscope,
  ChevronRight, Clock, FileImage, PanelRightOpen, PanelRightClose,
  FileText, Brain, BarChart3, Shield,
} from 'lucide-react';

/* ============================================================
   DYNAMIC ISLAND — Water-drop diagnosis notch (above navbar)
   ============================================================ */
const DiagnosisNotch = ({ result, visible, onDismiss }) => {
  const [animState, setAnimState] = useState('hidden'); // hidden | entering | visible | leaving

  useEffect(() => {
    if (visible) {
      setAnimState('entering');
      const t = setTimeout(() => setAnimState('visible'), 700);
      return () => clearTimeout(t);
    } else if (animState === 'visible' || animState === 'entering') {
      setAnimState('leaving');
      const t = setTimeout(() => setAnimState('hidden'), 600);
      return () => clearTimeout(t);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!result || !result.diagnosis_label || animState === 'hidden') return null;

  const conf = ((result.confidence_score || 0) * 100).toFixed(1);
  const sev = (result.severity_score || 0).toFixed(1);
  const consensus = (result.xai_consensus || 'medium').toUpperCase();

  const animClass =
    animState === 'entering' ? 'water-drop-in'
    : animState === 'leaving' ? 'water-drop-out'
    : '';

  return ReactDOM.createPortal(
    <>
      {/* Backdrop — click to dismiss */}
      {(animState === 'entering' || animState === 'visible') && (
        <div
          onClick={onDismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.3s ease both',
          }}
        />
      )}
      {/* Notch pill — ABOVE navbar */}
      <div
        className={animClass}
        onClick={onDismiss}
        style={{
          position: 'fixed',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10001,
          minWidth: 480,
          maxWidth: 620,
          padding: '22px 32px',
          borderRadius: 32,
          background: 'rgba(8,8,22,0.92)',
          backdropFilter: 'blur(50px) saturate(2)',
          WebkitBackdropFilter: 'blur(50px) saturate(2)',
          border: '1px solid rgba(130,130,255,0.2)',
          boxShadow:
            '0 30px 100px rgba(0,0,0,0.8), 0 0 60px rgba(124,92,252,0.2), 0 0 120px rgba(56,189,248,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 20,
        }}
      >
        {/* Water ripple ring */}
        {animState === 'entering' && (
          <div style={{
            position: 'absolute', inset: -4, borderRadius: 36,
            border: '2px solid rgba(124,92,252,0.3)',
            animation: 'waterRipple 0.8s ease-out both',
            pointerEvents: 'none',
          }} />
        )}

        {/* Pulsing brain icon — bigger */}
        <div style={{
          width: 56, height: 56, borderRadius: 18, flexShrink: 0,
          background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 28px rgba(124,92,252,0.4)',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }}>
          <Brain size={28} color="#fff" />
        </div>

        {/* Diagnosis info — bigger text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 18, fontWeight: 800, color: '#f0f0ff',
            marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.01em',
          }}>
            {result.diagnosis_label}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, fontSize: 13,
          }}>
            <span style={{
              color: '#a78bfa', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <BarChart3 size={13} /> {conf}%
            </span>
            <span style={{
              color: parseFloat(sev) >= 7 ? '#f87171' : '#fbbf24',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Shield size={13} /> Sev {sev}/10
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 999, fontSize: 10,
              fontWeight: 700, letterSpacing: 0.5,
              background: consensus === 'HIGH' ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)',
              color: consensus === 'HIGH' ? '#34d399' : '#fbbf24',
              border: `1px solid ${consensus === 'HIGH' ? 'rgba(16,185,129,0.25)' : 'rgba(251,191,36,0.25)'}`,
            }}>
              {consensus}
            </span>
          </div>
        </div>

        {/* Risk Level Badge */}
        {result.risk_level && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 10,
          }}>
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 11,
              fontWeight: 700, letterSpacing: 0.5,
              background:
                result.risk_level === 'HIGH' ? 'rgba(239,68,68,0.15)' :
                result.risk_level === 'MODERATE' ? 'rgba(251,146,60,0.15)' :
                'rgba(16,185,129,0.15)',
              color:
                result.risk_level === 'HIGH' ? '#f87171' :
                result.risk_level === 'MODERATE' ? '#fb923c' :
                '#34d399',
              border: `1px solid ${
                result.risk_level === 'HIGH' ? 'rgba(239,68,68,0.3)' :
                result.risk_level === 'MODERATE' ? 'rgba(251,146,60,0.3)' :
                'rgba(16,185,129,0.3)'
              }`,
            }}>
              {result.risk_level === 'HIGH' ? '🔴' : result.risk_level === 'MODERATE' ? '🟠' : '🟢'} {result.risk_level} RISK
            </span>
            {result.risk_reason && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flex: 1 }}>
                {result.risk_reason}
              </span>
            )}
          </div>
        )}

        {/* Dismiss hint */}
        <div style={{
          fontSize: 10, color: 'var(--text-tertiary)',
          letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700,
          padding: '6px 12px', borderRadius: 8,
          background: 'rgba(130,130,255,0.06)',
          border: '1px solid rgba(130,130,255,0.1)',
        }}>
          TAP
        </div>
      </div>
    </>,
    document.body
  );
};

/* ============================================================
   CHAT BUBBLE
   ============================================================ */
const ChatBubble = ({ message, isLast }) => {
  const isAI = message.role === 'ai';
  const isDoctor = message.role === 'doctor';
  const isPatient = message.role === 'patient';

  const bubbleAlign = isPatient ? 'flex-end' : 'flex-start';
  const bubbleBg = isAI
    ? 'rgba(124,92,252,0.08)'
    : isDoctor
    ? 'rgba(16,185,129,0.08)'
    : 'rgba(59,130,246,0.08)';
  const bubbleBorder = isAI
    ? 'rgba(124,92,252,0.15)'
    : isDoctor
    ? 'rgba(16,185,129,0.15)'
    : 'rgba(59,130,246,0.15)';
  const avatarBg = isAI
    ? 'linear-gradient(135deg, #7c5cfc, #a855f7)'
    : isDoctor
    ? 'linear-gradient(135deg, #10b981, #06b6d4)'
    : 'linear-gradient(135deg, #3b82f6, #60a5fa)';
  const avatarIcon = isAI
    ? <Bot size={14} color="#fff" />
    : isDoctor
    ? <Stethoscope size={14} color="#fff" />
    : <User size={14} color="#fff" />;
  const roleLabel = isAI ? 'ExplainableMed AI' : isDoctor ? 'Doctor' : 'Patient Data';

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isPatient ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 12,
      maxWidth: '85%',
      alignSelf: bubbleAlign,
      animation: isLast ? 'fadeInUp 0.4s ease both' : 'none',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: avatarBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${isAI ? 'rgba(124,92,252,0.25)' : isDoctor ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
      }}>
        {avatarIcon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
          flexDirection: isPatient ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: isAI ? '#a78bfa' : isDoctor ? '#34d399' : '#60a5fa', textTransform: 'uppercase', letterSpacing: 1 }}>
            {roleLabel}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{timeStr}</span>
        </div>
        <div style={{
          padding: '14px 18px',
          borderRadius: isPatient ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          background: bubbleBg,
          border: `1px solid ${bubbleBorder}`,
          fontSize: 13,
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   PATIENT SIDEBAR
   ============================================================ */
const PatientSidebar = ({ onSelectPatient, activePatientId }) => {
  const { patients } = usePatientStore();

  if (patients.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
        <User size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
        <div>No patients yet</div>
        <div style={{ fontSize: 11, marginTop: 6 }}>Upload and analyze an image to create a patient record</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px' }}>
      {patients.map(p => {
        const isActive = p.id === activePatientId;
        const lastSession = p.sessions[p.sessions.length - 1];
        const lastDate = lastSession ? new Date(lastSession.timestamp).toLocaleDateString() : '';
        return (
          <button key={p.id} onClick={() => onSelectPatient(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 14, border: 'none',
              background: isActive ? 'rgba(124,92,252,0.1)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left', width: '100%',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(130,130,255,0.05)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(124,92,252,0.1)' : 'transparent'; }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: isActive ? 'linear-gradient(135deg, #7c5cfc, #a855f7)' : 'rgba(130,130,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isActive ? '#fff' : 'var(--text-tertiary)',
              fontSize: 13, fontWeight: 700, transition: 'all 0.3s ease',
            }}>
              {p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f0f0ff' : 'var(--text-secondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{p.name}</div>
              <div style={{
                fontSize: 11, color: 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', gap: 4, marginTop: 2,
              }}>
                <Clock size={10} />
                {lastDate} · {p.sessions.length} session{p.sessions.length !== 1 ? 's' : ''}
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', opacity: isActive ? 1 : 0.3 }} />
          </button>
        );
      })}
    </div>
  );
};

/* ============================================================
   SESSION TABS
   ============================================================ */
const SessionList = ({ patient, activeSessionId, onSelectSession }) => {
  if (!patient || patient.sessions.length === 0) return null;
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto',
      borderBottom: '1px solid rgba(130,130,255,0.06)',
      flexShrink: 0,
    }}>
      {patient.sessions.map(s => {
        const isActive = s.id === activeSessionId;
        const date = new Date(s.timestamp);
        return (
          <button key={s.id} onClick={() => onSelectSession(s.id)}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none',
              background: isActive ? 'rgba(124,92,252,0.12)' : 'rgba(130,130,255,0.03)',
              color: isActive ? '#a78bfa' : 'var(--text-tertiary)',
              fontSize: 11, fontWeight: isActive ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <FileImage size={12} />
            {s.diseaseType} · {date.toLocaleDateString()}
          </button>
        );
      })}
    </div>
  );
};

/* ============================================================
   MAIN WORKSPACE — FIXED LAYOUT
   ============================================================ */
const AnalysisWorkspace = () => {
  const {
    analysisResult, viewMode, heatmapOpacity,
    setViewMode, setHeatmapOpacity, setActiveScreen,
    setIsLoading, setAnalysisResult,
    uploadedImage, diseaseType, patientContext,
  } = useAppStore();

  const {
    patients, activePatientId, activeSessionId,
    setActivePatient, setActiveSession, addMessage,
  } = usePatientStore();

  // Auth store is available for future doctor-specific UI
  useAuthStore();

  const [noteText, setNoteText] = useState('');
  const [showImagePanel, setShowImagePanel] = useState(true);
  const [localPreview, setLocalPreview] = useState(null);
  const [showNotch, setShowNotch] = useState(false);
  const [notchResult, setNotchResult] = useState(null);
  const chatEndRef = useRef(null);
  const prevSessionRef = useRef(null);

  useEffect(() => {
    if (uploadedImage && uploadedImage instanceof File) {
      const url = URL.createObjectURL(uploadedImage);
      setLocalPreview(url);
      return () => URL.revokeObjectURL(url);
    } else { setLocalPreview(null); }
  }, [uploadedImage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  // Trigger Dynamic Island notch when session changes
  useEffect(() => {
    const activePatient = patients.find(p => p.id === activePatientId);
    const activeSessionObj = activePatient?.sessions.find(s => s.id === activeSessionId);
    const sessionResult = activeSessionObj?.analysisResult || analysisResult;

    if (activeSessionId && activeSessionId !== prevSessionRef.current && sessionResult) {
      prevSessionRef.current = activeSessionId;
      setNotchResult(sessionResult);
      setShowNotch(true);
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => setShowNotch(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [activeSessionId, activePatientId, patients, analysisResult]);

  const result = analysisResult;
  const activePatient = patients.find(p => p.id === activePatientId);
  const activeSessionObj = activePatient?.sessions.find(s => s.id === activeSessionId);

  let messages = [];
  if (activeSessionObj) {
    messages = activeSessionObj.messages || [];
  } else if (result) {
    messages = buildMessagesFromResult(result, patientContext, diseaseType, uploadedImage);
  }

  const handleNew = () => { setAnalysisResult(null); setIsLoading(false); setActiveScreen('upload'); };
  const handleDownload = () => { setActiveScreen('report'); };

  const handleSendNote = () => {
    if (!noteText.trim()) return;
    if (activePatientId && activeSessionId) {
      addMessage(activePatientId, activeSessionId, { role: 'doctor', content: noteText.trim() });
    }
    setNoteText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendNote(); }
  };

  const currentResult = activeSessionObj?.analysisResult || result;
  const bars = currentResult?.shap_values?.map(d => ({ name: d.region_name, value: d.value })) ?? [];
  const barColors = ['#7c5cfc', '#3b82f6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#a855f7', '#22d3ee'];

  const baseImage = currentResult?.original_image || activeSessionObj?.imagePreview || localPreview;
  const overlay = viewMode === 'gradcam' ? currentResult?.gradcam_heatmap : viewMode === 'shap' ? currentResult?.shap_overlay : null;

  const viewModes = [
    { id: 'original', label: 'Original', icon: <Image size={14} /> },
    { id: 'gradcam', label: 'Grad-CAM', icon: <Eye size={14} /> },
    { id: 'shap', label: 'SHAP', icon: <Layers size={14} /> },
    { id: 'split', label: 'Split', icon: <SplitSquareVertical size={14} /> },
  ];

  const NAVBAR_H = 72;
  const TOPBAR_H = 52;

  return (
    <main style={{
      position: 'fixed',
      top: NAVBAR_H, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      {/* Dynamic Island Notch */}
      <DiagnosisNotch result={notchResult} visible={showNotch} onDismiss={() => setShowNotch(false)} />

      {/* ===== TOP BAR ===== */}
      <header style={{
        height: TOPBAR_H, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(130,130,255,0.06)',
        background: 'rgba(8,8,20,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <button onClick={handleNew}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.12)'; }}
          style={{
            padding: '7px 14px', borderRadius: 10,
            border: '1px solid rgba(130,130,255,0.12)',
            background: 'rgba(12,12,30,0.6)',
            color: '#f0f0ff', fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.3s ease', cursor: 'pointer',
          }}
        >
          <ArrowLeft size={13} /> New Analysis
        </button>

        <div style={{
          fontWeight: 700, fontSize: 14,
          fontFamily: "'Space Grotesk', sans-serif",
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Activity size={15} color="#7c5cfc" />
          <span style={{
            background: 'linear-gradient(135deg, #f0f0ff, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Workspace</span>
          {activePatient && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 4 }}>
              — {activePatient.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowImagePanel(!showImagePanel)}
            style={{
              padding: '7px 12px', borderRadius: 10,
              border: '1px solid rgba(130,130,255,0.12)',
              background: showImagePanel ? 'rgba(124,92,252,0.1)' : 'rgba(12,12,30,0.6)',
              color: showImagePanel ? '#a78bfa' : '#f0f0ff', fontSize: 12, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.3s ease', cursor: 'pointer',
            }}
          >
            {showImagePanel ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
            {showImagePanel ? 'Hide Panel' : 'Show Panel'}
          </button>
          <button onClick={handleDownload}
            style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              color: '#020617', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 3px 12px rgba(16,185,129,0.2)',
              transition: 'all 0.3s ease', cursor: 'pointer',
            }}
          >
            <Download size={13} /> Report
          </button>
        </div>
      </header>

      {/* ===== BODY: 3-column grid ===== */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: showImagePanel ? '230px minmax(0,1fr) 320px' : '230px minmax(0,1fr)',
        minHeight: 0,
        overflow: 'hidden',
      }}>

        {/* ===== LEFT SIDEBAR — patient list + report download at bottom ===== */}
        <aside style={{
          borderRight: '1px solid rgba(130,130,255,0.06)',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(8,8,20,0.5)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid rgba(130,130,255,0.06)',
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 2, color: '#a78bfa',
            display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0,
          }}>
            <User size={12} /> Patients
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <PatientSidebar
              onSelectPatient={(id) => {
                setActivePatient(id);
                const pat = patients.find(p => p.id === id);
                if (pat && pat.sessions.length > 0) {
                  setActiveSession(pat.sessions[pat.sessions.length - 1].id);
                }
              }}
              activePatientId={activePatientId}
            />
          </div>

          {/* Report Download — fixed bottom of left sidebar */}
          <div style={{
            flexShrink: 0,
            padding: '12px 12px',
            borderTop: '1px solid rgba(130,130,255,0.06)',
            background: 'rgba(8,8,20,0.6)',
          }}>
            <button
              onClick={handleDownload}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,92,252,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,92,252,0.15)'; }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, rgba(124,92,252,0.15), rgba(168,85,247,0.1))',
                color: '#c4b5fd', fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(124,92,252,0.15)',
              }}
            >
              <FileText size={14} />
              Download Report
            </button>
          </div>
        </aside>

        {/* ===== CENTER — session tabs + scrollable chat + fixed input ===== */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          background: 'rgba(5,5,16,0.3)',
        }}>
          {/* Session tabs */}
          {activePatient && (
            <SessionList
              patient={activePatient}
              activeSessionId={activeSessionId}
              onSelectSession={setActiveSession}
            />
          )}

          {/* Chat messages — ONLY scrollable area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-tertiary)', textAlign: 'center',
                minHeight: 300,
              }}>
                <Bot size={48} style={{ opacity: 0.12, marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  No conversation yet
                </div>
                <div style={{ fontSize: 13, maxWidth: 400, lineHeight: 1.7 }}>
                  Upload a medical image and run an analysis to start an AI-assisted conversation, or select a patient from the sidebar.
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <ChatBubble key={msg.id || idx} message={msg} isLast={idx === messages.length - 1} />
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Doctor note input — FIXED at bottom */}
          {activePatientId && activeSessionId && (
            <div style={{
              flexShrink: 0,
              padding: '10px 20px 14px',
              borderTop: '1px solid rgba(130,130,255,0.06)',
              background: 'rgba(8,8,20,0.7)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 10,
                padding: '10px 14px',
                borderRadius: 14,
                background: 'rgba(12,12,30,0.85)',
                border: '1px solid rgba(130,130,255,0.1)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Stethoscope size={13} color="#fff" />
                </div>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a clinical note or observation…"
                  rows={1}
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    color: '#f0f0ff', fontSize: 13, outline: 'none',
                    resize: 'none', fontFamily: 'inherit',
                    lineHeight: 1.5, maxHeight: 72, overflowY: 'auto',
                  }}
                />
                <button onClick={handleSendNote} disabled={!noteText.trim()}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: 'none',
                    background: noteText.trim() ? 'linear-gradient(135deg, #7c5cfc, #a855f7)' : 'rgba(130,130,255,0.08)',
                    color: '#fff', cursor: noteText.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: noteText.trim() ? '0 4px 14px rgba(124,92,252,0.3)' : 'none',
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
              <div style={{
                fontSize: 10, color: 'var(--text-tertiary)', marginTop: 5, paddingLeft: 4,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                Press Enter to send · Notes stored locally
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT PANEL — auto-open ===== */}
        {showImagePanel && (
          <aside style={{
            borderLeft: '1px solid rgba(130,130,255,0.06)',
            display: 'flex', flexDirection: 'column',
            background: 'rgba(8,8,20,0.5)',
            overflow: 'hidden',
          }}>
            {/* Image quality warning */}
            {currentResult?.image_quality?.passed === false && (
              <div style={{
                flexShrink: 0,
                padding: '10px 14px',
                background: 'rgba(251,191,36,0.08)',
                borderBottom: '1px solid rgba(251,191,36,0.2)',
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ color: '#fbbf24' }}>
                  {currentResult.image_quality.message || 'Image quality issue detected.'}
                </span>
              </div>
            )}

            {/* View mode tabs */}
            <div style={{
              padding: '10px 12px', borderBottom: '1px solid rgba(130,130,255,0.06)',
              display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0,
            }}>
              {viewModes.map(opt => {
                const isActive = viewMode === opt.id;
                return (
                  <button key={opt.id} onClick={() => setViewMode(opt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 10px', borderRadius: 8, border: 'none',
                      background: isActive ? 'rgba(124,92,252,0.12)' : 'transparent',
                      color: isActive ? '#a78bfa' : 'var(--text-tertiary)',
                      fontSize: 11, cursor: 'pointer', fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.3s ease',
                    }}
                  >{opt.icon} {opt.label}</button>
                );
              })}
            </div>

            {/* Image viewer */}
            <div style={{
              flex: 1, minHeight: 0, padding: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(12,12,30,0.6), rgba(5,5,16,0.8))',
              overflow: 'hidden',
            }}>
              {baseImage ? (
                viewMode === 'split' ? (
                  <div style={{ display: 'flex', gap: 6, width: '100%', height: '100%' }}>
                    <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(130,130,255,0.06)', position: 'relative' }}>
                      <img src={baseImage} alt="original" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <div style={{ position: 'absolute', bottom: 6, left: 6, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', fontSize: 9, color: '#94a3b8' }}>Original</div>
                    </div>
                    <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(130,130,255,0.06)', position: 'relative' }}>
                      <img src={overlay || baseImage} alt="overlay" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.85 }} />
                      <div style={{ position: 'absolute', bottom: 6, left: 6, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', fontSize: 9, color: '#94a3b8' }}>Overlay</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={baseImage} alt="scan" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 10 }} />
                    {overlay && viewMode !== 'original' && (
                      <img src={overlay} alt="overlay" style={{
                        position: 'absolute', maxWidth: '100%', maxHeight: '100%',
                        objectFit: 'contain', borderRadius: 10,
                        mixBlendMode: 'screen', opacity: heatmapOpacity,
                      }} />
                    )}
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                  <FileImage size={28} style={{ opacity: 0.15, marginBottom: 8 }} />
                  <div>No image</div>
                </div>
              )}
            </div>

            {/* Opacity slider */}
            <div style={{
              padding: '8px 12px', borderTop: '1px solid rgba(130,130,255,0.06)',
              fontSize: 11, color: 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', gap: 8,
              flexShrink: 0,
            }}>
              <span>Opacity</span>
              <input type="range" min={0} max={1} step={0.01} value={heatmapOpacity}
                onChange={e => setHeatmapOpacity(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#7c5cfc', height: 3 }}
              />
              <span>{Math.round(heatmapOpacity * 100)}%</span>
            </div>

            {/* SHAP chart */}
            {bars.length > 0 && (
              <div style={{
                height: 170, padding: '6px 10px',
                borderTop: '1px solid rgba(130,130,255,0.06)',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  SHAP Contributions
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={bars} layout="vertical" margin={{ top: 2, right: 4, bottom: 2, left: 24 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={75} tick={{ fill: '#9898c0', fontSize: 10 }} />
                    <Tooltip contentStyle={{
                      background: 'rgba(12,12,30,0.95)',
                      border: '1px solid rgba(130,130,255,0.15)',
                      borderRadius: 8, fontSize: 11, color: '#f0f0ff',
                    }} />
                    <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                      {bars.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* All Probabilities chart */}
            {(currentResult?.all_probabilities || []).length > 0 && (
              <div style={{
                padding: '6px 10px 10px',
                borderTop: '1px solid rgba(130,130,255,0.06)',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Class Probabilities
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {currentResult.all_probabilities.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 9, color: 'var(--text-tertiary)',
                        minWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{item.class}
                      </span>
                      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(130,130,255,0.08)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 999,
                          width: `${Math.min(item.probability * 100, 100)}%`,
                          background: i === 0 ? 'linear-gradient(90deg,#7c5cfc,#a855f7)' :
                                      i === 1 ? 'linear-gradient(90deg,#3b82f6,#06b6d4)' :
                                      'linear-gradient(90deg,#10b981,#22d3ee)',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--text-tertiary)', minWidth: 34, textAlign: 'right' }}>
                        {(item.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
};

/* ============================================================
   Helper: Build chat messages from a fresh result
   ============================================================ */
function buildMessagesFromResult(result, patientContext, diseaseType, uploadedImage) {
  const msgs = [];
  const now = new Date().toISOString();

  const patientParts = [];
  if (uploadedImage?.name) patientParts.push(`📎 Uploaded: ${uploadedImage.name}`);
  if (diseaseType) patientParts.push(`🔍 Analysis type: ${diseaseType}`);
  if (patientContext?.age) patientParts.push(`👤 Age: ${patientContext.age}`);
  if (patientContext?.gender) patientParts.push(`⚤ Gender: ${patientContext.gender}`);
  if (patientParts.length > 0) {
    msgs.push({ id: 'auto-patient', role: 'patient', content: patientParts.join('\n'), timestamp: now });
  }

  if (result.diagnosis_label) {
    const conf = ((result.confidence_score || 0) * 100).toFixed(1);
    const sev = (result.severity_score || 0).toFixed(1);
    const consensus = (result.xai_consensus || 'medium').toUpperCase();
    const riskColor = result.risk_level === 'HIGH' ? '🔴' : result.risk_level === 'MODERATE' ? '🟠' : '🟢';
    msgs.push({
      id: 'auto-diagnosis', role: 'ai',
      content:
        `🧠 DIAGNOSIS: ${result.diagnosis_label}\n\n` +
        `📊 Confidence: ${conf}%\n` +
        `⚠️ Severity: ${sev}/10\n` +
        (result.risk_level ? `${riskColor} Risk Level: ${result.risk_level}\n` : '') +
        `🔗 XAI Consensus: ${consensus}` +
        (result.gradcam_region ? `\n📍 Grad-CAM focus: ${result.gradcam_region}` : '') +
        (result.shap_region ? `\n📍 SHAP focus: ${result.shap_region}` : '') +
        (result.gradcam_explanation ? `\n\n💡 ${result.gradcam_explanation}` : ''),
      timestamp: now,
    });
  }

  if (result.explanation_points?.length) {
    msgs.push({
      id: 'auto-explain', role: 'ai',
      content: `📋 KEY FINDINGS\n\n${result.explanation_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
      timestamp: now,
    });
  }

  if (result.clinical_narrative) {
    msgs.push({ id: 'auto-narrative', role: 'ai', content: `📝 CLINICAL NARRATIVE\n\n${result.clinical_narrative}`, timestamp: now });
  }

  return msgs;
}

export default AnalysisWorkspace;
