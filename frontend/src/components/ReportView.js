import React from 'react';
import { useAppStore } from '../store/appStore';
import { usePatientStore } from '../store/patientStore';
import { ArrowLeft, Printer, AlertTriangle, Activity, FileDown, Shield, User, Calendar, Stethoscope } from 'lucide-react';

const ReportView = () => {
  const { analysisResult, diseaseType, setActiveScreen } = useAppStore();
  const { patients, activePatientId, activeSessionId } = usePatientStore();

  // Pull from active session when available
  const activePatient = patients.find(p => p.id === activePatientId);
  const activeSession = activePatient?.sessions.find(s => s.id === activeSessionId);
  const r = activeSession?.analysisResult || analysisResult;
  const sessionDiseaseType = activeSession?.diseaseType || r?.disease_type || diseaseType || '—';
  const sessionDate = activeSession?.timestamp
    ? new Date(activeSession.timestamp).toLocaleString()
    : new Date().toLocaleString();

  const handlePrint = () => { window.print(); };

  const handleDownloadPDF = () => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        .report-container, .report-container * { visibility: visible; }
        .report-container { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
        nav, footer { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const riskColors = {
    HIGH: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', badge: '#ef4444' },
    MODERATE: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', badge: '#f97316' },
    LOW: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', badge: '#22c55e' },
  };
  const riskStyle = riskColors[r?.risk_level] || riskColors.LOW;

  return (
    <main style={{
      paddingTop: 96, paddingLeft: 24, paddingRight: 24, paddingBottom: 24,
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
      color: '#020617',
    }}>
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, maxWidth: 900, margin: '0 auto 16px',
      }}>
        <button onClick={() => setActiveScreen('analysis')}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
          style={{
            padding: '8px 16px', borderRadius: 12,
            border: '1px solid #e2e8f0', background: '#fff',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <ArrowLeft size={14} /> Back to Workspace
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handlePrint}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              padding: '8px 20px', borderRadius: 12,
              border: '1px solid #e2e8f0', background: '#fff',
              color: '#334155', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Printer size={14} /> Print
          </button>
          <button onClick={handleDownloadPDF}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,92,252,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(124,92,252,0.1)'; }}
            style={{
              padding: '8px 20px', borderRadius: 12,
              border: 'none', background: 'linear-gradient(135deg, #7c5cfc, #3b82f6)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(124,92,252,0.1)',
            }}
          >
            <FileDown size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="report-container" style={{
        maxWidth: 900, margin: '0 auto',
        background: '#fff', borderRadius: 20,
        border: '1px solid #e2e8f0', padding: 32,
        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
      }}>
        {/* Header: logo + timestamp top row, patient card below */}
        <header style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid #f1f5f9' }}>

          {/* Top row — logo left, timestamp right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #7c5cfc, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={16} color="#fff" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>MedX</h1>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
                color: '#7c5cfc', background: 'rgba(124,92,252,0.08)',
                padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(124,92,252,0.15)',
              }}>Clinical Report</span>
            </div>
            {/* Timestamp + modality — top right */}
            <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
              <div><span style={{ fontWeight: 600, color: '#64748b' }}>Generated:</span> {sessionDate}</div>
              {r?.modality && <div><span style={{ fontWeight: 600, color: '#64748b' }}>Modality:</span> {r.modality}</div>}
            </div>
          </div>

          {/* Patient details card */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12,
            padding: '14px 18px', borderRadius: 12,
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
            border: '1px solid #e2e8f0',
          }}>
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(124,92,252,0.15), rgba(59,130,246,0.1))',
                border: '1px solid rgba(124,92,252,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><User size={14} color="#7c5cfc" /></div>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Patient</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{activePatient?.name || '—'}</div>
              </div>
            </div>

            <div style={{ width: 1, background: '#e2e8f0', flexShrink: 0 }} />

            {/* Age + Gender */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Calendar size={14} color="#06b6d4" /></div>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Age / Gender</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  {activePatient?.age || r?.patient_age || '—'}
                  {(activePatient?.gender || r?.patient_gender) && ` · ${activePatient?.gender || r?.patient_gender}`}
                </div>
              </div>
            </div>

            <div style={{ width: 1, background: '#e2e8f0', flexShrink: 0 }} />

            {/* Disease type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Stethoscope size={14} color="#10b981" /></div>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Analysis Type</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>{sessionDiseaseType}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Images row — original + gradcam + shap */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Original Image', src: r?.original_image },
            { label: 'Grad-CAM Heatmap', src: r?.gradcam_heatmap },
            { label: 'SHAP Attribution', src: r?.shap_overlay },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
              <div style={{
                border: '1px solid #e2e8f0', borderRadius: 12,
                height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', background: '#f8fafc',
              }}>
                {item.src ? (
                  <img src={item.src} alt={item.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>No image</span>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Diagnosis summary + Risk badge */}
        <section style={{
          background: '#f8fafc', borderRadius: 14, padding: 20,
          marginBottom: 20, border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                {r?.diagnosis_label || '—'}
              </div>
              <div style={{ fontSize: 13, display: 'flex', gap: 20, flexWrap: 'wrap', color: '#475569' }}>
                <span><strong>Confidence:</strong> {((r?.confidence_score ?? 0) * 100).toFixed(1)}%</span>
                <span><strong>Severity:</strong> {(r?.severity_score ?? 0).toFixed(1)}/10</span>
                <span><strong>XAI Consensus:</strong>{' '}
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: r?.xai_consensus === 'high' ? '#dcfce7' : r?.xai_consensus === 'low' ? '#fef2f2' : '#fefce8',
                    color: r?.xai_consensus === 'high' ? '#166534' : r?.xai_consensus === 'low' ? '#991b1b' : '#854d0e',
                  }}>
                    {(r?.xai_consensus || '—').toUpperCase()}
                  </span>
                </span>
              </div>
              {r?.gradcam_region && (
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                  <strong>Grad-CAM Region:</strong> {r.gradcam_region} &nbsp;|&nbsp; <strong>SHAP Region:</strong> {r.shap_region}
                </div>
              )}
            </div>
            {r?.risk_level && (
              <div style={{
                padding: '10px 20px', borderRadius: 12, textAlign: 'center',
                background: riskStyle.bg, border: `1px solid ${riskStyle.border}`,
              }}>
                <Shield size={18} color={riskStyle.badge} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: riskStyle.text }}>{r.risk_level}</div>
                <div style={{ fontSize: 10, color: riskStyle.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Risk Level</div>
              </div>
            )}
          </div>
          {r?.risk_reason && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
              {r.risk_reason}
            </div>
          )}
        </section>

        {/* Key Findings (explanation_points) */}
        {(r?.explanation_points || []).length > 0 && (
          <section style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Key Findings</div>
            <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.explanation_points.map((pt, i) => (
                <li key={i} style={{ fontSize: 13, lineHeight: 1.6, color: '#334155' }}>{pt}</li>
              ))}
            </ol>
          </section>
        )}

        {/* Class Probabilities */}
        {(r?.all_probabilities || []).length > 0 && (() => {
          const probColors = ['#7c5cfc', '#3b82f6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#a855f7', '#22d3ee'];
          return (
            <section style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Class Probabilities</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {r.all_probabilities.map((item, i) => {
                  const color = probColors[i % probColors.length];
                  const pct = Math.min(item.probability * 100, 100);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, minWidth: 120, color: '#334155', fontWeight: i === 0 ? 700 : 400 }}>{item.class}</span>
                      <div style={{ flex: 1, height: 12, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%', borderRadius: 999,
                          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                          boxShadow: `0 2px 6px ${color}40`,
                          minWidth: pct > 0 ? 6 : 0,
                        }} />
                      </div>
                      <span style={{ fontSize: 12, minWidth: 50, textAlign: 'right', fontWeight: 700, color }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}



        {/* Clinical Narrative */}
        <section style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Clinical Narrative</div>
          <p style={{
            whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.8, color: '#334155',
            padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0',
          }}>
            {r?.clinical_narrative || 'No narrative generated yet.'}
          </p>
        </section>

        {/* Disclaimer */}
        <section style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 14, borderRadius: 12,
          background: '#fef2f2', border: '1px solid #fecaca',
          fontSize: 12, color: '#991b1b',
        }}>
          <AlertTriangle size={14} />
          AI-generated report. Not a substitute for professional medical advice. Always consult a qualified clinician.
        </section>
      </div>
    </main>
  );
};

export default ReportView;
