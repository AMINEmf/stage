import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Row, Col, Modal, InputGroup } from "react-bootstrap";
import {
    User, Calendar, MapPin, Activity, Save, X, Info, AlertTriangle,
    Clock, FileText, Plus
} from "lucide-react";
import "./AddAccident.css";

const AddAccident = ({ onClose, onSave, departementId, initialData }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState("");
    const [lieux, setLieux] = useState([]);
    const [showLieuModal, setShowLieuModal] = useState(false);
    const [newLieu, setNewLieu] = useState("");

    const [form, setForm] = useState(initialData || {
        employe: "",
        matricule: "",
        dateAccident: "",
        heure: "",
        accident_lieu_id: "",
        gravite: "léger",
        arretTravail: "non",
        dureeArret: 0,
        declarationCnss: "non",
        statut: "en cours",
        departement_id: departementId || ""
    });

    const fetchLieux = () => {
        axios.get("http://127.0.0.1:8000/api/accident-lieux", { withCredentials: true })
            .then(res => setLieux(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Error fetching lieux", err));
    };

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/departements/employes", { withCredentials: true })
            .then(res => {
                if (Array.isArray(res.data)) {
                    // Filtrer les employés par département sélectionné
                    const filtered = departementId
                        ? res.data.filter(emp => {
                            // Vérifier via le champ departement_id direct
                            if (String(emp.departement_id) === String(departementId)) return true;
                            // Vérifier via la relation departements (pivot)
                            if (emp.departements && Array.isArray(emp.departements)) {
                                return emp.departements.some(d => String(d.id) === String(departementId));
                            }
                            return false;
                        })
                        : res.data;
                    setEmployees(filtered);
                    // Attempt to find existing employee by matricule if editing
                    if (initialData && initialData.matricule) {
                        const found = filtered.find(e => e.matricule === initialData.matricule);
                        if (found) setSelectedEmpId(found.id);
                    }
                }
            })
            .catch(err => console.error("Error fetching employees", err));

        fetchLieux();
    }, [initialData, departementId]);

    const handleEmployeeSelect = (e) => {
        const empId = e.target.value;
        setSelectedEmpId(empId);

        if (empId) {
            const emp = employees.find(ep => String(ep.id) === String(empId));
            if (emp) {
                setForm(prev => ({
                    ...prev,
                    employe: `${emp.prenom} ${emp.nom}`, // Or nom prenom depending on preference
                    matricule: emp.matricule,
                    departement_id: emp.departement_id || prev.departement_id
                }));
            }
        } else {
            // Reset?
            setForm(prev => ({
                ...prev,
                employe: "",
                matricule: ""
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddLieu = () => {
        if (!newLieu.trim()) return;
        axios.post("http://127.0.0.1:8000/api/accident-lieux", { nom: newLieu }, { withCredentials: true })
            .then(res => {
                setLieux(prev => [...prev, res.data]);
                setForm(prev => ({ ...prev, accident_lieu_id: res.data.id }));
                setShowLieuModal(false);
                setNewLieu("");
            })
            .catch(err => console.error("Error adding lieu", err));
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
                            <Form.Label className="small fw-bold">Sélectionner un employé</Form.Label>
                            <Form.Select
                                value={selectedEmpId}
                                onChange={handleEmployeeSelect}
                                className="custom-input mb-2"
                            >
                                <option value="">-- Choisir --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.nom} {emp.prenom} ({emp.matricule})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Employé (Nom Complet)</Form.Label>
                            <Form.Control
                                name="employe"
                                value={form.employe}
                                onChange={handleChange}
                                placeholder="Nom complet"
                                className="custom-input"
                                readOnly
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
                                readOnly
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
                            <InputGroup>
                                <Form.Select
                                    name="accident_lieu_id"
                                    value={form.accident_lieu_id}
                                    onChange={handleChange}
                                    className="custom-input"
                                >
                                    <option value="">-- Choisir un lieu --</option>
                                    {lieux.map(l => (
                                        <option key={l.id} value={l.id}>{l.nom}</option>
                                    ))}
                                </Form.Select>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowLieuModal(true)}
                                    style={{ borderLeft: 'none', backgroundColor: '#f8fafc' }}
                                >
                                    <Plus size={18} color="#2c767c" />
                                </Button>
                            </InputGroup>
                        </Form.Group>                    </div>

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

            {/* Modal pour ajouter un lieu */}
            <Modal show={showLieuModal} onHide={() => setShowLieuModal(false)} centered size="sm">
                <Modal.Header closeButton style={{ backgroundColor: '#f8fafc' }}>
                    <Modal.Title style={{ fontSize: '1rem', color: '#2c767c' }}>Ajouter un lieu</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Nom du lieu</Form.Label>
                        <Form.Control
                            type="text"
                            value={newLieu}
                            onChange={(e) => setNewLieu(e.target.value)}
                            placeholder="Ex: Atelier A, Bureau..."
                            autoFocus
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: '#f8fafc' }}>
                    <Button variant="light" size="sm" onClick={() => setShowLieuModal(false)}>Annuler</Button>
                    <Button variant="primary" size="sm" onClick={handleAddLieu} style={{ backgroundColor: '#2c767c', border: 'none' }}>Ajouter</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AddAccident;
