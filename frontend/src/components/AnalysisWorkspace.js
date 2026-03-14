import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '../store/appStore';
import { usePatientStore } from '../store/patientStore';
import { useAuthStore } from '../store/authStore';
import { chatWithLLM } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import {
    ArrowLeft, Download, Eye, Layers, SplitSquareVertical, Image,
    Activity, Send, User, Bot, Stethoscope,
    ChevronRight, Clock, FileImage, PanelRightOpen, PanelRightClose,
    FileText, Brain, BarChart3, Shield, ZoomIn, ZoomOut, Crosshair,
    GripVertical, MessageSquare,
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
    const riskLevel = result.risk_level || 'LOW';
    const riskColor = riskLevel === 'HIGH' ? '#f87171' : riskLevel === 'MODERATE' ? '#fbbf24' : '#34d399';
    const consensus = (result.xai_consensus || 'medium').toUpperCase();

    // Clinical narrative — show up to 320 chars, split at sentence for clean read
    const fullNarrative = result.clinical_narrative || '';
    const narrativeSnippet = fullNarrative.length > 320
        ? fullNarrative.slice(0, 317).trimEnd() + '…'
        : fullNarrative || null;

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
                    maxWidth: 640,
                    padding: '20px 28px',
                    borderRadius: 32,
                    background: 'rgba(8,8,22,0.92)',
                    backdropFilter: 'blur(50px) saturate(2)',
                    WebkitBackdropFilter: 'blur(50px) saturate(2)',
                    border: '1px solid rgba(130,130,255,0.2)',
                    boxShadow:
                        '0 30px 100px rgba(0,0,0,0.8), 0 0 60px rgba(124,92,252,0.2), 0 0 120px rgba(56,189,248,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 20,
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

                {/* Pulsing brain icon */}
                <div style={{
                    width: 52, height: 52, borderRadius: 18, flexShrink: 0, marginTop: 2,
                    background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 28px rgba(124,92,252,0.4)',
                    animation: 'pulseGlow 2s ease-in-out infinite',
                }}><Brain size={26} color="#fff" /></div>

                {/* Diagnosis info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 17, fontWeight: 800, color: 'var(--text-primary)',
                        marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: "'Space Grotesk', sans-serif",
                        letterSpacing: '-0.01em',
                    }}>{result.diagnosis_label}</div>
                    {/* Stats row */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, flexWrap: 'wrap',
                        marginBottom: narrativeSnippet ? 10 : 0
                    }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <BarChart3 size={12} /> {conf}%
                        </span>
                        <span style={{
                            color: parseFloat(sev) >= 7 ? '#f87171' : parseFloat(sev) >= 4 ? '#fbbf24' : '#34d399',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <Shield size={12} /> Sev {sev}/10
                        </span>
                        {result.gradcam_region && (
                            <span style={{ color: 'rgba(180,180,220,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                📍 {result.gradcam_region}
                            </span>
                        )}
                        <span style={{
                            padding: '2px 9px', borderRadius: 999, fontSize: 9,
                            fontWeight: 700, letterSpacing: 0.5,
                            background: riskLevel === 'LOW' ? 'rgba(52,211,153,0.12)' : riskLevel === 'MODERATE' ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)',
                            color: riskColor,
                            border: `1px solid ${riskColor}44`,
                        }}>{riskLevel} RISK</span>
                    </div>

                    {/* Clinical narrative — full responsive block */}
                    {narrativeSnippet && (
                        <div style={{
                            fontSize: 11.5, color: 'rgba(190,190,230,0.82)', lineHeight: 1.65,
                            padding: '10px 14px', borderRadius: 12,
                            background: 'rgba(124,92,252,0.05)',
                            border: '1px solid rgba(124,92,252,0.1)',
                            maxHeight: 110, overflowY: 'auto',
                        }}>
                            📋 {narrativeSnippet}
                        </div>
                    )}
                </div>

                {/* Dismiss hint */}
                <div style={{
                    fontSize: 10, color: 'var(--text-tertiary)',
                    letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700,
                    padding: '6px 12px', borderRadius: 8, flexShrink: 0,
                    background: 'rgba(130,130,255,0.06)',
                    border: '1px solid rgba(130,130,255,0.1)',
                }}>TAP</div>
            </div>
        </>,
        document.body
    );
};

/* ============================================================
   GradCAM Feature Label Map — disease-specific clinical descriptions
   for each SHAP region, shown in annotation pin tooltips.
   ============================================================ */
const GRADCAM_FEATURE_MAP = {
    braintumor: {
        'Upper Right': { label: 'Right Frontal/Parietal Lobe', desc: 'Glioma & meningioma hotspot — motor cortex proximity' },
        'Upper Left': { label: 'Left Frontal Lobe', desc: "Language-centre proximity \u2014 Broca's area involvement risk" },
        'Lower Right': { label: 'Right Temporal/Occipital', desc: 'Visual cortex & temporal lobe activation' },
        'Lower Left': { label: 'Left Temporal/Cerebellar', desc: 'Cerebellar & posterior temporal activation' },
        'Middle Right': { label: 'Right Central Region', desc: 'Motor cortex proximity — high clinical significance' },
        'Middle Left': { label: 'Left Central Region', desc: 'Speech/motor cortex area — dominant hemisphere risk' },
        'Diffuse': { label: 'Diffuse Multi-focal', desc: 'Widespread activation — possible diffuse glioma' },
    },
    pneumonia: {
        'Lower Right': { label: 'Right Lower Lobe', desc: 'Primary lobar pneumonia consolidation zone' },
        'Lower Left': { label: 'Left Lower Lobe', desc: 'Left lower lobe infiltrate — atypical pattern' },
        'Middle Right': { label: 'Right Middle Lobe', desc: 'Aspiration pneumonia common site' },
        'Middle Left': { label: 'Left Middle Zone', desc: 'Early consolidation or pleural involvement' },
        'Upper Right': { label: 'Right Upper Lobe', desc: 'Reactivation TB or atypical pneumonia' },
        'Upper Left': { label: 'Left Upper Lobe', desc: 'Primary or atypical TB pattern' },
        'Diffuse': { label: 'Bilateral Diffuse', desc: 'Extensive pneumonia or pulmonary edema' },
    },
    skincancer: {
        'Upper Right': { label: 'Asymmetric Color Zone', desc: 'Irregular pigmentation — ABCDE criterion hit' },
        'Upper Left': { label: 'Irregular Network', desc: 'Pigment network disruption detected' },
        'Lower Right': { label: 'Atypical Vascular Zone', desc: 'Atypical vascular structures — malignant indicator' },
        'Lower Left': { label: 'Pigmentation Anomaly', desc: 'Prominent pigmentation — structural disorganisation' },
        'Middle Right': { label: 'Core Dermoscopic Features', desc: 'Central lesion features driving classification' },
        'Middle Left': { label: 'Blue-White Veil Zone', desc: 'Regression structures or blue-white veil' },
        'Diffuse': { label: 'Diffuse Architectural Disorder', desc: 'Widespread disorganisation across the lesion' },
    },
    lungcolon: {
        'Upper Right': { label: 'Glandular Architecture', desc: 'Adenocarcinoma glands or squamous nests detected' },
        'Upper Left': { label: 'Histopathological Region', desc: 'Cellular density variation driving prediction' },
        'Lower Right': { label: 'Adenocarcinoma Zone', desc: 'Glandular or squamous cell architecture change' },
        'Lower Left': { label: 'Tissue Architecture', desc: 'Tissue-level morphology consistent with prediction' },
        'Middle Right': { label: 'High-Density Cell Region', desc: 'Mitotic figures and cellular crowding present' },
        'Middle Left': { label: 'Central Histology Zone', desc: 'Central tissue architecture — mitosis possible' },
        'Diffuse': { label: 'Widespread Tissue Abnormality', desc: 'Diffuse slide activation across the specimen' },
    },
    retina: {
        'Upper Right': { label: 'Superior Temporal Retina', desc: 'NVE / laser photocoagulation scar zone' },
        'Upper Left': { label: 'Superior Nasal Quadrant', desc: 'Pathological retinal disease features' },
        'Lower Right': { label: 'Inferior Temporal Quad', desc: 'Microaneurysms & hard exudates site' },
        'Lower Left': { label: 'Inferior Nasal Quad', desc: 'Inferior nasal retinal activation noted' },
        'Middle Right': { label: 'Macular Zone', desc: 'Critical visual acuity region — macula adjacent' },
        'Middle Left': { label: 'Peripapillary Region', desc: 'Optic disc margin — NVD risk zone' },
        'Diffuse': { label: 'Pan-Retinal Disease', desc: 'Bilateral diffuse — consistent with PDR' },
    },
};

function getFeatureInfo(diseaseType, regionName) {
    const dMap = GRADCAM_FEATURE_MAP[diseaseType] || {};
    return dMap[regionName] || { label: regionName, desc: 'Region of interest identified by model' };
}

/* ============================================================
   ANNOTATION OVERLAY — ONLY backend gradcam_pin data.
   Shows: crosshair at peak_x/peak_y + bounding box + tooltip.
   No SHAP quadrant numbered pins.
   ============================================================ */
const AnnotationOverlay = ({ annotationData, containerWidth, containerHeight }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [showPanel, setShowPanel] = useState(false);

    const pin = annotationData?.gradcam_pin;
    const shapQuadrants = annotationData?.shap_quadrants || [];
    if (!pin || !containerWidth || !containerHeight) return null;

    const W = containerWidth, H = containerHeight;
    const bbox = pin.bbox;
    const riskColor = pin.risk_color || '#f87171';
    const CH = Math.max(18, Math.min(26, W * 0.06));
    const cx = pin.peak_x * W;
    const cy = pin.peak_y * H;

    return (
        <>
            {/* === Overlay layer === */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>

                {/* Bounding box */}
                {bbox && (
                    <div style={{
                        position: 'absolute',
                        left: bbox.x * W,
                        top: bbox.y * H,
                        width: bbox.width * W,
                        height: bbox.height * H,
                        border: `2px solid ${riskColor}`,
                        borderRadius: 4,
                        boxShadow: `0 0 14px ${riskColor}44, inset 0 0 8px ${riskColor}11`,
                        pointerEvents: 'none',
                    }} />
                )}

                {/* Crosshair hit-area */}
                <div
                    style={{
                        position: 'absolute', left: cx - CH / 2, top: cy - CH / 2,
                        width: CH, height: CH,
                        pointerEvents: 'auto', cursor: 'pointer', zIndex: 10,
                    }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={(e) => { e.stopPropagation(); setShowPanel(true); setShowTooltip(false); }}
                >
                    {/* Pulse ring */}
                    <div style={{
                        position: 'absolute', inset: -4, borderRadius: '50%',
                        border: `1.5px solid ${riskColor}`,
                        animation: 'waterRipple 1.8s ease-out infinite',
                        pointerEvents: 'none',
                    }} />
                    {/* Vertical bar */}
                    <div style={{
                        position: 'absolute', left: '50%', top: 0,
                        width: 2, height: CH,
                        background: riskColor, boxShadow: `0 0 6px ${riskColor}`,
                        transform: 'translateX(-50%)', borderRadius: 1,
                    }} />
                    {/* Horizontal bar */}
                    <div style={{
                        position: 'absolute', top: '50%', left: 0,
                        height: 2, width: CH,
                        background: riskColor, boxShadow: `0 0 6px ${riskColor}`,
                        transform: 'translateY(-50%)', borderRadius: 1,
                    }} />
                    {/* Center dot */}
                    <div style={{
                        position: 'absolute', left: '50%', top: '50%',
                        width: 7, height: 7, borderRadius: '50%',
                        background: riskColor, boxShadow: `0 0 10px ${riskColor}`,
                        transform: 'translate(-50%, -50%)',
                    }} />
                </div>

                {/* Hover quick-tooltip */}
                {showTooltip && !showPanel && (
                    <div style={{
                        position: 'absolute',
                        left: Math.min(cx + 18, W - 240),
                        top: Math.max(cy - 54, 4),
                        width: 230, padding: '10px 13px',
                        borderRadius: 12,
                        background: 'rgba(6,4,18,0.97)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${riskColor}44`,
                        boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 20px ${riskColor}22`,
                        pointerEvents: 'none', zIndex: 30,
                        animation: 'fadeInUp 0.18s ease both',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor, boxShadow: `0 0 8px ${riskColor}`, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{pin.region_label}</span>
                            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: riskColor }}>{pin.confidence_pct}</span>
                        </div>
                        <div style={{ fontSize: 9.5, color: 'rgba(180,180,220,0.75)', lineHeight: 1.6, marginBottom: 5 }}>
                            {pin.short_explanation || pin.full_explanation?.slice(0, 120)}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 6, background: `${riskColor}18`, border: `1px solid ${riskColor}40`, fontSize: 9, fontWeight: 700, color: riskColor }}>
                            {pin.risk_level} RISK
                        </div>
                        <div style={{ marginTop: 7, fontSize: 9, color: 'rgba(130,130,255,0.5)', textAlign: 'center' }}>Click pin for full details</div>
                    </div>
                )}
            </div>

            {/* === Click-to-expand detail panel (fixed overlay) === */}
            {showPanel && ReactDOM.createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setShowPanel(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 8000,
                            background: 'rgba(0,0,0,0.35)',
                            backdropFilter: 'blur(3px)',
                            animation: 'fadeIn 0.2s ease both',
                        }}
                    />
                    {/* Detail panel */}
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 8001,
                        width: 460, maxWidth: '90vw',
                        maxHeight: '80vh', overflowY: 'auto',
                        borderRadius: 20,
                        background: 'rgba(8,6,22,0.97)',
                        backdropFilter: 'blur(40px)',
                        border: `1px solid ${riskColor}40`,
                        boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 40px ${riskColor}20`,
                        padding: '24px 26px',
                        animation: 'water-drop-in 0.35s ease both',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: riskColor, boxShadow: `0 0 10px ${riskColor}` }} />
                                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>{pin.region_label}</span>
                                    <span style={{ padding: '2px 9px', borderRadius: 8, background: `${riskColor}20`, border: `1px solid ${riskColor}50`, fontSize: 10, fontWeight: 700, color: riskColor, marginLeft: 4 }}>{pin.risk_level} RISK</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(130,130,255,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>Confidence: {pin.confidence_pct} · Peak ({(pin.peak_x * 100).toFixed(0)}%, {(pin.peak_y * 100).toFixed(0)}%)</div>
                            </div>
                            <button onClick={() => setShowPanel(false)} style={{ background: 'rgba(130,130,255,0.08)', border: '1px solid rgba(130,130,255,0.15)', borderRadius: 10, color: 'var(--accent-primary)', cursor: 'pointer', padding: '5px 10px', fontSize: 13 }}>✕</button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${riskColor}40, transparent)`, marginBottom: 18 }} />

                        {/* Full explanation */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(130,130,255,0.5)', fontWeight: 700, marginBottom: 8 }}>Clinical Explanation</div>
                            <p style={{ fontSize: 13, color: 'rgba(200,200,240,0.9)', lineHeight: 1.8, margin: 0 }}>{pin.full_explanation}</p>
                        </div>

                        {/* Bounding box info */}
                        {bbox && (
                            <div style={{ marginBottom: 18 }}>
                                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(130,130,255,0.5)', fontWeight: 700, marginBottom: 8 }}>Region of Interest</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {['x', 'y', 'width', 'height'].map(k => (
                                        <div key={k} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.1)', fontSize: 12 }}>
                                            <span style={{ color: 'rgba(130,130,255,0.5)', fontSize: 10 }}>{k.toUpperCase()}</span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: 8 }}>{(bbox[k] * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>
                </>,
                document.body
            )}
        </>
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
            gap: 10,
            maxWidth: '90%',
            alignSelf: bubbleAlign,
            animation: isLast ? 'fadeInUp 0.4s ease both' : 'none',
        }}>
            <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: avatarBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 3px 10px ${isAI ? 'rgba(124,92,252,0.25)' : isDoctor ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
            }}>{avatarIcon}</div>
            <div style={{ flex: 1 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                    flexDirection: isPatient ? 'row-reverse' : 'row',
                }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: isAI ? 'var(--accent-primary)' : isDoctor ? '#34d399' : '#60a5fa', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {roleLabel}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{timeStr}</span>
                </div>
                <div 
                    className={isAI ? 'chat-bubble-ai' : isDoctor ? 'chat-bubble-doctor' : 'chat-bubble-patient'}
                    style={{
                    padding: '10px 14px',
                    borderRadius: isPatient ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    background: bubbleBg,
                    border: `1px solid ${bubbleBorder}`,
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: isPatient ? 'var(--text-secondary)' : undefined,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}>{message.content}</div>
            </div>
        </div>
    );
};

/* ============================================================
   PATIENT SIDEBAR
   ============================================================ */
const PatientSidebar = ({ onSelectPatient, activePatientId }) => {
    const { patients, deletePatient } = usePatientStore();
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
                const isConfirming = confirmDeleteId === p.id;

                return (
                    <div key={p.id} style={{ position: 'relative' }}>
                        <button onClick={() => onSelectPatient(p.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 10px 10px 12px', borderRadius: 14, border: 'none',
                                background: isActive ? 'rgba(124,92,252,0.1)' : 'transparent',
                                cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left', width: '100%',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(130,130,255,0.05)'; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div style={{
                                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                background: isActive ? 'linear-gradient(135deg, #7c5cfc, #a855f7)' : 'rgba(130,130,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isActive ? '#fff' : 'var(--text-tertiary)',
                                fontSize: 12, fontWeight: 700, transition: 'all 0.3s ease',
                            }}>
                                {p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 12, fontWeight: isActive ? 600 : 500,
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{p.name}</div>
                                <div style={{
                                    fontSize: 10, color: 'var(--text-tertiary)',
                                    display: 'flex', alignItems: 'center', gap: 3, marginTop: 2,
                                }}>
                                    <Clock size={9} />
                                    {lastDate} · {p.sessions.length} sess.
                                </div>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={e => { e.stopPropagation(); setConfirmDeleteId(isConfirming ? null : p.id); }}
                                title="Delete patient"
                                style={{
                                    width: 24, height: 24, borderRadius: 7, border: 'none', flexShrink: 0,
                                    background: isConfirming ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)',
                                    color: '#f87171', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    fontSize: 13,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = isConfirming ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)'; }}
                            >🗑</button>
                        </button>

                        {/* Confirm delete banner */}
                        {isConfirming && (
                            <div style={{
                                margin: '2px 8px 4px', padding: '8px 12px', borderRadius: 10,
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            }}>
                                <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>Delete all data for {p.name}?</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        style={{
                                            padding: '3px 10px', borderRadius: 6, border: 'none',
                                            background: 'rgba(130,130,255,0.1)', color: 'var(--text-tertiary)',
                                            fontSize: 10, cursor: 'pointer',
                                        }}>Cancel</button>
                                    <button
                                        onClick={() => { deletePatient(p.id); setConfirmDeleteId(null); }}
                                        style={{
                                            padding: '3px 10px', borderRadius: 6, border: 'none',
                                            background: 'rgba(239,68,68,0.8)', color: '#fff',
                                            fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                        }}>Delete</button>
                                </div>
                            </div>
                        )}
                    </div>
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
            display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto',
            borderBottom: '1px solid rgba(130,130,255,0.06)',
            flexShrink: 0,
        }}>
            {patient.sessions.map(s => {
                const isActive = s.id === activeSessionId;
                const date = new Date(s.timestamp);
                return (
                    <button key={s.id} onClick={() => onSelectSession(s.id)}
                        style={{
                            padding: '6px 12px', borderRadius: 10, border: 'none',
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
   MAIN WORKSPACE — REDESIGNED: Large centered image + annotations
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
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [localPreview, setLocalPreview] = useState(null);
    const [showNotch, setShowNotch] = useState(false);
    const [notchResult, setNotchResult] = useState(null);
    const [imageZoom, setImageZoom] = useState(1.4);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const [chatWidth, setChatWidth] = useState(340);
    const [isDragging, setIsDragging] = useState(false);
    const chatEndRef = useRef(null);
    const prevSessionRef = useRef(null);
    const imageContainerRef = useRef(null);
    const dragStartRef = useRef({ x: 0, w: 0 });
    const [imgContainerSize, setImgContainerSize] = useState({ w: 0, h: 0 });
    const [renderedImgSize, setRenderedImgSize] = useState({ w: 0, h: 0 }); // actual rendered image px

    // Callback ref — fires whenever the img DOM node is mounted or unmounted.
    // Sets up a ResizeObserver so renderedImgSize always reflects the actual pixel size.
    const imgRef = useCallback((el) => {
        if (!el) return;
        const update = () => setRenderedImgSize({ w: el.clientWidth, h: el.clientHeight });
        const ro = new ResizeObserver(update);
        ro.observe(el);
        el.addEventListener('load', update);
        if (el.complete && el.naturalWidth) update();
        // No cleanup needed here — React unmounts old node before mounting new one
    }, []); // empty deps: callback identity is stable

    // Chat panel resize handlers
    const handleDragStart = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, w: chatWidth };
        const handleDragMove = (ev) => {
            const dx = dragStartRef.current.x - ev.clientX;
            const newW = Math.min(600, Math.max(220, dragStartRef.current.w + dx));
            setChatWidth(newW);
        };
        const handleDragEnd = () => {
            setIsDragging(false);
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        };
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
    }, [chatWidth]);

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

    // Measure image container
    useEffect(() => {
        const el = imageContainerRef.current;
        if (!el) return;
        const obs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setImgContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
            }
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // Trigger Dynamic Island notch when session changes
    useEffect(() => {
        const activePatient = patients.find(p => p.id === activePatientId);
        const activeSessionObj = activePatient?.sessions.find(s => s.id === activeSessionId);
        const sessionResult = activeSessionObj?.analysisResult || analysisResult;

        if (activeSessionId && activeSessionId !== prevSessionRef.current && sessionResult) {
            prevSessionRef.current = activeSessionId;
            setNotchResult(sessionResult);
            setShowNotch(true);
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

    // Build a compact text snapshot of the current analysis result for LLM context
    const buildAnalysisContext = (res) => {
        if (!res) return '';
        const lines = [];
        if (res.diagnosis_label) lines.push(`Diagnosis: ${res.diagnosis_label}`);
        if (res.confidence !== undefined) lines.push(`Confidence: ${(res.confidence * 100).toFixed(1)}%`);
        if (res.disease_type) lines.push(`Disease Type: ${res.disease_type}`);
        if (res.clinical_narrative) lines.push(`\nClinical Narrative:\n${res.clinical_narrative}`);
        if (res.annotation_data?.gradcam_pin) {
            const p = res.annotation_data.gradcam_pin;
            lines.push(`\nGrad-CAM Peak Region: ${p.region_label || ''} (${p.risk_level || ''} risk, ${p.confidence_pct || ''})`);
            if (p.full_explanation) lines.push(`Explanation: ${p.full_explanation}`);
        }
        if (res.shap_values?.length) {
            lines.push(`\nSHAP Top Features:`);
            res.shap_values.slice(0, 4).forEach(s => lines.push(`  - ${s.region_name}: ${s.value?.toFixed ? s.value.toFixed(3) : s.value}`));
        }
        return lines.join('\n');
    };

    // LLM Q&A send handler — stores all messages permanently in patientStore
    const handleSendChat = async () => {
        const text = noteText.trim();
        if (!text || isAiTyping) return;
        if (!activePatientId || !activeSessionId) return;

        // 1. Save the user message immediately (persisted to localStorage)
        addMessage(activePatientId, activeSessionId, { role: 'doctor', content: text });
        setNoteText('');
        setIsAiTyping(true);

        try {
            // 2. Build conversation history for the LLM (user/assistant pairs only)
            const history = (activeSessionObj?.messages || messages)
                .filter(m => m.role === 'doctor' || m.role === 'ai')
                .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
            // Append current user message
            history.push({ role: 'user', content: text });

            // 3. Build patient context string
            const activePatientObj = patients.find(p => p.id === activePatientId);
            const patCtx = [
                activePatientObj?.name ? `Name: ${activePatientObj.name}` : '',
                activePatientObj?.age ? `Age: ${activePatientObj.age}` : '',
                activePatientObj?.gender ? `Gender: ${activePatientObj.gender}` : '',
            ].filter(Boolean).join(' · ');

            // 4. Call LLM
            const reply = await chatWithLLM({
                messages: history,
                analysisContext: buildAnalysisContext(currentResult),
                patientContext: patCtx,
            });

            // 5. Persist AI reply
            addMessage(activePatientId, activeSessionId, { role: 'ai', content: reply });
        } catch (err) {
            const errMsg = err?.message || 'Failed to reach the AI. Please try again.';
            addMessage(activePatientId, activeSessionId, { role: 'ai', content: `⚠️ ${errMsg}` });
        } finally {
            setIsAiTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
    };

    const currentResult = activeSessionObj?.analysisResult || result;
    const bars = currentResult?.shap_values?.map(d => ({ name: d.region_name, value: d.value })) ?? [];
    const barColors = ['#7c5cfc', '#3b82f6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#a855f7', '#22d3ee'];

    const baseImage = currentResult?.original_image || activeSessionObj?.imagePreview || localPreview;
    // When Pins ON, prefer the backend-annotated overlay (it has clinical markings baked in)
    // Fall back to plain heatmap so it always shows something
    const overlay = viewMode === 'gradcam'
        ? (showAnnotations && currentResult?.annotated_gradcam) || currentResult?.gradcam_heatmap || null
        : viewMode === 'shap'
            ? (showAnnotations && currentResult?.annotated_shap) || currentResult?.shap_overlay || null
            : null;

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
            zIndex: 1,
        }}>
            {/* Dynamic Island Notch */}
            <DiagnosisNotch result={notchResult} visible={showNotch} onDismiss={() => setShowNotch(false)} />

            {/* ===== TOP BAR ===== */}
            <header className="ws-topbar" style={{
                height: TOPBAR_H, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px',
                borderBottom: '1px solid rgba(124,92,252,0.2)',
                background: 'linear-gradient(90deg, rgba(8,8,22,0.99), rgba(12,8,28,0.99))',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 500,
                boxShadow: '0 2px 0 rgba(124,92,252,0.18), 0 4px 24px rgba(0,0,0,0.4)',
            }}>
                <button onClick={handleNew}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,92,252,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(12,12,30,0.6)'; e.currentTarget.style.borderColor = 'rgba(130,130,255,0.15)'; }}
                    style={{
                        padding: '7px 16px', borderRadius: 10,
                        border: '1px solid rgba(130,130,255,0.15)',
                        background: 'rgba(12,12,30,0.6)',
                        color: 'var(--text-primary)', fontSize: 12, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.25s ease', cursor: 'pointer',
                    }}
                ><ArrowLeft size={13} /> New Analysis</button>

                <div style={{
                    fontWeight: 700, fontSize: 14,
                    fontFamily: "'Space Grotesk', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <Activity size={15} color="#7c5cfc" />
                    <span style={{
                        background: 'linear-gradient(135deg, var(--text-primary), var(--accent-primary))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Workspace</span>
                    {activePatient && (
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 4 }}>
                            — {activePatient.name}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowChat(!showChat)}
                        style={{
                            padding: '7px 12px', borderRadius: 10,
                            border: '1px solid rgba(130,130,255,0.12)',
                            background: showChat ? 'rgba(124,92,252,0.1)' : 'rgba(12,12,30,0.6)',
                            color: showChat ? 'var(--accent-primary)' : 'var(--text-primary)', fontSize: 12, fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.3s ease', cursor: 'pointer',
                        }}
                    >
                        {showChat ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
                        {showChat ? 'Hide Chat' : 'Show Chat'}
                    </button>
                    {/* Report — primary CTA */}
                    {currentResult && (
                        <button
                            onClick={() => { setActiveScreen('report'); }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.55)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(16,185,129,0.35)'; }}
                            style={{
                                padding: '8px 18px', borderRadius: 10, border: 'none',
                                background: 'linear-gradient( #10b981, #06b6d4)',
                                color: '#fff', fontSize: 12, fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: 7,

                                transition: 'all 0.25s ease', cursor: 'pointer',
                                letterSpacing: 0.3,

                            }}
                        ><Download size={14} /> Download Report</button>
                    )}
                </div>
            </header>

            {/* ===== BODY: sidebar + main area ===== */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: showChat ? `200px minmax(0,1fr) ${chatWidth}px` : '200px minmax(0,1fr)',
                minHeight: 0,
                overflow: 'hidden',
                transition: isDragging ? 'none' : 'grid-template-columns 0.3s ease',
            }}>

                {/* ===== LEFT SIDEBAR — patient list ===== */}
                <aside className="ws-patient-sidebar" style={{
                    borderRight: '1px solid rgba(124,92,252,0.1)',
                    display: 'flex', flexDirection: 'column',
                    background: 'linear-gradient(180deg, rgba(8,6,22,0.97), rgba(10,8,26,0.95))',
                    overflow: 'hidden',
                }}>
                    <div className="ws-patient-sidebar-header" style={{
                        padding: '14px 14px 12px',
                        borderBottom: '1px solid rgba(124,92,252,0.1)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        flexShrink: 0,
                        background: 'rgba(124,92,252,0.04)',
                    }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                            background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(168,85,247,0.2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(124,92,252,0.2)',
                        }}><User size={13} color="var(--accent-primary)" /></div>
                        <span style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: 1.5, color: 'var(--accent-primary)',
                        }}>Patients</span>
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

                    {/* Report Download — fixed bottom */}
                    <div className="ws-patient-sidebar-footer" style={{
                        flexShrink: 0,
                        padding: '10px 10px',
                        borderTop: '1px solid rgba(124,92,252,0.12)',
                        background: 'rgba(6,4,18,0.8)',
                    }}>
                        <button
                            onClick={handleDownload}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,92,252,0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,92,252,0.25)'; }}
                            style={{
                                width: '100%', padding: '10px 14px', borderRadius: 12,
                                border: 'none',
                                background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
                                color: '#fff', fontSize: 12, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                cursor: 'pointer', transition: 'all 0.3s ease',
                                boxShadow: '0 4px 16px rgba(124,92,252,0.25)',
                                letterSpacing: 0.3,
                            }}
                        >
                            <FileText size={14} />
                            Download Report
                        </button>
                    </div>
                </aside>

                {/* ===== CENTER — Large Image + Controls + SHAP chart ===== */}
                <div className="ws-center-column" style={{
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

                    {/* View mode tabs + zoom controls */}
                    <div style={{
                        padding: '7px 14px',
                        borderBottom: '1px solid rgba(124,92,252,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexShrink: 0,
                        background: 'linear-gradient(90deg, rgba(6,4,18,0.9), rgba(10,6,24,0.9))',
                        backdropFilter: 'blur(10px)',
                    }}>
                        {/* View mode pill group */}
                        <div style={{
                            display: 'flex', gap: 2, padding: '3px',
                            borderRadius: 12,
                            background: 'rgba(124,92,252,0.06)',
                            border: '1px solid rgba(124,92,252,0.1)',
                        }}>
                            {viewModes.map(opt => {
                                const isActive = viewMode === opt.id;
                                return (
                                    <button key={opt.id} onClick={() => setViewMode(opt.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            padding: '5px 12px', borderRadius: 9,
                                            border: 'none',
                                            background: isActive
                                                ? 'var(--bg-active, linear-gradient(135deg, rgba(124,92,252,0.35), rgba(168,85,247,0.25)))'
                                                : 'transparent',
                                            color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                            fontSize: 12, cursor: 'pointer', fontWeight: isActive ? 700 : 500,
                                            transition: 'all 0.2s ease',
                                            boxShadow: isActive ? '0 2px 10px rgba(124,92,252,0.25), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                                        }}
                                    >{opt.icon} {opt.label}</button>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {/* Annotation toggle */}
                            {bars.length > 0 && (
                                <button
                                    onClick={() => setShowAnnotations(!showAnnotations)}
                                    style={{
                                        padding: '5px 11px', borderRadius: 8,
                                        border: `1px solid ${showAnnotations ? 'rgba(248,113,113,0.3)' : 'rgba(124,92,252,0.15)'}`,
                                        background: showAnnotations ? 'rgba(248,113,113,0.1)' : 'rgba(124,92,252,0.06)',
                                        color: showAnnotations ? '#f87171' : '#a78bfa',
                                        fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        transition: 'all 0.25s ease',
                                        boxShadow: showAnnotations ? '0 0 10px rgba(248,113,113,0.15)' : 'none',
                                    }}
                                >
                                    <Crosshair size={11} />
                                    {showAnnotations ? 'Pins ON' : 'Pins OFF'}
                                </button>
                            )}

                            {/* Zoom controls */}
                            {(
                                <>
                                    <button onClick={() => setImageZoom(z => Math.max(0.5, z - 0.2))}
                                        style={{
                                            width: 28, height: 28, borderRadius: 8,
                                            border: '1px solid rgba(124,92,252,0.15)',
                                            background: 'rgba(124,92,252,0.06)', color: 'var(--accent-primary)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    ><ZoomOut size={13} /></button>
                                    <span style={{ fontSize: 10, color: 'var(--accent-primary)', minWidth: 36, textAlign: 'center', fontWeight: 700 }}>
                                        {Math.round(imageZoom * 100)}%
                                    </span>
                                    <button onClick={() => setImageZoom(z => Math.min(3, z + 0.2))}
                                        style={{
                                            width: 28, height: 28, borderRadius: 8,
                                            border: '1px solid rgba(124,92,252,0.15)',
                                            background: 'rgba(124,92,252,0.06)', color: 'var(--accent-primary)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                    ><ZoomIn size={13} /></button>
                                </>
                            )}

                            {/* Opacity slider */}
                            {viewMode !== 'original' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-tertiary)' }}>
                                    <span>Opacity</span>
                                    <input type="range" min={0} max={1} step={0.01} value={heatmapOpacity}
                                        onChange={e => setHeatmapOpacity(parseFloat(e.target.value))}
                                        style={{ width: 70, accentColor: '#7c5cfc', height: 3 }}
                                    />
                                    <span>{Math.round(heatmapOpacity * 100)}%</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* === Large Image Viewer === */}
                    <div
                        ref={imageContainerRef}
                        style={{
                            flex: 1, minHeight: 300,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'radial-gradient(ellipse at center, rgba(12,12,30,0.6), rgba(5,5,16,0.9))',
                            overflow: 'hidden',
                            position: 'relative',
                            padding: 4,
                        }}
                    >
                        {baseImage ? (
                            viewMode === 'split' ? (
                                /* === SPLIT VIEW: Original | Grad-CAM + Pins === */
                                <div style={{ display: 'flex', gap: 10, width: '100%', height: '100%', padding: 10 }}>

                                    {/* LEFT — Original scan, no annotations */}
                                    <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(124,92,252,0.12)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                        <img
                                            src={baseImage}
                                            alt="original"
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `scale(${imageZoom})`, transition: 'transform 0.3s ease', borderRadius: 12 }}
                                        />
                                        <div style={{ position: 'absolute', bottom: 10, left: 10, padding: '4px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', fontSize: 10, color: '#94a3b8', border: '1px solid rgba(130,130,255,0.1)', fontWeight: 600, letterSpacing: 0.5 }}>Original</div>
                                    </div>

                                    {/* RIGHT — Grad-CAM overlay + annotation pins */}
                                    <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(124,92,252,0.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                        <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0, transform: `scale(${imageZoom})`, transition: 'transform 0.3s ease', transformOrigin: 'center center' }}>
                                            {/* Base image */}
                                            <img
                                                src={baseImage}
                                                alt="gradcam-base"
                                                onLoad={e => setRenderedImgSize({ w: e.currentTarget.clientWidth, h: e.currentTarget.clientHeight })}
                                                style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 280px)', objectFit: 'contain', borderRadius: 12 }}
                                            />
                                            {/* Grad-CAM heatmap overlay */}
                                            {(currentResult?.gradcam_heatmap || currentResult?.annotated_gradcam) && (
                                                <img
                                                    src={currentResult.annotated_gradcam || currentResult.gradcam_heatmap}
                                                    alt="gradcam-overlay"
                                                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', borderRadius: 12, mixBlendMode: 'screen', opacity: heatmapOpacity, pointerEvents: 'none' }}
                                                />
                                            )}
                                            {/* Annotation pins — only on Grad-CAM side */}
                                            {currentResult?.annotation_data && renderedImgSize.w > 0 && (
                                                <AnnotationOverlay
                                                    annotationData={currentResult.annotation_data}
                                                    containerWidth={renderedImgSize.w}
                                                    containerHeight={renderedImgSize.h}
                                                />
                                            )}
                                        </div>
                                        <div style={{ position: 'absolute', bottom: 10, left: 10, padding: '4px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', fontSize: 10, color: 'var(--accent-primary)', border: '1px solid rgba(124,92,252,0.25)', fontWeight: 600, letterSpacing: 0.5 }}>Grad-CAM + Pins</div>
                                    </div>

                                </div>
                            ) : (
                                /* === SINGLE IMAGE WITH ANNOTATIONS === */
                                <div style={{
                                    position: 'relative',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '100%', height: '100%',
                                }}>
                                    {/* Inner wrapper — shrink-wraps to the actual rendered image size */}
                                    <div style={{
                                        position: 'relative',
                                        display: 'inline-block', // shrink to image pixel dimensions
                                        transform: `scale(${imageZoom})`,
                                        transition: 'transform 0.3s ease',
                                        transformOrigin: 'center center',
                                        lineHeight: 0, // remove inline gap below img
                                    }}>
                                        <img
                                            ref={imgRef}
                                            src={baseImage}
                                            alt="scan"
                                            onLoad={e => setRenderedImgSize({ w: e.currentTarget.clientWidth, h: e.currentTarget.clientHeight })}
                                            style={{
                                                display: 'block',
                                                maxWidth: imgContainerSize.w ? imgContainerSize.w - 24 : '100%',
                                                maxHeight: imgContainerSize.h ? imgContainerSize.h - 24 : 'calc(100vh - 260px)',
                                                objectFit: 'contain',
                                                borderRadius: 14,
                                                boxShadow: '0 20px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,92,252,0.08)',
                                            }}
                                        />

                                        {/* Grad-CAM / SHAP overlay — inset:0 fills the same box as img */}
                                        {overlay && viewMode !== 'original' && (
                                            <img src={overlay} alt="overlay" style={{
                                                position: 'absolute', inset: 0,
                                                width: '100%', height: '100%',
                                                objectFit: 'fill', borderRadius: 14,
                                                mixBlendMode: 'screen', opacity: heatmapOpacity,
                                                pointerEvents: 'none',
                                            }} />
                                        )}

                                        {/* Annotation — crosshair + bbox from gradcam_pin only */}
                                        {showAnnotations && currentResult?.annotation_data
                                            && renderedImgSize.w > 0 && (
                                                <AnnotationOverlay
                                                    annotationData={currentResult.annotation_data}
                                                    containerWidth={renderedImgSize.w}
                                                    containerHeight={renderedImgSize.h}
                                                />
                                            )}
                                    </div>

                                    {/* Image info badge — bottom left */}
                                    {currentResult?.diagnosis_label && (
                                        <div style={{
                                            position: 'absolute', bottom: 16, left: 16,
                                            padding: '8px 14px', borderRadius: 10,
                                            background: 'rgba(8,8,22,0.9)', backdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(130,130,255,0.12)',
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            fontSize: 12, color: 'var(--text-secondary)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                        }}>
                                            <Brain size={14} color="#7c5cfc" />
                                            <span style={{ fontWeight: 600, color: '#f0f0ff' }}>{currentResult.diagnosis_label}</span>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(168,85,247,0.15))',
                                                color: 'var(--text-primary)',
                                                border: '1px solid rgba(124,92,252,0.3)',
                                            }}>
                                                {((currentResult.confidence_score || 0) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}

                                    {/* View mode label badge — bottom right */}
                                    {viewMode !== 'original' && (
                                        <div style={{
                                            position: 'absolute', bottom: 14, right: 14,
                                            padding: '6px 14px', borderRadius: 10,
                                            background: viewMode === 'shap'
                                                ? 'rgba(16,185,129,0.15)'
                                                : 'rgba(124,92,252,0.15)',
                                            border: `1px solid ${viewMode === 'shap' ? 'rgba(16,185,129,0.3)' : 'rgba(124,92,252,0.35)'}`,
                                            fontSize: 10, fontWeight: 800,
                                            color: viewMode === 'shap' ? '#34d399' : '#c4b5fd',
                                            letterSpacing: 0.8, backdropFilter: 'blur(10px)',
                                            boxShadow: viewMode === 'shap'
                                                ? '0 4px 16px rgba(16,185,129,0.15)'
                                                : '0 4px 16px rgba(124,92,252,0.2)',
                                        }}>
                                            {viewMode === 'shap' ? '⬡ SHAP Overlay' : '◈ Grad-CAM Heatmap'}
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <div style={{
                                textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                            }}>
                                {/* Glowing scan icon */}
                                <div style={{
                                    width: 80, height: 80, borderRadius: 24,
                                    background: 'linear-gradient(135deg, rgba(124,92,252,0.1), rgba(56,189,248,0.06))',
                                    border: '1px solid rgba(124,92,252,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 40px rgba(124,92,252,0.08)',
                                    animation: 'pulseGlow 3s ease-in-out infinite',
                                }}>
                                    <FileImage size={36} style={{ opacity: 0.25, color: 'var(--accent-primary)' }} />
                                </div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>No scan loaded</div>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 200, lineHeight: 1.6 }}>Upload a medical scan from the upload screen to begin AI analysis</div>
                            </div>
                        )}
                    </div>

                    {/* SHAP chart — premium version */}
                    {bars.length > 0 && (() => {
                        const maxVal = Math.max(...bars.map(b => Math.abs(b.value)), 0.001);
                        const BAR_AREA_H = 130;
                        return (
                            <div style={{
                                padding: '12px 18px 10px',
                                borderTop: '1px solid rgba(124,92,252,0.1)',
                                flexShrink: 0,
                                background: 'linear-gradient(180deg, rgba(6,4,18,0.85), rgba(10,6,24,0.95))',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 -1px 0 rgba(124,92,252,0.08)',
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: 8,
                                }}>
                                    <div style={{
                                        fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)',
                                        textTransform: 'uppercase', letterSpacing: 1.5,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: 6,
                                            background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(168,85,247,0.2))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 2px 6px rgba(124,92,252,0.2)',
                                        }}><BarChart3 size={11} color="var(--accent-primary)" /></div>
                                        Region Contributions
                                    </div>
                                    <div style={{
                                        fontSize: 8, color: 'var(--text-tertiary)',
                                        padding: '2px 8px', borderRadius: 5,
                                        background: 'rgba(124,92,252,0.08)',
                                        border: '1px solid rgba(124,92,252,0.15)',
                                        color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: 0.5,
                                    }}>SHAP</div>
                                </div>

                                {/* Bar chart area */}
                                <div style={{
                                    position: 'relative', height: BAR_AREA_H,
                                    display: 'flex', gap: 6, alignItems: 'flex-end',
                                    padding: '0 4px',
                                }}>
                                    {/* Background grid lines */}
                                    {[0.25, 0.5, 0.75, 1].map((frac, gi) => (
                                        <div key={gi} style={{
                                            position: 'absolute', left: 0, right: 0,
                                            bottom: `${frac * 100}%`,
                                            height: 1,
                                            background: 'rgba(130,130,255,0.04)',
                                            pointerEvents: 'none',
                                        }} />
                                    ))}

                                    {bars.map((bar, i) => {
                                        const pct = (Math.abs(bar.value) / maxVal);
                                        const barH = Math.max(pct * BAR_AREA_H, 6);
                                        const color = barColors[i % barColors.length];
                                        return (
                                            <div key={i} style={{
                                                flex: 1, display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', gap: 4, position: 'relative',
                                            }}>
                                                {/* Value label above bar */}
                                                <div style={{
                                                    fontSize: 10, fontWeight: 700, color,
                                                    textShadow: `0 0 8px ${color}44`,
                                                    marginBottom: 2,
                                                }}>{(bar.value * 100).toFixed(0)}%</div>

                                                {/* The bar itself */}
                                                <div style={{
                                                    width: '80%', maxWidth: 52,
                                                    height: barH,
                                                    borderRadius: '6px 6px 2px 2px',
                                                    background: `linear-gradient(180deg, ${color}, ${color}66)`,
                                                    boxShadow: `0 0 16px ${color}40, 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)`,
                                                    transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                                                    position: 'relative',
                                                    cursor: 'default',
                                                }}>
                                                    {/* Glass shine */}
                                                    <div style={{
                                                        position: 'absolute', top: 0, left: 0, right: 0,
                                                        height: '40%', borderRadius: '6px 6px 0 0',
                                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent)',
                                                    }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Region labels below bars — with rank dot */}
                                <div style={{
                                    display: 'flex', gap: 6, padding: '6px 4px 0',
                                }}>
                                    {bars.map((bar, i) => (
                                        <div key={i} style={{
                                            flex: 1, display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', gap: 3,
                                        }}>
                                            <div style={{
                                                width: 14, height: 14, borderRadius: '50%',
                                                background: barColors[i % barColors.length],
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 7, fontWeight: 800, color: '#fff',
                                                boxShadow: `0 0 6px ${barColors[i % barColors.length]}60`,
                                            }}>{i + 1}</div>
                                            <div style={{
                                                fontSize: 7.5, color: 'rgba(160,160,200,0.55)',
                                                textAlign: 'center', lineHeight: 1.2,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                maxWidth: '100%',
                                            }}>{bar.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* ===== RIGHT PANEL — Resizable Chat ===== */}
                {showChat && (
                    <aside style={{
                        display: 'flex', flexDirection: 'row',
                        overflow: 'hidden',
                        position: 'relative',
                    }}>
                        {/* Drag resize handle */}
                        <div
                            onMouseDown={handleDragStart}
                            style={{
                                width: 8, flexShrink: 0,
                                cursor: 'col-resize',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isDragging ? 'rgba(124,92,252,0.15)' : 'rgba(130,130,255,0.03)',
                                borderLeft: `1px solid ${isDragging ? 'rgba(124,92,252,0.4)' : 'rgba(130,130,255,0.08)'}`,
                                borderRight: '1px solid rgba(130,130,255,0.04)',
                                transition: 'all 0.2s ease',
                                zIndex: 5,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,92,252,0.1)'; e.currentTarget.style.borderLeftColor = 'rgba(124,92,252,0.3)'; }}
                            onMouseLeave={e => { if (!isDragging) { e.currentTarget.style.background = 'rgba(130,130,255,0.03)'; e.currentTarget.style.borderLeftColor = 'rgba(130,130,255,0.08)'; } }}
                        >
                            <GripVertical size={10} color={isDragging ? '#a78bfa' : '#555'} />
                        </div>

                        {/* Chat content */}
                        <div style={{
                            flex: 1,
                            display: 'flex', flexDirection: 'column',
                            background: 'transparent',
                            backdropFilter: 'blur(8px)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '14px 18px',
                                borderBottom: '1px solid rgba(130,130,255,0.06)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                flexShrink: 0,
                                background: 'transparent',
                            }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: 1.5, color: 'var(--accent-primary)',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: 7,
                                        background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(168,85,247,0.15))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}><MessageSquare size={12} color="var(--accent-primary)" /></div>
                                    AI Chat
                                </div>
                                <div style={{
                                    fontSize: 9, color: 'var(--text-tertiary)',
                                    padding: '2px 7px', borderRadius: 5,
                                    background: 'rgba(130,130,255,0.06)',
                                    border: '1px solid rgba(130,130,255,0.08)',
                                }}>{messages.length} msg{messages.length !== 1 ? 's' : ''}</div>
                            </div>

                            {/* Chat messages */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px 14px',
                                display: 'flex', flexDirection: 'column', gap: 14,
                            }}>
                                {messages.length === 0 ? (
                                    <div style={{
                                        flex: 1, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--text-tertiary)', textAlign: 'center',
                                        minHeight: 200,
                                    }}>
                                        <Bot size={36} style={{ opacity: 0.12, marginBottom: 12 }} />
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                            No conversation yet
                                        </div>
                                        <div style={{ fontSize: 11, maxWidth: 250, lineHeight: 1.6 }}>
                                            Upload and analyze an image to start an AI-assisted conversation.
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <ChatBubble key={msg.id || idx} message={msg} isLast={idx === messages.length - 1} />
                                    ))
                                )}
                                {/* AI typing indicator */}
                                {isAiTyping && (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '4px 0' }}>
                                        <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, #7c5cfc, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Bot size={13} color="#fff" />
                                        </div>
                                        <div style={{ padding: '8px 13px', borderRadius: '12px 12px 12px 2px', background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)', display: 'flex', gap: 5, alignItems: 'center' }}>
                                            {[0, 1, 2].map(i => (
                                                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Doctor note input */}
                            {activePatientId && activeSessionId && (
                                <div style={{
                                    flexShrink: 0,
                                    padding: '8px 12px 10px',
                                    borderTop: '1px solid rgba(130,130,255,0.06)',
                                    background: 'var(--bg-card)',
                                    backdropFilter: 'blur(8px)',
                                }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'flex-end', gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 12,
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid rgba(130,130,255,0.1)',
                                    }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Bot size={16} color="#fff" />
                                        </div>
                                        <textarea
                                            value={noteText}
                                            onChange={e => {
                                                setNoteText(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                            }}
                                            onKeyDown={handleKeyDown}
                                            placeholder={currentResult ? 'Ask about this scan…' : 'Add a clinical note…'}
                                            rows={1}
                                            disabled={isAiTyping}
                                            className="chat-input-textarea"
                                            style={{
                                                flex: 1, border: 'none', background: 'transparent',
                                                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                                resize: 'none', fontFamily: 'inherit',
                                                lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
                                                opacity: isAiTyping ? 0.5 : 1,
                                                padding: '4px 0',
                                                minHeight: 24,
                                            }}
                                        />
                                        <button onClick={handleSendChat} disabled={!noteText.trim() || isAiTyping}
                                            style={{
                                                width: 32, height: 32, borderRadius: 8, border: 'none',
                                                background: noteText.trim() ? 'linear-gradient(135deg, var(--accent-primary), #a855f7)' : 'rgba(130,130,255,0.08)',
                                                color: '#fff', cursor: noteText.trim() ? 'pointer' : 'default',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.3s ease',
                                                boxShadow: noteText.trim() ? '0 4px 14px rgba(124,92,252,0.3)' : 'none',
                                                flexShrink: 0,
                                            }}
                                        ><Send size={14} /></button>
                                    </div>
                                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4, paddingLeft: 4 }}>
                                        {currentResult ? 'Ask about this analysis · Enter to send · Chats saved permanently' : 'Add a clinical note · Enter to send'}
                                    </div>
                                </div>
                            )}
                        </div>{/* end chat content wrapper */}
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
        msgs.push({
            id: 'auto-diagnosis', role: 'ai',
            content:
                `🧠 DIAGNOSIS: ${result.diagnosis_label}\n\n` +
                `📊 Confidence: ${conf}%\n` +
                `⚠️ Severity: ${sev}/10\n` +
                `🔗 XAI Consensus: ${consensus}` +
                (result.gradcam_region ? `\n📍 Grad-CAM focus: ${result.gradcam_region}` : '') +
                (result.shap_region ? `\n📍 SHAP focus: ${result.shap_region}` : ''),
            timestamp: now,
        });
    }

    if (result.clinical_narrative) {
        msgs.push({ id: 'auto-narrative', role: 'ai', content: `📋 CLINICAL NARRATIVE\n\n${result.clinical_narrative}`, timestamp: now });
    }

    return msgs;
}

export default AnalysisWorkspace;
