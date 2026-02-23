import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
    User, Calendar, Activity, Save,
    FileText, DollarSign, Upload, Briefcase, X, Plus, Eye, Trash2
} from "lucide-react";
import Swal from "sweetalert2";
import "../Accidents/AddAccident.css"; // Réutilisation du style

const AddCimr = ({ onClose, onSave, departementId, initialData, preloadedEmployees = [] }) => {
    const [employees, setEmployees] = useState(preloadedEmployees);
    const [existingAffiliations, setExistingAffiliations] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [filesToDelete, setFilesToDelete] = useState([]);

    const [form, setForm] = useState(initialData || {
        employe: "",
        matricule: "",
        cin: "",
        poste: "",
        dateEmbauche: "",
        dateAffiliation: "",
        dateFinAffiliation: "",
        numeroCimr: "",
        salaireCotisable: 0,
        tauxEmployeur: 0,
        montantCotisation: 0,
        statut: "actif",
        departement_id: departementId || ""
    });

    const fetchEmployees = () => {
        // Charger affiliations existantes depuis cache
        const cachedAff = localStorage.getItem('cimrAffiliationsCache');
        if (cachedAff) {
            try { setExistingAffiliations(JSON.parse(cachedAff)); } catch (e) { /* ignore */ }
        }

        // Si employés préchargés, les utiliser directement
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
            if (initialData && initialData.matricule) {
                const found = filtered.find(e => e.matricule === initialData.matricule);
                if (found) setSelectedEmpId(found.id);
            }
            // Charger seulement les affiliations
            axios.get("http://127.0.0.1:8000/api/cimr-affiliations", { withCredentials: true })
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setExistingAffiliations(res.data);
                        localStorage.setItem('cimrAffiliationsCache', JSON.stringify(res.data));
                    }
                })
                .catch(err => console.error("Error fetching affiliations", err));
            return;
        }

        // Sinon, charger depuis localStorage puis API
        const cachedEmp = localStorage.getItem('employeesLightCache');
        if (cachedEmp) {
            try {
                const allEmployees = JSON.parse(cachedEmp);
                const filtered = departementId
                    ? allEmployees.filter(emp => String(emp.departement_id) === String(departementId))
                    : allEmployees;
                setEmployees(filtered);
                if (initialData && initialData.matricule) {
                    const found = filtered.find(e => e.matricule === initialData.matricule);
                    if (found) setSelectedEmpId(found.id);
                }
            } catch (e) { /* ignore */ }
        }

        // Charger depuis API léger
        const fetchEmployeesReq = axios.get("http://127.0.0.1:8000/api/employes/light", { withCredentials: true });
        const fetchAffiliationsReq = axios.get("http://127.0.0.1:8000/api/cimr-affiliations", { withCredentials: true });

        Promise.all([fetchEmployeesReq, fetchAffiliationsReq])
            .then(([empRes, affRes]) => {
                if (Array.isArray(empRes.data)) {
                    localStorage.setItem('employeesLightCache', JSON.stringify(empRes.data));
                    const filtered = departementId
                        ? empRes.data.filter(emp => String(emp.departement_id) === String(departementId))
                        : empRes.data;
                    setEmployees(filtered);
                    if (initialData && initialData.matricule) {
                        const found = filtered.find(e => e.matricule === initialData.matricule);
                        if (found) setSelectedEmpId(found.id);
                    }
                }
                if (Array.isArray(affRes.data)) {
                    setExistingAffiliations(affRes.data);
                    localStorage.setItem('cimrAffiliationsCache', JSON.stringify(affRes.data));
                }
            })
            .catch(err => console.error("Error fetching data", err));
    };

    useEffect(() => {
        fetchEmployees();
    }, [initialData, departementId, preloadedEmployees]);

    // Charger les fichiers existants quand on édite
    useEffect(() => {
        // Support both camelCase (from UI mapping) and snake_case (from API)
        const fileData = initialData?.ficheAffiliation || initialData?.fiche_affiliation;
        if (initialData && fileData) {
            try {
                const files = JSON.parse(fileData);
                if (Array.isArray(files)) {
                    setExistingFiles(files);
                } else if (typeof fileData === 'string') {
                    // Legacy: single file path
                    setExistingFiles([fileData]);
                }
            } catch (e) {
                // Si ce n'est pas du JSON, c'est un chemin simple
                if (fileData) {
                    setExistingFiles([fileData]);
                }
            }
        }
    }, [initialData]);

    useEffect(() => {
        const salaire = parseFloat(form.salaireCotisable) || 0;
        const taux = parseFloat(form.tauxEmployeur) || 0;
        const montant = (salaire * taux) / 100;

        if (form.montantCotisation !== montant) {
            setForm(prev => ({ ...prev, montantCotisation: montant }));
        }
    }, [form.salaireCotisable, form.tauxEmployeur]);

    const handleEmployeeSelect = (e) => {
        const empId = e.target.value;
        setSelectedEmpId(empId);

        if (empId) {
            const emp = employees.find(ep => String(ep.id) === String(empId));
            if (emp) {
                // Check if already affiliated
                const isAffiliated = existingAffiliations.some(a => String(a.matricule) === String(emp.matricule));

                if (isAffiliated && !initialData) {
                    Swal.fire({
                        title: 'Déjà affilié',
                        text: `L'employé ${emp.prenom} ${emp.nom} possède déjà une affiliation CIMR.`,
                        icon: 'info',
                        confirmButtonColor: '#2c767c'
                    });
                }

                setForm(prev => ({
                    ...prev,
                    employe: `${emp.prenom} ${emp.nom}`,
                    matricule: emp.matricule,
                    cin: emp.cin || "",
                    poste: emp.fonction || "",
                    dateEmbauche: emp.date_embauche || "",
                    salaireCotisable: emp.salaire_base || 0,
                    departement_id: emp.departement_id || prev.departement_id
                }));
            }
        } else {
            setForm(prev => ({
                ...prev,
                employe: "",
                matricule: "",
                cin: "",
                poste: "",
                dateEmbauche: ""
            }));
        }
    };

    const handleMatriculeChange = (e) => {
        const val = e.target.value;
        const found = employees.find(emp => String(emp.matricule).trim().toLowerCase() === String(val).trim().toLowerCase());

        if (found) {
            // Check if already affiliated
            const isAffiliated = existingAffiliations.some(a => String(a.matricule) === String(found.matricule));
            if (isAffiliated && !initialData) {
                Swal.fire({
                    title: 'Déjà affilié',
                    text: `L'employé ${found.prenom} ${found.nom} possède déjà une affiliation CIMR.`,
                    icon: 'info',
                    confirmButtonColor: '#2c767c'
                });
            }

            setSelectedEmpId(found.id);
            setForm(prev => ({
                ...prev,
                matricule: found.matricule,
                employe: `${found.prenom} ${found.nom}`,
                cin: found.cin || "",
                poste: found.fonction || "",
                dateEmbauche: found.date_embauche || "",
                salaireCotisable: found.salaire_base || 0,
                departement_id: found.departement_id || prev.departement_id
            }));
        } else {
            setSelectedEmpId("");
            setForm(prev => ({ ...prev, matricule: val }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const maxSize = 20 * 1024 * 1024; // 20MB par fichier
            const validFiles = [];
            const invalidFiles = [];

            newFiles.forEach(file => {
                if (file.size > maxSize) {
                    invalidFiles.push(file.name);
                } else {
                    // Éviter les doublons
                    if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                        validFiles.push(file);
                    }
                }
            });

            if (invalidFiles.length > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Fichiers trop volumineux',
                    text: `Les fichiers suivants dépassent 20MB: ${invalidFiles.join(', ')}`,
                    confirmButtonColor: '#2c767c'
                });
            }

            if (validFiles.length > 0) {
                setSelectedFiles(prev => [...prev, ...validFiles]);
            }
            e.target.value = ''; // Reset input pour permettre de resélectionner
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Fonctions pour gérer les fichiers existants
    const viewExistingFile = (filePath) => {
        const url = `http://127.0.0.1:8000/storage/${filePath}`;
        window.open(url, '_blank');
    };

    const removeExistingFile = (filePath) => {
        Swal.fire({
            title: 'Supprimer ce fichier ?',
            text: 'Cette action sera effective après enregistrement.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                setFilesToDelete(prev => [...prev, filePath]);
                setExistingFiles(prev => prev.filter(f => f !== filePath));
            }
        });
    };

    const getFileName = (filePath) => {
        // Extraire le nom du fichier du chemin
        const parts = filePath.split('/');
        const fullName = parts[parts.length - 1];
        // Enlever le timestamp et uniqid du début
        const nameParts = fullName.split('_');
        if (nameParts.length > 2) {
            return nameParts.slice(2).join('_');
        }
        return fullName;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('employe', form.employe);
        formData.append('matricule', form.matricule);
        formData.append('cin', form.cin || '');
        formData.append('poste', form.poste || '');
        formData.append('date_embauche', form.dateEmbauche || '');
        formData.append('date_affiliation', form.dateAffiliation || '');
        formData.append('date_fin_affiliation', form.dateFinAffiliation || '');
        formData.append('numero_cimr', form.numeroCimr || '');
        formData.append('salaire_cotisable', form.salaireCotisable || 0);
        formData.append('taux_employeur', form.tauxEmployeur || 0);
        formData.append('montant_cotisation', form.montantCotisation || 0);
        formData.append('statut', form.statut);
        formData.append('departement_id', form.departement_id || '');

        // Nouveaux fichiers à ajouter
        if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
                formData.append(`fiche_affiliation[${index}]`, file);
            });
        }

        // Fichiers existants à conserver (en mode édition)
        if (existingFiles.length > 0) {
            formData.append('files_to_keep', JSON.stringify(existingFiles));
        }

        // Fichiers à supprimer (en mode édition)
        if (filesToDelete.length > 0) {
            formData.append('files_to_delete', JSON.stringify(filesToDelete));
        }

        // Always pass true since we're using FormData
        onSave(formData, true);
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
                <h5 style={{ margin: 0, fontWeight: 600, fontSize: '1.15rem', color: '#4b5563', textAlign: 'center', letterSpacing: '0.2px' }}>
                    {initialData ? 'Modifier Affiliation CIMR' : 'Nouvelle Affiliation CIMR'}
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
                        <h6 className="section-title-custom mb-2">
                            <User size={16} className="me-2" />
                            Informations Employé
                        </h6>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Sélectionner un employé</Form.Label>
                                    <Form.Select
                                        value={selectedEmpId}
                                        onChange={handleEmployeeSelect}
                                        className="custom-input"
                                        size="sm"
                                        disabled={!!initialData}
                                    >
                                        <option value="">-- Choisir --</option>
                                        {employees
                                            .filter(emp => {
                                                if (initialData && initialData.matricule === emp.matricule) return true;
                                                const isAffiliated = existingAffiliations.some(a => String(a.matricule) === String(emp.matricule));
                                                return !isAffiliated;
                                            })
                                            .map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.nom} {emp.prenom} ({emp.matricule})
                                                </option>
                                            ))
                                        }
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Matricule</Form.Label>
                                    <Form.Control
                                        name="matricule"
                                        value={form.matricule}
                                        onChange={handleMatriculeChange}
                                        placeholder="N° Matricule"
                                        className="custom-input"
                                        size="sm"
                                        disabled={!!initialData}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">CIN</Form.Label>
                                    <Form.Control
                                        name="cin"
                                        value={form.cin}
                                        className="custom-input"
                                        size="sm"
                                        readOnly
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">
                                        <Briefcase size={14} className="me-1" />
                                        Poste
                                    </Form.Label>
                                    <Form.Control
                                        name="poste"
                                        value={form.poste}
                                        className="custom-input"
                                        size="sm"
                                        readOnly
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">
                                        <Calendar size={14} className="me-1" />
                                        Date d'embauche
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dateEmbauche"
                                        value={form.dateEmbauche}
                                        className="custom-input"
                                        size="sm"
                                        readOnly
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <div className="form-section mb-4">
                        <h6 className="section-title-custom mb-2">
                            <FileText size={16} className="me-2" />
                            Détails Affiliation
                        </h6>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Numéro CIMR</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="numeroCimr"
                                        value={form.numeroCimr}
                                        onChange={handleChange}
                                        className="custom-input"
                                        size="sm"
                                        placeholder="Ex: 123456789"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Statut</Form.Label>
                                    <Form.Select name="statut" value={form.statut} onChange={handleChange} className="custom-input" size="sm">
                                        <option value="actif">Actif</option>
                                        <option value="suspendu">Suspendu</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Date d'affiliation</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dateAffiliation"
                                        value={form.dateAffiliation}
                                        onChange={handleChange}
                                        className="custom-input"
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Date fin d'affiliation</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dateFinAffiliation"
                                        value={form.dateFinAffiliation}
                                        onChange={handleChange}
                                        className="custom-input"
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <div className="form-section mb-4">
                        <h6 className="section-title-custom mb-2">
                            <DollarSign size={16} className="me-2" />
                            Cotisations
                        </h6>
                        <Row className="g-2">
                            <Col md={4}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Salaire Cotisable</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="salaireCotisable"
                                        value={form.salaireCotisable}
                                        onChange={handleChange}
                                        className="custom-input"
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Taux Employeur (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="tauxEmployeur"
                                        value={form.tauxEmployeur}
                                        onChange={handleChange}
                                        className="custom-input"
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Montant Cotisation</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="montantCotisation"
                                        value={form.montantCotisation}
                                        className="custom-input fw-bold"
                                        size="sm"
                                        style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <div className="form-section mb-4">
                        <h6 className="section-title-custom mb-2">
                            <Upload size={16} className="me-2" />
                            Fiches d'Affiliation
                        </h6>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold">Joindre des fichiers (PDF, JPG, PNG)</Form.Label>
                            <div style={{
                                border: '2px dashed #e2e8f0',
                                borderRadius: '8px',
                                padding: '16px',
                                backgroundColor: '#f8fafc',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                                onClick={() => document.getElementById('file-upload-input').click()}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#2c767c'; }}
                                onDragLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    const files = e.dataTransfer.files;
                                    if (files.length) {
                                        handleFileChange({ target: { files } });
                                    }
                                }}
                            >
                                <Plus size={24} color="#64748b" style={{ marginBottom: '8px' }} />
                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                    Cliquez ou glissez-déposez vos fichiers ici
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>
                                    PDF, JPG, PNG (max 20MB par fichier)
                                </div>
                            </div>
                            <Form.Control
                                id="file-upload-input"
                                type="file"
                                onChange={handleFileChange}
                                className="d-none"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                            />

                            {/* Liste des fichiers existants (en mode édition) */}
                            {existingFiles.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '8px', fontWeight: 600 }}>
                                        📎 {existingFiles.length} fichier(s) existant(s)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {existingFiles.map((filePath, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 12px',
                                                backgroundColor: '#ecfdf5',
                                                border: '1px solid #a7f3d0',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                                    <FileText size={16} color="#10b981" />
                                                    <span style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        color: '#065f46'
                                                    }}>
                                                        {getFileName(filePath)}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); viewExistingFile(filePath); }}
                                                        style={{
                                                            background: '#dbeafe',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '4px 6px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        title="Voir le fichier"
                                                    >
                                                        <Eye size={14} color="#2563eb" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeExistingFile(filePath); }}
                                                        style={{
                                                            background: '#fee2e2',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '4px 6px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        title="Supprimer ce fichier"
                                                    >
                                                        <Trash2 size={14} color="#dc2626" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Liste des nouveaux fichiers sélectionnés */}
                            {selectedFiles.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#2c767c', marginBottom: '8px', fontWeight: 600 }}>
                                        ➕ {selectedFiles.length} nouveau(x) fichier(s) à ajouter
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 12px',
                                                backgroundColor: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                                    <FileText size={16} color="#2c767c" />
                                                    <span style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        color: '#334155'
                                                    }}>
                                                        {file.name}
                                                    </span>
                                                    <span style={{ color: '#94a3b8', flexShrink: 0 }}>
                                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                    style={{
                                                        background: '#fee2e2',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '4px 6px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <X size={14} color="#dc2626" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Form.Group>
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
        </div>
    );
};

export default AddCimr;
