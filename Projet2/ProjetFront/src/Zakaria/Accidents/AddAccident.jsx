import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Row, Col, InputGroup, Spinner } from "react-bootstrap";
import {
    User, Calendar, Activity, Save, Plus
} from "lucide-react";
import "./AddAccident.css";
import ManageResourceModal from "./ManageResourceModal"; // Import the strict modal

const AddAccident = ({ onClose, onSave, departementId, initialData, preloadedEmployees = [], onResourceUpdate }) => {
    const [employees, setEmployees] = useState(preloadedEmployees);
    const [loadingEmployees, setLoadingEmployees] = useState(preloadedEmployees.length === 0);
    const [selectedEmpId, setSelectedEmpId] = useState("");

    // Resource states
    const [lieux, setLieux] = useState([]);
    const [types, setTypes] = useState([]);
    const [natures, setNatures] = useState([]);

    // Modals visibility
    const [manageLieuModal, setManageLieuModal] = useState(false);
    const [manageTypeModal, setManageTypeModal] = useState(false);
    const [manageNatureModal, setManageNatureModal] = useState(false);

    const [form, setForm] = useState(initialData || {
        employe: "",
        matricule: "",
        dateAccident: "",
        heure: "",
        accident_lieu_id: "",
        accident_type_id: "",
        accident_nature_id: "",
        type_accident: "",
        gravite: "léger",
        arretTravail: "non",
        dureeArret: 0,
        statut: "en cours",
        commentaire: "",
        departement_id: departementId || ""
    });

    // Charger les lieux - affiche le cache puis charge l'API
    const fetchLieux = () => {
        const cached = localStorage.getItem('accidentLieuxCache');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0) {
                    setLieux(data);
                }
            } catch (e) { /* ignore */ }
        }
        // Toujours charger depuis l'API pour avoir les données fraîches
        axios.get("http://127.0.0.1:8000/api/accident-lieux", { withCredentials: true })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setLieux(data);
                localStorage.setItem('accidentLieuxCache', JSON.stringify(data));
            })
            .catch(err => console.error("Error fetching lieux", err));
    };

    const fetchTypes = () => {
        const cached = localStorage.getItem('accidentTypesCache');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0) {
                    setTypes(data);
                }
            } catch (e) { /* ignore */ }
        }
        // Toujours charger depuis l'API pour avoir les données fraîches
        axios.get("http://127.0.0.1:8000/api/accident-types", { withCredentials: true })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setTypes(data);
                localStorage.setItem('accidentTypesCache', JSON.stringify(data));
            })
            .catch(err => console.error("Error fetching types", err));
    };

    const fetchNatures = () => {
        const cached = localStorage.getItem('accidentNaturesCache');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (Array.isArray(data) && data.length > 0) {
                    setNatures(data);
                }
            } catch (e) { /* ignore */ }
        }
        // Toujours charger depuis l'API pour avoir les données fraîches
        axios.get("http://127.0.0.1:8000/api/accident-natures", { withCredentials: true })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setNatures(data);
                localStorage.setItem('accidentNaturesCache', JSON.stringify(data));
            })
            .catch(err => console.error("Error fetching natures", err));
    };

    useEffect(() => {
        // Si on a des employés préchargés, les filtrer directement
        if (preloadedEmployees.length > 0) {
            const filtered = departementId
                ? preloadedEmployees.filter(emp => {
                    if (String(emp.departement_id) === String(departementId)) return true;
                    if (emp.departements && Array.isArray(emp.departements)) {
                        return emp.departements.some(d => String(d.id) === String(departementId));
                    }
                    return false;
                })
                : preloadedEmployees;
            setEmployees(filtered);
            setLoadingEmployees(false);
            if (initialData && initialData.matricule) {
                const found = filtered.find(e => e.matricule === initialData.matricule);
                if (found) setSelectedEmpId(found.id);
            }
        } else {
            // Charger depuis localStorage d'abord
            const cached = localStorage.getItem('employeesLightCache');
            if (cached) {
                try {
                    const allEmployees = JSON.parse(cached);
                    const filtered = departementId
                        ? allEmployees.filter(emp => {
                            if (String(emp.departement_id) === String(departementId)) return true;
                            return false;
                        })
                        : allEmployees;
                    setEmployees(filtered);
                    setLoadingEmployees(false);
                    if (initialData && initialData.matricule) {
                        const found = filtered.find(e => e.matricule === initialData.matricule);
                        if (found) setSelectedEmpId(found.id);
                    }
                } catch (e) { /* ignore */ }
            }
            // Utiliser endpoint léger
            axios.get("http://127.0.0.1:8000/api/employes/light", { withCredentials: true })
                .then(res => {
                    if (Array.isArray(res.data)) {
                        localStorage.setItem('employeesLightCache', JSON.stringify(res.data));
                        const filtered = departementId
                            ? res.data.filter(emp => {
                                if (String(emp.departement_id) === String(departementId)) return true;
                                return false;
                            })
                            : res.data;
                        setEmployees(filtered);
                        if (initialData && initialData.matricule) {
                            const found = filtered.find(e => e.matricule === initialData.matricule);
                            if (found) setSelectedEmpId(found.id);
                        }
                    }
                })
                .catch(err => console.error("Error fetching employees", err))
                .finally(() => setLoadingEmployees(false));
        }

        fetchLieux();
        fetchTypes();
        fetchNatures();
    }, [initialData, departementId, preloadedEmployees]);

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

    const handleMatriculeChange = (e) => {
        const val = e.target.value;
        const found = employees.find(emp => String(emp.matricule).trim().toLowerCase() === String(val).trim().toLowerCase());

        if (found) {
            setSelectedEmpId(found.id);
            setForm(prev => ({
                ...prev,
                matricule: found.matricule, // Normaliser avec la valeur réelle
                employe: `${found.prenom} ${found.nom}`,
                departement_id: found.departement_id || prev.departement_id
            }));
        } else {
            setSelectedEmpId("");
            setForm(prev => ({ ...prev, matricule: val }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddLieu = async (nom) => {
        const res = await axios.post("http://127.0.0.1:8000/api/accident-lieux", { nom }, { withCredentials: true });
        const newLieux = [...lieux, res.data];
        setLieux(newLieux);
        setForm(prev => ({ ...prev, accident_lieu_id: res.data.id }));
        localStorage.setItem('accidentLieuxCache', JSON.stringify(newLieux));
        onResourceUpdate?.('lieux', newLieux);
    };

    const handleEditLieu = async (id, nom) => {
        const res = await axios.put(`http://127.0.0.1:8000/api/accident-lieux/${id}`, { nom }, { withCredentials: true });
        const newLieux = lieux.map(item => String(item.id) === String(id) ? res.data : item);
        setLieux(newLieux);
        localStorage.setItem('accidentLieuxCache', JSON.stringify(newLieux));
        onResourceUpdate?.('lieux', newLieux);
    };

    const handleDeleteLieu = async (id) => {
        await axios.delete(`http://127.0.0.1:8000/api/accident-lieux/${id}`, { withCredentials: true });
        const newLieux = lieux.filter(item => String(item.id) !== String(id));
        setLieux(newLieux);
        localStorage.setItem('accidentLieuxCache', JSON.stringify(newLieux));
        onResourceUpdate?.('lieux', newLieux);
        if (String(form.accident_lieu_id) === String(id)) setForm(prev => ({ ...prev, accident_lieu_id: "" }));
    };

    // Generic handlers for Types
    const handleAddType = async (nom) => {
        const res = await axios.post("http://127.0.0.1:8000/api/accident-types", { nom }, { withCredentials: true });
        const newTypes = [...types, res.data];
        setTypes(newTypes);
        setForm(prev => ({ ...prev, accident_type_id: res.data.id }));
        localStorage.setItem('accidentTypesCache', JSON.stringify(newTypes));
        onResourceUpdate?.('types', newTypes);
    };

    const handleEditType = async (id, nom) => {
        const res = await axios.put(`http://127.0.0.1:8000/api/accident-types/${id}`, { nom }, { withCredentials: true });
        const newTypes = types.map(item => String(item.id) === String(id) ? res.data : item);
        setTypes(newTypes);
        localStorage.setItem('accidentTypesCache', JSON.stringify(newTypes));
        onResourceUpdate?.('types', newTypes);
    };

    const handleDeleteType = async (id) => {
        await axios.delete(`http://127.0.0.1:8000/api/accident-types/${id}`, { withCredentials: true });
        const newTypes = types.filter(item => String(item.id) !== String(id));
        setTypes(newTypes);
        localStorage.setItem('accidentTypesCache', JSON.stringify(newTypes));
        onResourceUpdate?.('types', newTypes);
        if (String(form.accident_type_id) === String(id)) setForm(prev => ({ ...prev, accident_type_id: "" }));
    };


    // Generic handlers for Natures
    const handleAddNature = async (nom) => {
        const res = await axios.post("http://127.0.0.1:8000/api/accident-natures", { nom }, { withCredentials: true });
        const newNatures = [...natures, res.data];
        setNatures(newNatures);
        setForm(prev => ({ ...prev, accident_nature_id: res.data.id }));
        localStorage.setItem('accidentNaturesCache', JSON.stringify(newNatures));
        onResourceUpdate?.('natures', newNatures);
    };

    const handleEditNature = async (id, nom) => {
        const res = await axios.put(`http://127.0.0.1:8000/api/accident-natures/${id}`, { nom }, { withCredentials: true });
        const newNatures = natures.map(item => String(item.id) === String(id) ? res.data : item);
        setNatures(newNatures);
        localStorage.setItem('accidentNaturesCache', JSON.stringify(newNatures));
        onResourceUpdate?.('natures', newNatures);
    };

    const handleDeleteNature = async (id) => {
        await axios.delete(`http://127.0.0.1:8000/api/accident-natures/${id}`, { withCredentials: true });
        const newNatures = natures.filter(item => String(item.id) !== String(id));
        setNatures(newNatures);
        localStorage.setItem('accidentNaturesCache', JSON.stringify(newNatures));
        onResourceUpdate?.('natures', newNatures);
        if (String(form.accident_nature_id) === String(id)) setForm(prev => ({ ...prev, accident_nature_id: "" }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="add-accident-container shadow-lg">
            <div style={{
                position: 'relative',
                background: '#f9fafb',
                borderBottom: '1px solid #e9ecef',
                padding: '0.99rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <h5 style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: '1.15rem',
                    color: '#4b5563',
                    textAlign: 'center',
                    letterSpacing: '0.2px',
                }}>
                    {initialData ? 'Modifier Accident' : 'Nouveau Accident'}
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
                        fontSize: '1.3rem',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '4px',
                        lineHeight: 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    &times;
                </button>
            </div>

            <div className="form-body p-3 flex-grow-1 overflow-auto">
                <Form onSubmit={handleSubmit}>
                    <div className="form-section mb-2">
                        <h6 className="section-title-custom mb-1">
                            <User size={16} className="me-2" />
                            Informations Employé
                        </h6>
                        <Row className="g-1">
                            <Col md={6}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Sélectionner un employé</Form.Label>
                                    <div style={{ position: 'relative' }}>
                                        <Form.Select
                                            value={selectedEmpId}
                                            onChange={handleEmployeeSelect}
                                            className="custom-input"
                                            size="sm"
                                            disabled={loadingEmployees}
                                            style={{ paddingRight: loadingEmployees ? '40px' : undefined }}
                                        >
                                            <option value="">
                                                {loadingEmployees ? 'Chargement des employés...' : '-- Choisir --'}
                                            </option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.nom} {emp.prenom} ({emp.matricule})
                                                </option>
                                            ))}
                                        </Form.Select>
                                        {loadingEmployees && (
                                            <Spinner
                                                animation="border"
                                                size="sm"
                                                style={{
                                                    position: 'absolute',
                                                    right: '35px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    color: '#2c767c'
                                                }}
                                            />
                                        )}
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Matricule</Form.Label>
                                    <Form.Control
                                        name="matricule"
                                        value={form.matricule}
                                        onChange={handleMatriculeChange}
                                        placeholder="N° Matricule"
                                        className="custom-input"
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <div className="form-section mb-2">
                        <h6 className="section-title-custom mb-1">
                            <Calendar size={16} className="me-2" />
                            Détails de l'Accident
                        </h6>
                        <Row className="g-1">
                            <Col md={6}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dateAccident"
                                        value={form.dateAccident}
                                        onChange={handleChange}
                                        className="custom-input"
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Heure</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="heure"
                                        value={form.heure}
                                        onChange={handleChange}
                                        className="custom-input"
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="g-1">
                            <Col md={6}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Lieu</Form.Label>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <Form.Select
                                            name="accident_lieu_id"
                                            value={form.accident_lieu_id}
                                            onChange={handleChange}
                                            size="sm"
                                            style={{
                                                flex: 1,
                                                border: '1.5px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                color: '#374151',
                                                padding: '6px 10px',
                                                boxShadow: 'none',
                                                outline: 'none',
                                                appearance: 'none',
                                            }}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {lieux.map(l => (
                                                <option key={l.id} value={l.id}>{l.nom}</option>
                                            ))}
                                        </Form.Select>
                                        <button
                                            type="button"
                                            onClick={() => setManageLieuModal(true)}
                                            title="Gérer les lieux"
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1.5px solid #d1d5db',
                                                borderRadius: '8px',
                                                background: '#fff',
                                                color: '#374151',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                fontSize: '1.1rem',
                                                lineHeight: 1,
                                                fontWeight: 500,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                        >
                                            +
                                        </button>
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Type d'Accident</Form.Label>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <Form.Select
                                            name="accident_type_id"
                                            value={form.accident_type_id}
                                            onChange={handleChange}
                                            size="sm"
                                            style={{
                                                flex: 1,
                                                border: '1.5px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                color: '#374151',
                                                padding: '6px 10px',
                                                boxShadow: 'none',
                                                outline: 'none',
                                                appearance: 'none',
                                            }}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {types.map(t => (
                                                <option key={t.id} value={t.id}>{t.nom}</option>
                                            ))}
                                        </Form.Select>
                                        <button
                                            type="button"
                                            onClick={() => setManageTypeModal(true)}
                                            title="Gérer les types"
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1.5px solid #d1d5db',
                                                borderRadius: '8px',
                                                background: '#fff',
                                                color: '#374151',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                fontSize: '1.1rem',
                                                lineHeight: 1,
                                                fontWeight: 500,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                        >
                                            +
                                        </button>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-1">
                            <Col md={6}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Nature d'Accident</Form.Label>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <Form.Select
                                            name="accident_nature_id"
                                            value={form.accident_nature_id}
                                            onChange={handleChange}
                                            size="sm"
                                            style={{
                                                flex: 1,
                                                border: '1.5px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                color: '#374151',
                                                padding: '6px 10px',
                                                boxShadow: 'none',
                                                outline: 'none',
                                                appearance: 'none',
                                            }}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {natures.map(n => (
                                                <option key={n.id} value={n.id}>{n.nom}</option>
                                            ))}
                                        </Form.Select>
                                        <button
                                            type="button"
                                            onClick={() => setManageNatureModal(true)}
                                            title="Gérer les natures"
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1.5px solid #d1d5db',
                                                borderRadius: '8px',
                                                background: '#fff',
                                                color: '#374151',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                fontSize: '1.1rem',
                                                lineHeight: 1,
                                                fontWeight: 500,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                        >
                                            +
                                        </button>
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Statut</Form.Label>
                                    <Form.Select
                                        name="statut"
                                        value={form.statut}
                                        onChange={handleChange}
                                        className="custom-input"
                                        size="sm"
                                    >
                                        <option value="en cours">En cours</option>
                                        <option value="déclaré">Déclaré</option>
                                        <option value="clôturé">Clôturé</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-1">
                            <Col md={6}>
                                <Form.Group className="mb-1 d-flex flex-column">
                                    <Form.Label className="small fw-bold">Arrêt travail</Form.Label>
                                    <div className="d-flex align-items-center mt-1">
                                        <Form.Check
                                            type="switch"
                                            id="arret-switch"
                                            label={form.arretTravail === "oui" ? "Oui" : "Non"}
                                            checked={form.arretTravail === "oui"}
                                            onChange={(e) => setForm({ ...form, arretTravail: e.target.checked ? "oui" : "non" })}
                                            style={{ fontSize: '1rem' }}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            {form.arretTravail === "oui" && (
                                <Col md={6}>
                                    <Form.Group className="mb-1">
                                        <Form.Label className="small fw-bold">Durée (jours)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="dureeArret"
                                            value={form.dureeArret}
                                            onChange={handleChange}
                                            className="custom-input"
                                            size="sm"
                                        />
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>

                        <Row className="g-1">
                            <Col md={12}>
                                <Form.Group className="mb-1">
                                    <Form.Label className="small fw-bold">Commentaire</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="commentaire"
                                        value={form.commentaire}
                                        onChange={handleChange}
                                        placeholder="Saisir un commentaire..."
                                        className="custom-input"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                </Form>
            </div>

            <div style={{
                background: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
            }}>
                <button
                    onClick={onClose}
                    style={{
                        background: '#2c7a7b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '9px 32px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    Annuler
                </button>
                <button
                    onClick={handleSubmit}
                    style={{
                        background: '#2c7a7b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '9px 32px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <Save size={16} />
                    Enregistrer
                </button>
            </div>

            {/* Modals de gestion Lieux, Types, Natures */}
            <ManageResourceModal
                show={manageLieuModal}
                onHide={() => setManageLieuModal(false)}
                title="Gérer les Lieux"
                items={lieux}
                onAdd={handleAddLieu}
                onEdit={handleEditLieu}
                onDelete={handleDeleteLieu}
            />

            <ManageResourceModal
                show={manageTypeModal}
                onHide={() => setManageTypeModal(false)}
                title="Gérer les Types d'Accident"
                items={types}
                onAdd={handleAddType}
                onEdit={handleEditType}
                onDelete={handleDeleteType}
            />

            <ManageResourceModal
                show={manageNatureModal}
                onHide={() => setManageNatureModal(false)}
                title="Gérer les Natures d'Accident"
                items={natures}
                onAdd={handleAddNature}
                onEdit={handleEditNature}
                onDelete={handleDeleteNature}
            />
        </div>
    );
};

export default AddAccident;
