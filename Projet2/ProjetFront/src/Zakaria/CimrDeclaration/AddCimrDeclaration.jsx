import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { FileText, User, Calendar, Save, CheckSquare, Square, Search } from 'lucide-react';
import "../Accidents/AddAccident.css";

const AddCimrDeclaration = ({ onClose, onSave, departementId, initialData, preloadedEmployees = [], declarationRows = [] }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [declaredMatricules, setDeclaredMatricules] = useState(new Set());
    const fetchingRef = useRef(false);
    const abortRef = useRef(null);
    const hasInitializedRef = useRef(false);
    const [searchTerm, setSearchTerm] = useState("");

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [form, setForm] = useState({
        employe: initialData?.employe || "",
        matricule: initialData?.matricule || "",
        mois: initialData?.mois || currentMonth,
        annee: initialData?.annee || currentYear,
        montant_cimr_employeur: initialData?.montant_cimr_employeur || initialData?.montant || "",
        statut: initialData?.statut || "a_declarer",
        departement_id: initialData?.departement_id || departementId || ""
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                employe: initialData.employe || "",
                matricule: initialData.matricule || "",
                mois: initialData.mois || currentMonth,
                annee: initialData.annee || currentYear,
                montant_cimr_employeur: initialData.montant_cimr_employeur ?? initialData.montant ?? "",
                statut: initialData.statut || "a_declarer",
                departement_id: initialData.departement_id || departementId || ""
            });
        }
    }, [initialData, currentMonth, currentYear, departementId]);

    useEffect(() => {
        const processEmployees = (data) => {
            const emps = data.map(e => ({
                ...e,
                label: `${e.employe || (e.nom + ' ' + e.prenom)}`,
                displayLabel: `${e.employe || (e.nom + ' ' + e.prenom)} (${e.matricule})`,
                value: e.id,
                montant: e.montant_cotisation || 0
            }));
            setEmployees(emps);

            if (!hasInitializedRef.current) {
                hasInitializedRef.current = true;
                if (initialData) {
                    const found = emps.find(e => String(e.matricule) === String(initialData.matricule));
                    if (found) setSelectedEmployees([found]);
                } else {
                    setSelectedEmployees([]);
                }
            }
        };

        // Pour édition: on connaît déjà l'employé, pas besoin de charger toute la liste
        if (initialData) {
            const emp = {
                id: initialData.id,
                employe: initialData.employe || "",
                matricule: initialData.matricule || "",
                label: initialData.employe || "",
                displayLabel: `${initialData.employe || ""} (${initialData.matricule || ""})`,
                value: initialData.id,
                montant_cotisation: initialData.montant_cimr_employeur ?? initialData.montant ?? 0,
                montant: initialData.montant_cimr_employeur ?? initialData.montant ?? 0,
            };
            setEmployees([emp]);
            setSelectedEmployees([emp]);
            return;
        }

        // Fonction qui calcule les éligibles localement en joignant employés + affiliations actives
        const buildEligibleLocally = (empList, affList) => {
            const affByMatricule = {};
            (affList || []).forEach(a => {
                if (a.statut === 'actif') affByMatricule[String(a.matricule)] = a;
            });
            return empList.map(emp => {
                const aff = affByMatricule[String(emp.matricule)] || {};
                return {
                    ...emp,
                    employe: emp.employe || (emp.nom + ' ' + emp.prenom),
                    salaire_cotisable: aff.salaire_cotisable || 0,
                    taux_employeur: aff.taux_employeur || 0,
                    montant_cotisation: aff.montant_cotisation || 0,
                };
            });
        };

        // 1. Essayer le cache eligibleEmployees (déjà calculé)
        const eligibleCached = localStorage.getItem('eligibleEmployeesCache');
        if (eligibleCached) {
            try { processEmployees(JSON.parse(eligibleCached)); return; } catch (e) { /* ignore */ }
        }

        // 2. Calculer localement depuis les caches existants (évite tout appel serveur)
        const empCached = localStorage.getItem('employeesLightCache');
        const affCached = localStorage.getItem('cimrAffiliationsCache');
        if (empCached) {
            try {
                const empList = JSON.parse(empCached);
                const affList = affCached ? JSON.parse(affCached) : [];
                const eligible = buildEligibleLocally(empList, affList);
                localStorage.setItem('eligibleEmployeesCache', JSON.stringify(eligible));
                processEmployees(eligible);
                return;
            } catch (e) { /* ignore */ }
        }

        // 3. Fallback API — uniquement si aucun cache disponible
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        axios.get("http://127.0.0.1:8000/api/employes/light", { withCredentials: true, signal: abortRef.current.signal })
            .then(res => {
                if (!Array.isArray(res.data)) return;
                localStorage.setItem('employeesLightCache', JSON.stringify(res.data));
                const affList = (() => {
                    try { return JSON.parse(localStorage.getItem('cimrAffiliationsCache') || '[]'); } catch { return []; }
                })();
                const eligible = buildEligibleLocally(res.data, affList);
                localStorage.setItem('eligibleEmployeesCache', JSON.stringify(eligible));
                processEmployees(eligible);
            })
            .catch(err => {
                if (axios.isCancel(err)) return;
                console.error("Error fetching employees", err);
            })
            .finally(() => { fetchingRef.current = false; });

        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, [initialData, preloadedEmployees]);

    // When mois/annee changes, compute which matricules are already declared for that period
    useEffect(() => {
        if (initialData) return;
        const mois = parseInt(form.mois);
        const annee = parseInt(form.annee);
        if (!mois || !annee) { setDeclaredMatricules(new Set()); return; }

        const existingRow = declarationRows.find(r => parseInt(r.mois) === mois && parseInt(r.annee) === annee);
        if (!existingRow) { setDeclaredMatricules(new Set()); return; }

        if (existingRow.details && existingRow.details.length > 0) {
            setDeclaredMatricules(new Set(existingRow.details.map(d => String(d.matricule))));
        } else {
            // Row exists but details not yet loaded → fetch from API
            axios.get(`http://127.0.0.1:8000/api/cimr-declarations?mois=${mois}&annee=${annee}`, { withCredentials: true })
                .then(res => {
                    setDeclaredMatricules(new Set((res.data || []).map(d => String(d.matricule))));
                })
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.mois, form.annee, declarationRows, initialData]);

    // Whenever declaredMatricules changes, deselect any employee already in that period
    useEffect(() => {
        if (declaredMatricules.size > 0) {
            setSelectedEmployees(prev => prev.filter(e => !declaredMatricules.has(String(e.matricule))));
        }
    }, [declaredMatricules]);
    useEffect(() => {
        if (!initialData) {
            const total = selectedEmployees.reduce((sum, emp) => {
                const val = parseFloat(emp.montant) || 0;
                return sum + val;
            }, 0);

            setForm(prev => ({
                ...prev,
                montant_cimr_employeur: total.toFixed(2)
            }));
        }
    }, [selectedEmployees, initialData]);

    const filteredEmployees = useMemo(() => {
        return employees
            .filter(e => !declaredMatricules.has(String(e.matricule)))
            .filter(e => {
                if (!searchTerm.trim()) return true;
                const term = searchTerm.toLowerCase();
                return e.displayLabel.toLowerCase().includes(term);
            });
    }, [employees, searchTerm, declaredMatricules]);

    const toggleEmployee = (emp) => {
        setSelectedEmployees(prev =>
            prev.find(e => e.value === emp.value)
                ? prev.filter(e => e.value !== emp.value)
                : [...prev, emp]
        );
    };

    const handleSelectAll = () => {
        setSelectedEmployees(prev => {
            const prevIds = new Set(prev.map(e => e.value));
            const newToAdd = filteredEmployees.filter(e => !prevIds.has(e.value));
            return [...prev, ...newToAdd];
        });
    };

    const handleDeselectAll = () => {
        const filteredIds = new Set(filteredEmployees.map(e => e.value));
        setSelectedEmployees(prev => prev.filter(e => !filteredIds.has(e.value)));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedEmployees.length === 0) {
            return;
        }

        if (initialData) {
            onSave(form);
        } else {
            const declarations = selectedEmployees.map(emp => ({
                ...form,
                employe: emp.label,
                matricule: emp.matricule,
                departement_id: emp.departement_id || form.departement_id,
                montant_cimr_employeur: emp.montant || 0
            }));
            onSave(declarations);
        }
    };

    return (
        <div className="add-accident-container shadow-lg" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                position: 'relative',
                background: '#f9fafb',
                borderBottom: '1px solid #e9ecef',
                padding: '0.99rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <h5 style={{ margin: 0, fontWeight: 600, fontSize: '1.15rem', color: '#4b5563', textAlign: 'center', letterSpacing: '0.2px' }}>
                    {initialData ? 'Modifier Déclaration CIMR' : 'Nouvelle Déclaration CIMR'}
                </h5>
                <button
                    onClick={onClose}
                    aria-label="Fermer"
                    style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.5rem',
                        color: '#6b7280',
                        cursor: 'pointer',
                        lineHeight: 1,
                        padding: '4px 8px',
                        borderRadius: '6px',
                    }}
                >
                    &times;
                </button>
            </div>

            <div className="form-body p-4 flex-grow-1 overflow-auto">
                <Form onSubmit={handleSubmit}>
                    <div className="form-section mb-4">
                        <h6 className="section-title-custom mb-3">
                            <User size={16} className="me-2" />
                            {initialData ? 'Informations Employé' : 'Sélectionner des employés'}
                        </h6>

                        {!initialData ? (
                            <div className="employee-selection-card border rounded p-3 bg-white shadow-sm">
                                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <InputGroup size="sm" style={{ maxWidth: '280px' }}>
                                        <InputGroup.Text className="bg-white border-end-0">
                                            <Search size={14} className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Rechercher par nom ou matricule..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="border-start-0"
                                        />
                                    </InputGroup>
                                    <div className="d-flex gap-2">
                                        <Button type="button" variant="outline-info" size="sm" onClick={handleSelectAll} style={{ fontSize: '0.75rem', borderColor: '#2c767c', color: '#2c767c' }}>Tout cocher</Button>
                                        <Button type="button" variant="outline-secondary" size="sm" onClick={handleDeselectAll} style={{ fontSize: '0.75rem' }}>Tout décocher</Button>
                                    </div>
                                </div>

                                <div className="employee-list-scrollable border rounded" style={{ height: '300px', overflowY: 'auto', backgroundColor: '#fdfdfd' }}>
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map(emp => {
                                            const isSelected = selectedEmployees.find(e => e.value === emp.value);

                                            return (
                                                <div
                                                    key={emp.value}
                                                    className="d-flex align-items-center p-2 mb-0 hover-bg-light"
                                                    style={{
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #f1f5f9',
                                                        backgroundColor: isSelected ? '#f0f9f9' : 'transparent'
                                                    }}
                                                    onClick={() => toggleEmployee(emp)}
                                                >
                                                    <div className="me-3">
                                                        {isSelected ? (
                                                            <CheckSquare size={18} color="#2c767c" fill="#2c767c22" />
                                                        ) : (
                                                            <Square size={18} color="#cbd5e1" />
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="fw-medium small" style={{ color: '#334155' }}>
                                                            {emp.displayLabel}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center p-5 text-muted small">Aucun employé éligible trouvé.</div>
                                    )}
                                </div>
                                <div className="mt-2 small text-muted d-flex justify-content-between">
                                    <span>{filteredEmployees.length} employé(s) au total</span>
                                    <span className="fw-bold" style={{ color: '#2c767c' }}>{selectedEmployees.length} sélectionné(s)</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 border rounded bg-light">
                                <span className="fw-bold">{form.employe}</span> <span className="text-muted">({form.matricule})</span>
                            </div>
                        )}
                    </div>

                    <div className="form-section mb-4">
                        <h6 className="section-title-custom mb-3">
                            <Calendar size={16} className="me-2" />
                            Période & Montant
                        </h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Mois</Form.Label>
                                    <Form.Select name="mois" value={form.mois} onChange={handleChange} className="custom-input">
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Année</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="annee"
                                        value={form.annee}
                                        onChange={handleChange}
                                        className="custom-input"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Montant CIMR Employeur</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="montant_cimr_employeur"
                                        value={form.montant_cimr_employeur}
                                        onChange={handleChange}
                                        className="custom-input"
                                        placeholder="0.00"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Statut</Form.Label>
                                    <Form.Select name="statut" value={form.statut} onChange={handleChange} className="custom-input">
                                        <option value="a_declarer">À Déclarer</option>
                                        <option value="declare">Déclaré</option>
                                        <option value="paye">Payé</option>
                                        <option value="cloture">Clôturé</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                </Form>
            </div >

            <div style={{
                background: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
            }}>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        background: '#2c7a7b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 24px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                >
                    Annuler
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    style={{
                        background: '#2c7a7b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 24px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        transition: 'background 0.2s',
                    }}
                >
                    Enregistrer
                </button>
            </div>
        </div >
    );
};

export default AddCimrDeclaration;
