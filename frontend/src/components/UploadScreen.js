import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { usePatientStore } from '../store/patientStore';
import { Upload, User, Microscope, ChevronRight, ChevronLeft, Sparkles, Check, AlertTriangle, X } from 'lucide-react';
import PixelMosaic from './PixelMosaic';
import { analyzeImage } from '../services/api';

const PARTICLES = Array.from({ length: 30 }).map((_, i) => ({
  size: 3 + ((i * 7) % 7),
  top: 5 + (Math.floor(i / 6)) * 18 + (i % 3) * 4,
  left: 3 + (i % 6) * 16 + ((i * 3) % 8),
  duration: 10 + (i % 6) * 2.5,
  delay: (i % 10) * 0.8,
  color: i % 3 === 0 ? 'rgba(124,92,252,0.5)' : i % 3 === 1 ? 'rgba(56,189,248,0.5)' : 'rgba(16,185,129,0.4)',
}));

const stepMeta = [
  { icon: <User size={18} />, label: 'Patient Info', color: '#06b6d4' },
  { icon: <Upload size={18} />, label: 'Upload Image', color: '#7c5cfc' },
  { icon: <Microscope size={18} />, label: 'Analyze', color: '#10b981' },
];

const UploadScreen = () => {
  const fileInputRef = useRef(null);
  const cardContainerRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [base64Preview, setBase64Preview] = useState(null);
  const [step, setStep] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState(false);

  const {
    uploadedImage, patientContext,
    setUploadedImage, setPatientContext,
    setIsLoading, setActiveScreen, setAnalysisResult,
    setAnalysisError, analysisError, setViewMode,
  } = useAppStore();

  const {
    patients, findOrCreatePatient, addSession, updateSessionResult,
    setActivePatientAndSession,
  } = usePatientStore();

  useEffect(() => {
    if (uploadedImage && !preview) {
      const url = URL.createObjectURL(uploadedImage);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedImage, preview]);

  const handleFile = (file) => {
    if (!file) return;
    setUploadedImage(file);
    const objUrl = URL.createObjectURL(file);
    setPreview(objUrl);
    // Convert to base64 for persistent storage (survives re-login)
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBase64Preview(ev.target.result);
      setTimeout(() => setStep(2), 600);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleMouseMove = useCallback((e) => {
    const { innerWidth, innerHeight } = window;
    setParallax({
      x: (e.clientX - innerWidth / 2) / innerWidth,
      y: (e.clientY - innerHeight / 2) / innerHeight,
    });
  }, []);

  // Auto-scroll active step to center of viewport
  useEffect(() => {
    const container = cardContainerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll('[data-step-card]');
    const activeCard = cards[step];
    if (activeCard) {
      const cardRect = activeCard.getBoundingClientRect();
      const viewPortCenter = window.innerHeight / 2;
      const cardCenter = cardRect.top + cardRect.height / 2;
      const scrollOffset = cardCenter - viewPortCenter;
      window.scrollBy({ top: scrollOffset, behavior: 'smooth' });
    }
  }, [step]);

  const handleAnalyze = async () => {
    if (!uploadedImage) return;

    // Clear any previous error
    setAnalysisError(null);
    setViewMode('gradcam'); // always open workspace in Grad-CAM view
    setIsLoading(true);
    setActiveScreen('analysis');

    // Create / find patient record
    const pName = patientName.trim() || 'Unnamed Patient';
    const patientId = findOrCreatePatient(pName, patientContext.age, patientContext.gender);

    // Create patient data message
    const patientParts = [];
    if (uploadedImage?.name) patientParts.push(`📎 Uploaded: ${uploadedImage.name}`);
    patientParts.push(`🔍 Analysis type: Auto-detected by AI`);
    if (patientContext?.age) patientParts.push(`👤 Age: ${patientContext.age}`);
    if (patientContext?.gender) patientParts.push(`⚤ Gender: ${patientContext.gender}`);

    const initialMessages = [{
      id: 'msg-patient-' + Date.now(),
      role: 'patient',
      content: patientParts.join('\n'),
      timestamp: new Date().toISOString(),
    }];

    // Create session
    const sessionId = addSession(patientId, {
      diseaseType: null,
      imagePreview: base64Preview || preview || '',
      messages: initialMessages,
    });

    try {
      const result = await analyzeImage({
        imageFile: uploadedImage,
        diseaseType: null,
        patientAge: patientContext.age || null,
        patientGender: patientContext.gender || null,
      });

      setAnalysisResult(result);

      // Build AI chat messages from the enriched result
      const now = new Date().toISOString();
      const aiMessages = [];

      // Risk badge line
      const riskColor = result.risk_level === 'HIGH' ? '🔴' : result.risk_level === 'MODERATE' ? '🟠' : '🟢';
      const conf = ((result.confidence_score || 0) * 100).toFixed(1);
      const sev = (result.severity_score || 0).toFixed(1);
      const consensus = (result.xai_consensus || 'medium').toUpperCase();

      aiMessages.push({
        id: 'msg-diag-' + Date.now(),
        role: 'ai',
        content:
          `🧠 DIAGNOSIS: ${result.diagnosis_label}\n\n` +
          `📊 Confidence: ${conf}%\n` +
          `⚠️ Severity: ${sev}/10\n` +
          `${riskColor} Risk Level: ${result.risk_level}\n` +
          `🔗 XAI Consensus: ${consensus}` +
          (result.gradcam_region ? `\n📍 Grad-CAM focus: ${result.gradcam_region}` : '') +
          (result.shap_region ? `\n📍 SHAP focus: ${result.shap_region}` : '') +
          (result.gradcam_explanation ? `\n\n💡 ${result.gradcam_explanation}` : ''),
        timestamp: now,
      });

      // Explanation points
      if (result.explanation_points?.length) {
        aiMessages.push({
          id: 'msg-explain-' + Date.now(),
          role: 'ai',
          content: `📋 KEY FINDINGS\n\n${result.explanation_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
          timestamp: now,
        });
      }

      // Clinical narrative
      if (result.clinical_narrative) {
        aiMessages.push({
          id: 'msg-narr-' + Date.now(),
          role: 'ai',
          content: `📝 CLINICAL NARRATIVE\n\n${result.clinical_narrative}`,
          timestamp: now,
        });
      }

      // Persist to patient store
      // Use atomic setter to avoid the race condition where setActivePatient
      // wipes activeSessionId to null before setActiveSession can run.
      updateSessionResult(patientId, sessionId, result, [...initialMessages, ...aiMessages]);
      setActivePatientAndSession(patientId, sessionId);
      setIsLoading(false);

    } catch (error) {
      // Structured error from api.js — show it to the user, stay on upload screen
      console.error('[ExplainableMed] Analysis error:', error);
      setIsLoading(false);
      setActiveScreen('upload');
      setAnalysisError(error);
    }
  };

  // Backend auto-detects disease — just need image + step 2
  const canAnalyze = !!uploadedImage && step === 2;

  // --- Button styles ---
  const btnPrimary = (enabled) => ({
    padding: '12px 26px', borderRadius: 999, border: 'none',
    fontSize: 13, fontWeight: 600, color: '#fff',
    background: enabled ? 'linear-gradient(135deg, #7c5cfc, #a855f7)' : 'rgba(130,130,255,0.15)',
    opacity: enabled ? 1 : 0.5, cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: 8,
    boxShadow: enabled ? '0 8px 25px rgba(124,92,252,0.25)' : 'none',
  });

  const btnBack = {
    padding: '10px 18px', borderRadius: 999, border: '1px solid rgba(130,130,255,0.15)',
    background: 'transparent', color: 'var(--text-secondary)', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.3s ease',
  };

  // --- Card style: active = bright, inactive = very dim/blacked-out ---
  const getCardStyle = (idx) => {
    const isActive = idx === step;
    const isCompleted = idx < step;
    return {
      borderRadius: 24, padding: isActive ? 32 : 24,
      background: isActive ? 'rgba(12,12,30,0.92)' : 'rgba(8,8,18,0.5)',
      border: isActive
        ? `1px solid ${stepMeta[idx].color}50`
        : isCompleted ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(130,130,255,0.04)',
      boxShadow: isActive
        ? `0 40px 100px rgba(0,0,0,0.6), 0 0 80px ${stepMeta[idx].color}25, 0 0 160px ${stepMeta[idx].color}10, inset 0 1px 0 rgba(255,255,255,0.05)`
        : 'none',
      animation: isActive ? 'ambientCardGlow 3s ease-in-out infinite' : 'none',
      backdropFilter: isActive ? 'blur(20px)' : 'none',
      opacity: isActive ? 1 : isCompleted ? 0.35 : 0.15,
      pointerEvents: isActive || isCompleted ? 'auto' : 'none',
      transform: isActive
        ? `perspective(800px) rotateX(${parallax.y * -4}deg) rotateY(${parallax.x * 4}deg) scale(1)`
        : isCompleted ? 'scale(0.96)' : 'scale(0.94)',
      transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative', overflow: 'hidden',
      filter: isActive ? 'none' : 'brightness(0.5)',
    };
  };

  return (
    <main
      onMouseMove={handleMouseMove}
      style={{
        paddingTop: 96, paddingBottom: 80, paddingInline: 24,
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* PixelMosaic background animation */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <PixelMosaic />
      </div>

      {/* Background parallax orbs */}
      <div style={{
        position: 'fixed', top: '10%', left: '5%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.06), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
        transform: `translate3d(${parallax.x * -120}px, ${parallax.y * -80}px, 0)`,
        transition: 'transform 0.1s linear',
        animation: 'morphBlob 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '5%', right: '10%', width: 350, height: 350,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.05), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
        transform: `translate3d(${parallax.x * 100}px, ${parallax.y * 80}px, 0)`,
        transition: 'transform 0.1s linear',
        animation: 'morphBlob 25s ease-in-out infinite reverse',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto' }}>

        {/* ===== Error Banner ===== */}
        {analysisError && (
          <div style={{
            marginBottom: 24,
            padding: '16px 20px',
            borderRadius: 16,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'flex-start', gap: 14,
            animation: 'fadeInUp 0.4s ease both',
          }}>
            <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>
                Analysis Failed
              </div>
              <div style={{ fontSize: 13, color: 'rgba(248,113,113,0.85)', lineHeight: 1.6 }}>
                {analysisError.message}
              </div>
              {analysisError.hint && (
                <div style={{ fontSize: 12, color: 'rgba(248,113,113,0.6)', marginTop: 6 }}>
                  💡 {analysisError.hint}
                </div>
              )}
            </div>
            <button
              onClick={() => setAnalysisError(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(248,113,113,0.6)', padding: 4, flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, marginBottom: 10,
            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em',
          }}>
            Build an{' '}
            <span style={{
              background: 'linear-gradient(135deg, #7c5cfc, #a855f7, #3b82f6)',
              backgroundSize: '200% 200%', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', animation: 'gradientRotate 5s ease infinite',
            }}>explainable case</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
            A guided track from image upload to an explainable clinical report.
          </p>
        </div>

        {/* Main: fixed tracker is out of flow, cards offset to the right */}
        <div style={{ position: 'relative' }}>
          {/* ===== LEFT: Vertical step tracker — vertically centered, fixed ===== */}
          <div style={{
            position: 'fixed', top: '50%', left: 'max(24px, calc((100vw - 1120px) / 2))',
            transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 0,
            width: 200, zIndex: 50,
          }}>
            {stepMeta.map((s, i) => {
              const isActive = i === step;
              const isCompleted = i < step;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                  {/* Dot + line column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                    {/* Dot + outer glow ring */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {isActive && (
                        <div style={{
                          position: 'absolute', inset: -6,
                          borderRadius: '50%',
                          border: `2px solid ${s.color}30`,
                          animation: 'pulseGlow 2s ease-in-out infinite',
                        }} />
                      )}
                      <div
                        onClick={() => { if (isCompleted) setStep(i); }}
                        style={{
                          width: isActive ? 30 : 20,
                          height: isActive ? 30 : 20,
                          borderRadius: '50%',
                          border: `2px solid ${isActive ? s.color : isCompleted ? '#10b981' : 'rgba(130,130,255,0.12)'}`,
                          background: isCompleted
                            ? 'linear-gradient(135deg, #10b981, #22d3ee)'
                            : isActive
                            ? `${s.color}25`
                            : 'rgba(5,5,16,0.9)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.5s ease',
                          cursor: isCompleted ? 'pointer' : 'default',
                          boxShadow: isActive
                            ? `0 0 24px ${s.color}50, 0 0 48px ${s.color}20`
                            : isCompleted
                            ? '0 0 12px rgba(16,185,129,0.3)'
                            : 'none',
                        }}
                      >
                        {isCompleted && <Check size={12} color="#fff" strokeWidth={3} />}
                        {isActive && <div style={{
                          width: 9, height: 9, borderRadius: '50%',
                          background: s.color,
                          boxShadow: `0 0 10px ${s.color}`,
                          animation: 'pulseGlow 2s ease infinite',
                        }} />}
                      </div>
                    </div>
                    {/* Connecting line */}
                    {i < 2 && (
                      <div style={{
                        width: 2, flex: 1, minHeight: 48,
                        background: isCompleted
                          ? 'linear-gradient(to bottom, #10b981, #10b98140)'
                          : 'rgba(130,130,255,0.06)',
                        transition: 'background 0.5s ease',
                      }} />
                    )}
                  </div>

                  {/* Label + Pointer Arrow */}
                  <div
                    onClick={() => { if (isCompleted) setStep(i); }}
                    style={{
                      paddingLeft: 14, paddingTop: 0, paddingBottom: i < 3 ? 40 : 0,
                      cursor: isCompleted ? 'pointer' : 'default',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: 2, marginBottom: 4,
                      color: isActive ? s.color : isCompleted ? '#10b981' : 'var(--text-tertiary)',
                      transition: 'color 0.3s ease',
                    }}>
                      Step {i + 1}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#f0f0ff' : isCompleted ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                      transition: 'color 0.3s ease',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{
                        color: isActive ? s.color : isCompleted ? '#10b981' : 'var(--text-tertiary)',
                        transition: 'color 0.3s ease',
                      }}>{s.icon}</span>
                      {s.label}
                    </div>

                    {/* Pointer arrow — shows on active step, bigger & glowing */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', top: 2, right: -36,
                        display: 'flex', alignItems: 'center', gap: 0,
                      }}>
                        {/* Glowing line */}
                        <div style={{
                          width: 16, height: 2,
                          background: `linear-gradient(90deg, transparent, ${s.color}80)`,
                          borderRadius: 2,
                        }} />
                        {/* Arrow head */}
                        <div style={{
                          width: 0, height: 0,
                          borderTop: '10px solid transparent',
                          borderBottom: '10px solid transparent',
                          borderLeft: `14px solid ${s.color}`,
                          filter: `drop-shadow(0 0 10px ${s.color}80) drop-shadow(0 0 20px ${s.color}40)`,
                          animation: 'arrowPulse 1.5s ease-in-out infinite',
                        }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===== RIGHT: Step cards — offset to clear fixed tracker ===== */}
          <div ref={cardContainerRef} style={{
            display: 'flex', flexDirection: 'column', gap: 24,
            paddingLeft: 260,
            maxWidth: 900, marginLeft: 'auto', marginRight: 'auto',
            transform: `translate3d(${parallax.x * 10}px, ${parallax.y * 14}px, 0)`,
            transition: 'transform 0.12s linear',
          }}>
            {/* ---- Step 1: Patient Info ---- */}
            <section data-step-card style={getCardStyle(0)}>
              {step === 0 && <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${stepMeta[0].color}60, transparent)` }} />}

              <header style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: stepMeta[0].color, fontWeight: 700, marginBottom: 6 }}>Step 1</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Patient information</h2>
              </header>

              {/* Existing patient dropdown */}
              {patients.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    Select existing patient
                    <select
                      defaultValue=""
                      onChange={e => {
                        const pid = e.target.value;
                        if (!pid) return;
                        const p = patients.find(p => p.id === pid);
                        if (!p) return;
                        setPatientName(p.name || '');
                        setPatientContext({ age: p.age || '', gender: p.gender || '' });
                      }}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 14,
                        border: '1px solid rgba(130,130,255,0.15)',
                        background: 'rgba(12,12,30,0.85)', color: 'var(--text-primary)',
                        outline: 'none', fontSize: 14, cursor: 'pointer',
                        transition: 'border-color 0.3s ease',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.15)'; }}
                    >
                      <option value="">— New patient —</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}{p.age ? ` · ${p.age}yr` : ''}{p.gender ? ` · ${p.gender}` : ''}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  Patient Name *
                  <input type="text" placeholder="e.g. Rahul Sharma" value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(130,130,255,0.1)', background: 'rgba(12,12,30,0.8)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.3s ease', fontSize: 14, boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.1)'; }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
                  Age
                  <input type="number" min={0} max={120} value={patientContext.age}
                    onChange={e => setPatientContext({ age: e.target.value })}
                    style={{ width: 110, padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(130,130,255,0.1)', background: 'rgba(12,12,30,0.8)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.3s ease', fontSize: 14 }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.1)'; }}
                  />
                </label>
                <label style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
                  Gender
                  <select value={patientContext.gender}
                    onChange={e => setPatientContext({ gender: e.target.value })}
                    style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(130,130,255,0.1)', background: 'rgba(12,12,30,0.8)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.3s ease', fontSize: 14 }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.1)'; }}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20, padding: '10px 16px', borderRadius: 12, background: 'rgba(130,130,255,0.03)', border: '1px solid rgba(130,130,255,0.06)' }}>
                💡 Patient records are stored locally — you can revisit them anytime from the Workspace.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setStep(1)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(124,92,252,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(124,92,252,0.25)'; }}
                  style={btnPrimary(true)}
                >Continue <ChevronRight size={16} /></button>
              </div>
            </section>


            {/* ---- Step 2: Upload Image ---- */}
            <section data-step-card style={getCardStyle(1)}>
              {step === 1 && <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${stepMeta[1].color}60, transparent)` }} />}

              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: stepMeta[1].color, fontWeight: 700, marginBottom: 6 }}>Step 2</div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Upload medical image</h2>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '5px 14px', borderRadius: 999, background: 'rgba(130,130,255,0.05)', border: '1px solid rgba(130,130,255,0.08)' }}>JPG / PNG</div>
              </header>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  borderRadius: 20,
                  border: dragOver ? '2px solid rgba(124,92,252,0.6)' : '2px dashed rgba(130,130,255,0.2)',
                  background: dragOver ? 'rgba(124,92,252,0.06)' : 'radial-gradient(circle at top, rgba(124,92,252,0.05), transparent 60%)',
                  padding: 36, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 260, transition: 'all 0.4s ease', position: 'relative', overflow: 'hidden',
                }}
              >
                {dragOver && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.08), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }} />}
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxHeight: 300, maxWidth: '100%', borderRadius: 16, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }} />
                ) : (
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#a78bfa' }}>
                      <Upload size={28} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#f0f0ff' }}>Drag &amp; drop or click to upload</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Chest X‑ray or dermoscopy images</div>
                  </div>
                )}
                <input type="file" accept="image/png,image/jpeg" ref={fileInputRef} style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => setStep(0)} style={btnBack}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.15)'; }}
                ><ChevronLeft size={14} /> Back</button>
                <button disabled={!uploadedImage} onClick={() => setStep(2)}
                  onMouseEnter={e => { if (uploadedImage) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(124,92,252,0.4)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = uploadedImage ? '0 8px 25px rgba(124,92,252,0.25)' : 'none'; }}
                  style={btnPrimary(!!uploadedImage)}
                >Continue <ChevronRight size={16} /></button>
              </div>
            </section>

            {/* ---- Step 3: Summary & Analyze ---- */}
            <section data-step-card style={getCardStyle(2)}>
              {step === 2 && <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${stepMeta[2].color}60, transparent)` }} />}

              <header style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: stepMeta[2].color, fontWeight: 700, marginBottom: 6 }}>Step 3</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Review & analyze</h2>
              </header>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ padding: 24, borderRadius: 18, background: 'rgba(130,130,255,0.03)', border: '1px solid rgba(130,130,255,0.08)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 2 }}>
                  <div><strong style={{ color: '#f0f0ff' }}>Patient:</strong> {patientName || '—'}</div>
                  <div><strong style={{ color: '#f0f0ff' }}>Image:</strong> {uploadedImage ? uploadedImage.name : '—'}</div>
                  <div><strong style={{ color: '#f0f0ff' }}>Disease type:</strong> <span style={{ color: '#a78bfa', fontStyle: 'italic' }}>Auto-detected by AI ✨</span></div>
                  <div><strong style={{ color: '#f0f0ff' }}>Age:</strong> {patientContext.age || '—'}</div>
                  <div><strong style={{ color: '#f0f0ff' }}>Gender:</strong> {patientContext.gender || '—'}</div>
                </div>
                <div style={{ padding: 24, borderRadius: 18, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 600, color: '#10b981', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} /> The system will generate:
                  </div>
                  <ul style={{ paddingLeft: 18, lineHeight: 2.2 }}>
                    <li>Diagnosis label + confidence</li>
                    <li>Grad‑CAM & SHAP overlays</li>
                    <li>SHAP feature contribution chart</li>
                    <li>LLM clinical narrative</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => setStep(2)} style={btnBack}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(130,130,255,0.15)'; }}
                ><ChevronLeft size={14} /> Back</button>
                <button disabled={!canAnalyze} onClick={handleAnalyze}
                  onMouseEnter={e => { if (canAnalyze) { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(16,185,129,0.45), 0 0 40px rgba(56,189,248,0.3)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = canAnalyze ? '0 12px 35px rgba(16,185,129,0.3), 0 0 30px rgba(56,189,248,0.2)' : 'none'; }}
                  style={{
                    padding: '18px 40px', borderRadius: 999, border: 'none',
                    fontSize: 16, fontWeight: 700, color: '#020617',
                    background: canAnalyze ? 'linear-gradient(135deg, #00d4ff, #10b981, #22c55e)' : 'rgba(130,130,255,0.15)',
                    backgroundSize: canAnalyze ? '200% 200%' : 'auto',
                    boxShadow: canAnalyze ? '0 12px 35px rgba(16,185,129,0.3), 0 0 30px rgba(56,189,248,0.2)' : 'none',
                    animation: canAnalyze ? 'gradientRotate 3s ease infinite, pulse-glow 2s ease-in-out infinite' : 'none',
                    opacity: canAnalyze ? 1 : 0.4,
                    cursor: canAnalyze ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                ><Microscope size={18} /> Analyze image →</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UploadScreen;
