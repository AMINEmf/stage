import Select from "react-select";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FileText, User, Calendar, Save } from 'lucide-react';
import "../Accidents/AddAccident.css";

const AddCimrDeclaration = ({ onClose, onSave, departementId, initialData }) => {
    const [employees, setEmployees] = useState([]);
    // selectedEmployees will store the full employee objects (as Select options)
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    // For single edit, we keep using form state mostly for other fields
    // For bulk add, 'form' will hold shared values (month, year, amount, status)

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
                        label: `${e.employe || (e.nom + ' ' + e.prenom)} (${e.matricule})`,
                        value: e.id,
                        // Use salaire_cotisable * taux_employeur if available (example logic)
                        montant: e.salaire_cotisable ? (e.salaire_cotisable * (e.taux_employeur / 100)).toFixed(2) : ""
                    }));
                    setEmployees(emps);

                    if (initialData) {
                        const found = emps.find(e => e.matricule === initialData.matricule);
                        if (found) setSelectedEmployees([found]);
                    } else {
                        // Automatically select all active employees for new declaration
                        setSelectedEmployees(emps);
                    }
                }
            })
            .catch(err => console.error("Error fetching employees", err));
    }, [initialData]);

    // Handle selection from react-dropdown-select
    const handleMultiSelect = (selectedOptions) => {
        setSelectedEmployees(selectedOptions || []);

        // If single selection (or edit mode simulation), update form details for display if needed
        if (selectedOptions && selectedOptions.length === 1) {
            const emp = selectedOptions[0];
            setForm(prev => ({
                ...prev,
                employe: `${emp.prenom} ${emp.nom}`,
                matricule: emp.matricule,
                departement_id: emp.departement_id || prev.departement_id
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedEmployees.length === 0) {
            // Error handling or alert
            return;
        }

        if (initialData) {
            // Edit mode: single item update using form state (which might have modified amount/status)
            // Ensure we use the selected employee's details if changed (though usually edit locks employee)
            onSave(form);
        } else {
            // Creation mode: Support bulk
            // Create an array of declarations
            const declarations = selectedEmployees.map(emp => ({
                ...form, // Shared values: mois, annee, statut
                employe: emp.employe || `${emp.prenom} ${emp.nom}`,
                matricule: emp.matricule,
                departement_id: emp.departement_id || form.departement_id,
                montant_cimr_employeur: form.montant_cimr_employeur || emp.montant || 0
            }));

            // If only one, pass as single object to maintain backward compat if parent expects it, 
            // OR parent should handle array. Let's make parent handle array.
            onSave(declarations);
        }
    };

    return (
        <div className="add-accident-container shadow-lg">
            <div className="form-header p-3 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8fafc' }}>
                <h5 className="mb-0 fw-bold text-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2c767c' }}>
                    <FileText size={20} />
                    {initialData ? 'Modifier Déclaration CIMR' : 'Nouvelle Déclaration CIMR'}
                </h5>
                <button
                    onClick={onClose}
                    className="btn-close-custom"
                    style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "2rem",
                        color: "#4b5563",
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
                            Informations Employé
                        </h6>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Sélectionner un ou plusieurs employés</Form.Label>
                            <Select
                                options={employees}
                                value={selectedEmployees}
                                onChange={handleMultiSelect}
                                isMulti={!initialData} // Enable multi only for creation
                                isDisabled={!!initialData} // Disable Select in Edit mode if desired, or allow changing
                                placeholder="Rechercher des employés..."
                                className="basic-multi-select"
                                classNamePrefix="select"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Nom Complet</Form.Label>
                                    <Form.Control
                                        name="employe"
                                        value={form.employe}
                                        readOnly
                                        className="custom-input bg-light"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Matricule</Form.Label>
                                    <Form.Control
                                        name="matricule"
                                        value={form.matricule}
                                        readOnly
                                        className="custom-input bg-light"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
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
