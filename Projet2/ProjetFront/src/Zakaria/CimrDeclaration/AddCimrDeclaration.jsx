import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { FileText, User, Calendar, Save, CheckSquare, Square, Search } from 'lucide-react';
import "../Accidents/AddAccident.css";

const AddCimrDeclaration = ({ onClose, onSave, departementId, initialData }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [form, setForm] = useState(initialData || {
        employe: "",
        matricule: "",
        mois: currentMonth,
        annee: currentYear,
        montant_cimr_employeur: "",
        statut: "a_declarer",
        departement_id: departementId || ""
    });

    useEffect(() => {
        const endpoint = initialData
            ? "http://127.0.0.1:8000/api/departements/employes"
            : "http://127.0.0.1:8000/api/cimr-declarations/eligible-employees";

        axios.get(endpoint, { withCredentials: true })
            .then(res => {
                if (Array.isArray(res.data)) {
                    const emps = res.data.map(e => ({
                        ...e,
                        label: `${e.employe || (e.nom + ' ' + e.prenom)}`,
                        displayLabel: `${e.employe || (e.nom + ' ' + e.prenom)} (${e.matricule})`,
                        value: e.id,
                        montant: e.salaire_cotisable ? (e.salaire_cotisable * (e.taux_employeur / 100)).toFixed(2) : ""
                    }));
                    setEmployees(emps);

                    if (initialData) {
                        const found = emps.find(e => e.matricule === initialData.matricule);
                        if (found) setSelectedEmployees([found]);
                    } else {
                        setSelectedEmployees(emps);
                    }
                }
            })
            .catch(err => console.error("Error fetching employees", err));
    }, [initialData]);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm.trim()) return employees;
        const term = searchTerm.toLowerCase();
        return employees.filter(e => e.displayLabel.toLowerCase().includes(term));
    }, [employees, searchTerm]);

    const toggleEmployee = (emp) => {
        setSelectedEmployees(prev =>
            prev.find(e => e.value === emp.value)
                ? prev.filter(e => e.value !== emp.value)
                : [...prev, emp]
        );
    };

    const handleSelectAll = () => setSelectedEmployees(filteredEmployees);
    const handleDeselectAll = () => setSelectedEmployees([]);

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
                montant_cimr_employeur: form.montant_cimr_employeur || emp.montant || 0
            }));
            onSave(declarations);
        }
    };

    return (
        <div className="add-accident-container shadow-lg" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="form-header p-3 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8fafc' }}>
                <h5 className="mb-0 fw-bold text-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2c767c' }}>
                    <FileText size={20} />
                    {initialData ? 'Modifier Déclaration CIMR' : 'Nouvelle Déclaration CIMR'}
                </h5>
                <button
                    onClick={onClose}
                    className="btn-close-custom"
                    style={{ background: "transparent", border: "none", fontSize: "2rem", color: "#4b5563" }}
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
                            <div className="employee-selection-card border rounded p-3 bg-white">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <InputGroup size="sm" style={{ maxWidth: '300px' }}>
                                        <InputGroup.Text className="bg-white border-end-0">
                                            <Search size={14} className="text-muted" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Rechercher..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="border-start-0"
                                        />
                                    </InputGroup>
                                    <div className="d-flex gap-2">
                                        <Button variant="outline-secondary" size="sm" onClick={handleSelectAll} className="small">Tout cocher</Button>
                                        <Button variant="outline-secondary" size="sm" onClick={handleDeselectAll} className="small">Tout décocher</Button>
                                    </div>
                                </div>

                                <div className="employee-list-scrollable border rounded p-2" style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: '#fdfdfd' }}>
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map(emp => (
                                            <div
                                                key={emp.value}
                                                className="d-flex align-items-center p-2 mb-1 rounded hover-bg-light"
                                                style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                                onClick={() => toggleEmployee(emp)}
                                            >
                                                <div className="me-3">
                                                    {selectedEmployees.find(e => e.value === emp.value)
                                                        ? <CheckSquare size={20} color="#2c767c" fill="#2c767c22" />
                                                        : <Square size={20} color="#cbd5e1" />
                                                    }
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div className="fw-medium small" style={{ color: '#334155' }}>{emp.displayLabel}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-4 text-muted small">Aucun employé trouvé.</div>
                                    )}
                                </div>
                                <div className="mt-2 small text-muted text-end">
                                    {selectedEmployees.length} employé(s) sélectionné(s)
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
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                </Form>
            </div >

            <div className="form-footer p-3 border-top d-flex justify-content-end gap-2" style={{ backgroundColor: '#f8fafc' }}>
                <Button variant="light" onClick={onClose} className="px-4 fw-bold">Annuler</Button>
                <Button variant="primary" onClick={handleSubmit} className="px-4 fw-bold d-flex align-items-center gap-2" style={{ backgroundColor: '#2c767c', border: 'none' }}>
                    <Save size={18} />
                    Enregistrer
                </Button>
            </div>
        </div >
    );
};

export default AddCimrDeclaration;
