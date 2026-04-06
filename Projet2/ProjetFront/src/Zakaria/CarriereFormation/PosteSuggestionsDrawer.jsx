import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { X, User, Award, TrendingUp, Printer, FileDown, Mail, Save } from 'lucide-react';

const COMMENT_STORAGE_KEY = 'poste_suggestion_comment_v1';

const toSafeText = (value, fallback = 'N/A') => {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const toSafeDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('fr-FR');
};

const toSafeDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'analyse';

const PosteSuggestionsDrawer = ({ employee, poste, onClose }) => {
  // Fallback to empty objects if props are null or undefined
  const currentEmployee = employee || {};
  const currentPoste = poste || {};
  const analysisRef = useRef(null);

  // Utilise les scores calculés par le backend (dans ai_score_details)
  const aiScoreDetails = currentEmployee.ai_score_details || {};
  const scoreGlobal = aiScoreDetails.globalScore ?? currentEmployee.score ?? 0;
  const scoreCompetences = aiScoreDetails.competencesScore ?? aiScoreDetails.competences ?? 0;
  const scoreGrade = aiScoreDetails.gradeScore ?? aiScoreDetails.grade ?? 0;
  const scoreAnciennete = aiScoreDetails.tenureScore ?? aiScoreDetails.tenure ?? 0;

  // Utilise les matches de compétences calculés par le backend
  const competenceMatches = currentEmployee.competence_matches || [];
  
  // Sépare les compétences requises et validées
  const requiredSkills = competenceMatches.filter(cm => cm.required);
  const validatedSkills = requiredSkills.filter(cm => cm.match_status === 'match');
  
  // Pour l'affichage des badges de compétences du poste
  const posteSkills = currentPoste.raw_competences || [];

  const employeeId = currentEmployee.id ?? currentEmployee.employee_id ?? null;
  const posteId = currentPoste.id ?? null;
  const employeeDisplayName =
    currentEmployee.full_name || `${currentEmployee.nom || ''} ${currentEmployee.prenom || ''}`.trim() || 'Employé';
  const posteDisplayName = currentPoste.poste || currentPoste.nom || 'Poste';

  const commentStorageKey = useMemo(
    () => `${COMMENT_STORAGE_KEY}_${posteId ?? 'none'}_${employeeId ?? 'none'}`,
    [posteId, employeeId]
  );

  const [commentText, setCommentText] = useState('');
  const [commentSavedAt, setCommentSavedAt] = useState('');

  const getSkillName = (skill) => {
    if (!skill) return "";
    if (typeof skill === "string") return skill;
    return skill.nom ?? skill.label ?? skill.name ?? "";
  };

  const missingSkills = useMemo(
    () => requiredSkills.filter((skill) => skill.match_status === 'none'),
    [requiredSkills]
  );

  useEffect(() => {
    try {
      const savedComment = localStorage.getItem(commentStorageKey);
      if (!savedComment) {
        setCommentText('');
        setCommentSavedAt('');
        return;
      }

      const parsed = JSON.parse(savedComment);
      setCommentText(parsed?.text ?? '');
      setCommentSavedAt(parsed?.updated_at ?? '');
    } catch {
      setCommentText('');
      setCommentSavedAt('');
    }
  }, [commentStorageKey]);

  const handleSaveComment = () => {
    const payload = {
      text: commentText,
      updated_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem(commentStorageKey, JSON.stringify(payload));
      setCommentSavedAt(payload.updated_at);
    } catch (error) {
      console.error('SUGGESTION_COMMENT_SAVE_ERROR', error);
    }
  };

  const handleShareByEmail = () => {
    const subject = `Analyse poste - ${posteDisplayName} - ${employeeDisplayName}`;
    const bodyLines = [
      `Analyse de compatibilite`,
      `Employe: ${employeeDisplayName}`,
      `Poste: ${posteDisplayName}`,
      `Score global: ${scoreGlobal}%`,
      `Competences validees: ${validatedSkills.length}/${requiredSkills.length}`,
      `Competences manquantes: ${missingSkills.map((skill) => skill.skill).join(', ') || 'Aucune'}`,
      '',
      `Commentaire: ${commentText || 'Aucun commentaire'}`,
    ];

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  };

  const handlePrint = () => {
    if (!analysisRef.current) return;

    const printableHtml = analysisRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Analyse ${posteDisplayName} - ${employeeDisplayName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; }
            .cnss-form-body { padding: 0; }
            .cnss-section-title { font-size: 16px; font-weight: 700; margin: 18px 0 10px; color: #1e293b; }
            .cnss-form-label { font-weight: 600; color: #334155; display: block; margin-bottom: 6px; }
            .cnss-field-group { break-inside: avoid; margin-bottom: 14px; }
          </style>
        </head>
        <body>
          <h2>Analyse de compatibilite</h2>
          <p><strong>Employe:</strong> ${employeeDisplayName}</p>
          <p><strong>Poste:</strong> ${posteDisplayName}</p>
          ${printableHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxWidth = pageWidth - (margin * 2);
    let y = 14;

    const ensureSpace = (requiredHeight = 8) => {
      if (y + requiredHeight > pageHeight - margin) {
        doc.addPage();
        y = 14;
      }
    };

    const writeLine = (text, size = 10, color = [31, 41, 55], lineHeight = 6) => {
      ensureSpace(lineHeight + 2);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(size);
      const wrapped = doc.splitTextToSize(toSafeText(text, ''), maxWidth);
      doc.text(wrapped, margin, y);
      y += Math.max(lineHeight, wrapped.length * 5.2);
    };

    const writeSection = (title, lines) => {
      ensureSpace(12);
      doc.setDrawColor(219, 234, 254);
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(margin, y - 4, maxWidth, 8, 1.5, 1.5, 'FD');
      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);
      doc.text(title, margin + 3, y + 1.5);
      y += 9;

      lines.forEach((line) => writeLine(line));
      y += 1;
    };

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Analyse de compatibilite employe / poste', margin, y);
    y += 8;

    writeSection('Informations generales', [
      `Employe: ${employeeDisplayName}`,
      `Poste: ${posteDisplayName}`,
      `Date: ${new Date().toLocaleString('fr-FR')}`,
      `Score global: ${scoreGlobal}%`,
      `Adequation competences: ${Math.round(scoreCompetences)}%`,
      `Compatibilite grade: ${scoreGrade}%`,
      `Anciennete: ${scoreAnciennete}%`,
    ]);

    writeSection('Competences', [
      `Competences requises: ${requiredSkills.length}`,
      `Competences validees: ${validatedSkills.length}`,
      `Competences manquantes: ${missingSkills.length}`,
      `Liste manquantes: ${missingSkills.map((skill) => skill.skill).join(', ') || 'Aucune'}`,
    ]);

    const historyRows = (currentEmployee.historique_postes || []).slice(0, 5).map((hist) => {
      const period = `${toSafeDate(hist.date_debut)} - ${hist.date_fin ? toSafeDate(hist.date_fin) : 'En cours'}`;
      return `${toSafeText(hist.poste_nom)} | ${period}`;
    });

    writeSection('Historique postes (5 derniers)', historyRows.length ? historyRows : ['Aucun historique disponible']);

    const formationRows = (currentEmployee.formations || []).slice(0, 5).map((formation) => {
      const period = `${toSafeDate(formation.date_debut)}${formation.date_fin ? ` - ${toSafeDate(formation.date_fin)}` : ''}`;
      return `${toSafeText(formation.intitule)} | ${period}`;
    });

    writeSection('Formations recentes (5 dernieres)', formationRows.length ? formationRows : ['Aucune formation enregistree']);

    writeSection('Commentaire', [commentText || 'Aucun commentaire']);

    doc.save(`analyse_${toSlug(employeeDisplayName)}_${toSlug(posteDisplayName)}.pdf`);
  };

  return (
    <>
      <style>{`
        .parcours-historique-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .parcours-historique-scroll::-webkit-scrollbar {
          width: 6px;
        }
        
        .parcours-historique-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .parcours-historique-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          transition: background 0.2s ease;
        }
        
        .parcours-historique-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="cnss-side-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cnss-form-header">
          <div style={{ minWidth: '24px' }}></div>
          <h5>Analyse - {employeeDisplayName}</h5>
          <button
            type="button"
            className="cnss-close-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '10px 16px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={handlePrint}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#334155',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Printer size={15} /> Imprimer
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            style={{
              border: '1px solid #93c5fd',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileDown size={15} /> Export PDF
          </button>
          <button
            type="button"
            onClick={handleShareByEmail}
            style={{
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Mail size={15} /> Partager email
          </button>
        </div>

      {/* Body with scroll */}
      <div className="cnss-form-body" ref={analysisRef}>
        {/* Section: Info du poste */}
        <div className="cnss-section-title">
          <User size={14} />
          <span>Information du poste</span>
        </div>
        
        <div className="cnss-field-group" style={{ marginBottom: '1.5rem' }}>
          <label className="cnss-form-label">Poste concerné</label>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.375rem' }}>
            <span style={{ color: '#1e40af', fontWeight: 600 }}>{posteDisplayName}</span>
          </div>
        </div>

        <div className="cnss-field-group" style={{ marginBottom: '1.5rem' }}>
          <label className="cnss-form-label">Compétences requises</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#fcfdfe', border: '1px solid #e5e7eb', borderRadius: '0.375rem', minHeight: '3rem' }}>
            {posteSkills && posteSkills.length > 0 ? (
              posteSkills.map((skill, index) => (
                <span key={skill.id || skill.competence_id || index} style={{
                  backgroundColor: '#e6f2f2',
                  color: '#2c767c',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid rgba(44, 118, 124, 0.1)',
                  display: 'inline-block'
                }}>
                  {getSkillName(skill)}
                </span>
              ))
            ) : (
              <span style={{ color: '#6b7280', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucune compétence renseignée.</span>
            )}
          </div>
        </div>

        {/* Section: Score d'Adéquation */}
        <div className="cnss-section-title">
          <Award size={14} />
          <span>Score d'Adéquation</span>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1rem', color: '#2563eb' }}>Score global</strong>
                <strong style={{ fontSize: '1.25rem', color: '#2563eb' }}>{scoreGlobal}%</strong>
              </div>
              <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.75rem', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#2563eb', height: '0.75rem', borderRadius: '9999px', width: `${scoreGlobal}%`, transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Adéquation des compétences</span> 
                <span style={{ fontWeight: 600, color: '#2563eb' }}>{Math.round(scoreCompetences)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Compatibilité de grade</span> 
                <span style={{ fontWeight: 600, color: '#2563eb' }}>{scoreGrade}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Ancienneté dans l'entreprise</span> 
                <span style={{ fontWeight: 600, color: '#2563eb' }}>{scoreAnciennete}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Analyse des Compétences */}
        <div className="cnss-section-title">
          <TrendingUp size={14} />
          <span>Analyse des Compétences</span>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="cnss-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {validatedSkills.length} / {requiredSkills.length} compétences requises
              </span>
              <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '1rem' }}>{Math.round(scoreCompetences)}%</span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#2563eb', height: '0.5rem', borderRadius: '9999px', width: `${scoreCompetences}%`, transition: 'width 0.3s ease' }}></div>
            </div>
            
            <div className="parcours-historique-scroll" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px', marginRight: '-8px' }}>
              {requiredSkills.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  Aucune compétence requise pour ce poste.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {requiredSkills.map((cm, index) => {
                    const isMatch = cm.match_status === 'match';
                    const isPartial = cm.match_status === 'partial';
                    
                    return (
                      <div 
                        key={`skill-${index}-${cm.skill}`} 
                        style={{
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '0.75rem 1rem', 
                          borderRadius: '0.375rem',
                          backgroundColor: isMatch ? '#f0fdf4' : isPartial ? '#fef3c7' : '#fef2f2',
                          border: `1px solid ${isMatch ? '#bbf7d0' : isPartial ? '#fde68a' : '#fecaca'}`
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ color: '#1f2937', fontWeight: 500 }}>{cm.skill}</span>
                          {cm.niveau_requis > 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Niveau requis: {cm.niveau_requis} | Niveau employé: {cm.niveau_employe}
                            </span>
                          )}
                        </div>
                        {isMatch ? (
                          <span style={{ 
                            backgroundColor: '#22c55e', 
                            color: 'white', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '9999px',
                            whiteSpace: 'nowrap'
                          }}>Validée</span>
                        ) : isPartial ? (
                          <span style={{ 
                            backgroundColor: '#f59e0b', 
                            color: 'white', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '9999px',
                            whiteSpace: 'nowrap'
                          }}>Partiel</span>
                        ) : (
                          <span style={{ 
                            backgroundColor: '#ef4444', 
                            color: 'white', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '9999px',
                            whiteSpace: 'nowrap'
                          }}>Manquante</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Parcours & Historique */}
        <div className="cnss-section-title">
          <User size={14} />
          <span>Parcours & Historique</span>
        </div>
        
        <div className="cnss-field-group" style={{ marginBottom: '1.5rem' }}>
          {/* Historique des Postes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="cnss-form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Historique des postes</label>
            {currentEmployee.historique_postes && currentEmployee.historique_postes.length > 0 ? (
              <div className="parcours-historique-scroll" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px', marginRight: '-8px' }}>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {currentEmployee.historique_postes.map((hist, index) => (
                    <div 
                      key={`poste-hist-${hist.id || index}`} 
                      style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        backgroundColor: hist.statut === 'Validé' ? '#f0fdf4' : '#f9fafb',
                        border: `1px solid ${hist.statut === 'Validé' ? '#bbf7d0' : '#e5e7eb'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{hist.poste_nom}</span>
                        {hist.type_evolution && (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: hist.type_evolution === 'Promotion' ? '#dbeafe' : 
                                           hist.type_evolution === 'Mutation' ? '#fef3c7' : '#f3f4f6',
                            color: hist.type_evolution === 'Promotion' ? '#1e40af' : 
                                   hist.type_evolution === 'Mutation' ? '#92400e' : '#374151'
                          }}>
                            {hist.type_evolution}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        Grade: <span style={{ color: '#374151', fontWeight: 500 }}>{hist.grade_label}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        Période: <span style={{ color: '#374151' }}>
                          {new Date(hist.date_debut).toLocaleDateString('fr-FR')} 
                          {hist.date_fin ? ` - ${new Date(hist.date_fin).toLocaleDateString('fr-FR')}` : ' - En cours'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Durée: <span style={{ color: '#374151', fontWeight: 500 }}>{hist.duree}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                  Aucun historique de poste disponible.
                </p>
              </div>
            )}
          </div>

          {/* Historique des Formations */}
          <div>
            <label className="cnss-form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Formations suivies</label>
            {currentEmployee.formations && currentEmployee.formations.length > 0 ? (
              <div className="parcours-historique-scroll" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px', marginRight: '-8px' }}>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {currentEmployee.formations.map((formation, index) => (
                    <div 
                      key={`formation-${formation.id || index}`} 
                      style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                        {formation.intitule}
                      </div>
                      {formation.organisme && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          Organisme: <span style={{ color: '#374151' }}>{formation.organisme}</span>
                        </div>
                      )}
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        Période: <span style={{ color: '#374151' }}>
                          {formation.date_debut ? new Date(formation.date_debut).toLocaleDateString('fr-FR') : 'N/A'}
                          {formation.date_fin ? ` - ${new Date(formation.date_fin).toLocaleDateString('fr-FR')}` : ''}
                        </span>
                      </div>
                      {formation.duree && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          Durée: <span style={{ color: '#374151', fontWeight: 500 }}>{formation.duree}</span>
                        </div>
                      )}
                      {formation.statut && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: formation.statut === 'Terminé' || formation.statut === 'Validé' ? '#dcfce7' : '#fef3c7',
                            color: formation.statut === 'Terminé' || formation.statut === 'Validé' ? '#166534' : '#92400e'
                          }}>
                            {formation.statut}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                  Aucune formation enregistrée.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section: Commentaires */}
        <div className="cnss-section-title">
          <User size={14} />
          <span>Commentaires recruteur</span>
        </div>

        <div className="cnss-field-group" style={{ marginBottom: '1.5rem' }}>
          <label className="cnss-form-label">Note interne</label>
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            rows={4}
            placeholder="Ajouter un commentaire sur ce candidat pour ce poste..."
            style={{
              width: '100%',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.75rem',
              fontSize: '0.88rem',
              color: '#334155',
              backgroundColor: '#ffffff',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSaveComment}
              style={{
                border: '1px solid #2c767c',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#2c767c',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Save size={15} /> Enregistrer
            </button>

            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {commentSavedAt ? `Dernière sauvegarde: ${toSafeDateTime(commentSavedAt)}` : 'Aucune note sauvegardée'}
            </span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default PosteSuggestionsDrawer;
