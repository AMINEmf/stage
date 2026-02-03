import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
    User, Calendar, MapPin, Activity, Save, X, Info, AlertTriangle,
    Clock, FileText
} from "lucide-react";
import "./AddAccident.css";

const AddAccident = ({ onClose, onSave, departementId, initialData }) => {
    const [form, setForm] = useState(initialData || {
        employe: "",
        matricule: "",
        dateAccident: "",
        heure: "",
        lieu: "",
        typeAccident: "accident de travail",
        gravite: "léger",
        arretTravail: "non",
        dureeArret: 0,
        declarationCnss: "non",
        statut: "en cours",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="add-accident-container shadow-lg">
            <div className="form-header p-3 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8fafc' }}>
                <h5 className="mb-0 fw-bold text-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2c767c' }}>
                    <Activity size={20} />
                    {initialData ? 'Modifier Accident' : 'Nouvel Accident'}
                </h5>
                <button
                    onClick={onClose}
                    className="btn-close-custom"
                    aria-label="Fermer"
                    style={{
                        background: "transparent",
                        border: "none",
                        padding: "0 10px",
                        fontSize: "2rem",
                        color: "#4b5563",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
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
                            <Form.Label className="small fw-bold">Employé</Form.Label>
                            <Form.Control
                                name="employe"
                                value={form.employe}
                                onChange={handleChange}
                                placeholder="Nom complet"
                                className="custom-input"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Matricule</Form.Label>
                            <Form.Control
                                name="matricule"
                                value={form.matricule}
                                onChange={handleChange}
                                placeholder="N° Matricule"
                                className="custom-input"
                            />
                        </Form.Group>
                    </div>

                    <div className="form-section mb-4">
                        <h6 className="section-title-custom mb-3">
                            <Calendar size={16} className="me-2" />
                            Détails de l'Accident
                        </h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dateAccident"
                                        value={form.dateAccident}
                                        onChange={handleChange}
                                        className="custom-input"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Heure</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="heure"
                                        value={form.heure}
                                        onChange={handleChange}
                                        className="custom-input"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Lieu</Form.Label>
                            <Form.Control
                                name="lieu"
                                value={form.lieu}
                                onChange={handleChange}
                                placeholder="Lieu de l'évènement"
                                className="custom-input"
                            />
                        </Form.Group>
                    </div>

                    <div className="form-section mb-4">
                        <h6 className="section-title-custom mb-3">
                            <AlertTriangle size={16} className="me-2" />
                            Gravité & Statut
                        </h6>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Gravité</Form.Label>
                            <Form.Select name="gravite" value={form.gravite} onChange={handleChange} className="custom-input">
                                <option value="léger">Léger</option>
                                <option value="moyen">Moyen</option>
                                <option value="grave">Grave</option>
                            </Form.Select>
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Arrêt travail</Form.Label>
                                    <Form.Select name="arretTravail" value={form.arretTravail} onChange={handleChange} className="custom-input">
                                        <option value="non">Non</option>
                                        <option value="oui">Oui</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Durée (j)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="dureeArret"
                                        value={form.dureeArret}
                                        onChange={handleChange}
                                        className="custom-input"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                </Form>
            </div>

            <div className="form-footer p-3 border-top d-flex justify-content-end gap-2" style={{ backgroundColor: '#f8fafc' }}>
                <Button variant="light" onClick={onClose} className="px-4 fw-bold">Annuler</Button>
                <Button variant="primary" onClick={handleSubmit} className="px-4 fw-bold d-flex align-items-center gap-2" style={{ backgroundColor: '#2c767c', border: 'none' }}>
                    <Save size={18} />
                    Enregistrer
                </Button>
            </div>
        </div>
    );
};

export default AddAccident;
