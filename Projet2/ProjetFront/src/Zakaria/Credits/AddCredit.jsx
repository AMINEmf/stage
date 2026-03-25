import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
    User, Calendar, Activity, Save,
    FileText, DollarSign, Upload, Briefcase, X, Plus, Eye, Trash2
} from "lucide-react";
import Swal from "sweetalert2";
import "../Accidents/AddAccident.css"; // Réutilisation du style


const AddCredit = ({ onClose, onSave, departementId, initialData, preloadedEmployees = [] }) => {
    const [employees, setEmployees] = useState(preloadedEmployees);
    const [existingAffiliations, setExistingAffiliations] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState("");
    const [existingFiles, setExistingFiles] = useState([]);
    const [filesToDelete, setFilesToDelete] = useState([]);

    console.log("les employess",employees)
    console.log("initial data :",initialData)
    const [form, setForm] = useState({ 
        id_credit: initialData?.id || selectedEmpId || 0,
        id_typeCredit: initialData?.id_typeCredit,
        departement_id: initialData?.departement_id || 0,

        type_credit: initialData?.type_credit || "",
        montant_credit: parseFloat(initialData?.montant_credit) || 0,
        date_credit: initialData?.date_credit || "",
        statut: initialData?.statut_credit || "",

        employe: initialData?.employe || "",
        type_contrat: initialData?.type_contrat || "",
        anciennete: initialData?.anciennete || "",
        fonction: initialData?.fonction || "",
        statut_employe: initialData?.statut_Emp || ""
    });

    const Credits = [
        {id:1,value:"Avance de salaire"},
        {id:2,value:"Prêt personnel"},
        {id:3,value:"Prêt immobilier"},
        {id:4,value:"Crédit voiture"}
    ];

    useEffect(() => {
        console.log("initial ",initialData)
    },[initialData])
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
                setForm(prev => ({
                    ...prev,
                    id_employe:emp.id,
                    departement_id: emp.departement_id,
                    anciennete: emp.anciennete,
                    employe: emp.employe,
                    type_contrat: emp.type_contrat,
                    statut_employe: emp.statut_Emp,
                    fonction: emp.fonction,
                    type_credit: "",
                    montant_credit:"",
                    date_credit:"",
                    statut:""
                }));

                
            }
        } else {
            setForm(prev => ({
                ...prev,
                id_employe:0,
                anciennete: "",
                departement_id:0,
                employe: "",
                type_contrat: "",
                statut_Emp: "",
                poste_Emp: "",
                type_Credit:"",
                montant_demande:"",
                id_Credit:""
            }));
        }
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

    const CreditUpdate = useCallback(async (id_C,Statut_C) => {   
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // 'Authorization': `Bearer ${token}` si API protégée
            }
        };      
        console.log("l'id ",id_C);
        console.log("le statut",Statut_C);   
            try{
                const res = await axios.post(`http://localhost:8000/api/credit/${id_C}?_method=PUT`,{
                    statut: Statut_C
                },config);
                if (res.data.success) {
                console.log("Crédit mis à jour :", res.data.credit);
            } else {
                console.error("Erreur Laravel :", res.data.error);
            }
            } catch(error) {
            if (error.response) {
                console.error("Erreur serveur :", error.response.data);
            } else {
                console.error("Erreur Axios :", error.message);
            }
    }
            
    },[])

    const UniqueEmployees = useMemo(() => {
        const seen = new Set();

        return employees.filter(emp => {
            if (seen.has(emp.id)) return false;
            seen.add(emp.id);
            return true;
        });
    },[employees]);




    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if(initialData){  
            const Data = {statut: form.statut}  
            console.log("Test data  :",form)
            onSave(Data,true)
        }
        else{
            await onSave(form,true)
            console.log("Nouveau data :",form)
            setForm({
                ...form,
                employe:"",
                type_contrat:"",
                anciennete:"",
                fonction:"",
                statut_employe:"",
                type_contrat: "",
                type_credit:"",
                montant_credit: "",
                date_credit: "",
                statut:""
            }) 
        }      
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
                    {initialData ? 'Validation de Crédit' : 'Ajouter de crédit'}
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
                <Form id="creditForm" onSubmit={handleSubmit}>
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
                                        value={form.id_employe}
                                        onChange={handleEmployeeSelect}
                                        name="employe"
                                        className="custom-input"
                                        size="sm"
                                        disabled={!!initialData}
                                    >
                                        <option value="">-- Choisir --</option>
                                        {UniqueEmployees
                                            .map(emp => (
                                                <option key={emp.id_employe} value={emp.id_employe}>
                                                    {emp.employe}
                                                </option>
                                            ))
                                        }
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Type contrat</Form.Label>
                                    <Form.Control
                                        name="type_contrat"
                                        value={form.type_contrat}
                                        className="custom-input"
                                        size="sm"
                                        style={{ backgroundColor: '#f3f4f6' }}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Statut d'employé</Form.Label>
                                    <Form.Control
                                        name="statut_Emp"
                                        value={form.statut_employe}
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
                                        value={form.fonction}
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
                                        Ancienneté
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="anciennete"
                                        value={form.anciennete}
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
                            Détails Crédit
                        </h6>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Type crédit</Form.Label>
                                    <Form.Select
                                        value={form.id_typeCredit}
                                        onChange={(e) => {
                                            const selected = e.target.options[e.target.selectedIndex].text;
                                            setForm({
                                            ...form,
                                            type_credit:selected,
                                            id_typeCredit:parseInt(e.target.value)
                                            })
                                        }}
                                    >
                                        <option value="">-- Choisir Un Crédit --</option>
                                        {Credits.map((credit) => {
                                            return <option key={credit.id} value={credit.id}>{credit.value}</option>
                                        })}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Montant demandé</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="montant_demande"
                                        value={form.montant_credit}
                                        onChange={(e) => {setForm({...form,montant_credit:parseFloat(e.target.value)})}}
                                        className="custom-input"
                                        size="sm"
                                        
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Date de crédit</Form.Label>
                                    <Form.Control 
                                        value={form.date_credit}
                                        type="date"
                                        onChange={(e) => {setForm({...form,date_credit:e.target.value})}}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Statut</Form.Label>
                                    <Form.Select name="statut_Credit" value={form.statut} onChange={(e) => {setForm({...form,statut:e.target.value})}} className="custom-input" size="sm">
                                        <option value="">-- Choisir une statut --</option>
                                        <option value="Validé (R.H)">Validé (R.H)</option>
                                        <option value="Refusé">Refusé</option>
                                        <option value="en_attente">En Attente</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>


                    <div className="form-section mb-4">

                        <Form.Group className="mb-2">
                            {/* Liste des fichiers existants (en mode édition) */}
                            {/*existingFiles.length > 0 && (
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
                            )*/}

                            {/* Liste des nouveaux fichiers sélectionnés */}
                            {/*selectedFiles.length > 0 && (
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
                            )*/}
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
                    type="submit"
                    form="creditForm"
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
                     {initialData ? 'Valider' : 'Ajouter'}
                </button>
            </div>
        </div>
    );
};

export default AddCredit;
