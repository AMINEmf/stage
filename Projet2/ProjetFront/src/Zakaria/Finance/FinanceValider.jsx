import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
    User, Calendar, Activity, Save,
    FileText, DollarSign, Upload, Briefcase, X, Plus, Eye, Trash2
} from "lucide-react";
import Swal from "sweetalert2";
import {faChartLine, faFile, faMagnifyingGlassDollar, faMoneyBills, faMoneyBillWave} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../Accidents/AddAccident.css"; // Réutilisation du style
import { green } from "@mui/material/colors";

const FinanceValider = ({ onClose, onSave, departementId, initialData, preloadedEmployees = [],mode,name}) => {
    const [employees, setEmployees] = useState(preloadedEmployees);
    const [selectedEmpId, setSelectedEmpId] = useState("");
    const [existingFiles, setExistingFiles] = useState([]);
    const [budget,setBudget] = useState([]);

    // états de remboursement 
    const [remboursement,setRemboursement] = useState([]);
    const [remboursementTypes,setremboursementTypes] = useState({
        en_cours:0,
        valide:0,
        termine:0
    });

    const [MensualiteTotal,setMensualiteTotal] = useState(0);

    useEffect(() => {
        const total = remboursement.filter(rem => rem.statut_remboursement === "En cours")
        .reduce((acc,rem) => acc + parseFloat(rem.reste_paye),0)
        setMensualiteTotal(total);
    },[remboursement])

    useEffect(() => {
        console.log("Mensualite total :",MensualiteTotal)
    },[MensualiteTotal])

    useEffect(() => {
        const count = remboursement.reduce(
            (an,rem) => {
            switch(rem.statut_remboursement){
                case "En cours":
                    an.en_cours +=1;
                    break;
                case "Terminé":
                    an.termine +=1;
                    break;
                case "Validé":
                    an.valide +=1;
                    break;
                default:
                    break;
            }
            return an;
            },
            {en_cours:0,termine:0,valide:0}
        );
        setremboursementTypes(count)
    },[remboursement])

    const [creditEnCours,setCreditEncours] = useState(() => {
        const EnCours = localStorage.getItem("creditEncours");
        return EnCours ? JSON.parse(EnCours) : []
    });

    console.log("les employess",employees)
    console.log("initial data :",initialData)
    const [form, setForm] = useState({ 
        id_credit: initialData?.id || selectedEmpId || 0,
        id_employe: initialData?.id_employe,

        type_credit: initialData?.type_credit || "",
        montant_credit: parseFloat(initialData?.montant_credit) || 0,
        date_credit: initialData?.date_credit || "",
        statut: initialData?.statut_credit,
        duree_demande: initialData?.duree_demande,
        taux_credit: parseInt(initialData?.taux_credit),
        mensualite: "0.00",
        montant_total: "0.00",

        employe: `${initialData?.employe}` || "",
        type_contrat: initialData?.type_contrat || "",
        anciennete: initialData?.anciennete || "",
        poste_Emp: initialData?.fonction || "",
        statut_Emp: initialData?.statut_emp || "",
        salaire: initialData?.salaire || ""
    }); 

    // Table Remboursement
    const Remboursement = {
        id_credit: form.id_credit,
        date_remboursement: form.date_remboursement,
        statut: form.statut,
        taux_interet: parseInt(form.taux_credit),
        nbr_mois: parseInt(form.duree_demande),
        mensualite: parseFloat(form.mensualite),
        montant_total: parseFloat(form.montant_total)
    }

    const Disponible = (budget) ? (parseFloat(budget?.[0]?.montant_disponible) - parseFloat(form.montant_credit)) : "";

    const [isEditable,setIsEditable] = useState({
        montant:false,
        mensualite:false,
        autreCredits:false
    });

    // Spécification de durée 
    const Duree = useCallback(() => {
        if(budget?.[0] && form.salaire && form.montant_credit){
            const tauxEndettement = parseFloat(budget[0].taux_endettement) || 0;
            const salaire = parseFloat(form.salaire) || 0;
            const montant = parseFloat(form.montant_credit) || 0;

            const mensualiteMax = (salaire * (tauxEndettement/100));
            const Duree = (mensualiteMax > 0) ? Math.ceil(montant / mensualiteMax) : 0;
            setForm({...form,duree_demande:Duree})
            return Duree;
        }
        return 0;
    },[budget,form.salaire,form.montant_credit])

    // Calcule de mensualite
    const Mensualite = useCallback(() => {
        if((form.taux_credit !== undefined && form.taux_credit !== null) && form.montant_credit && form.duree_demande){
            const Taux = parseFloat(form.taux_credit) || 0; //Taux annuel
            const montant = parseFloat(form.montant_credit) || 0;
            const Duree = parseInt(form.duree_demande) || 0;
            if(Taux > 0 && Duree > 0){
                const r = (Taux / 12 / 100) //Taux mensuel
                const facteur = Math.pow(1 + r,Duree);
                const MensualiteCalc = montant * ((r*facteur) / (facteur -1));
                return MensualiteCalc.toFixed(2);
            }
            if(Taux === 0){
                const MensualiteCalc = montant / Duree;
                return MensualiteCalc.toFixed(2)
            }
            return "0.00";
        }
    },[form.taux_credit,form.montant_credit,form.duree_demande])

    useEffect(() => {
        const nouvelleMensualite = Mensualite();

        if(nouvelleMensualite !== form.mensualite){
            setForm(prev => ({...prev,mensualite:nouvelleMensualite}))
        }
    },[Mensualite,form.mensualite]);
    
    // Calcule de montant Total
    const MontantTotal = useCallback(() => {
        const mensualite = parseFloat(form.mensualite) || 0;
        const duree = parseInt(form.duree_demande) || 0;
        if(mensualite > 0 && duree > 0){
            return (mensualite * duree).toFixed(2);
        }
        return "0.00"
    },[form.mensualite,form.duree_demande])
    
    useEffect(() => {
        const montantT = MontantTotal();
        if(montantT !== form.montant_total){
            setForm({...form,montant_total:montantT})
        }
    },[MontantTotal,form.montant_total])
    
    // Charger le budget de crédit autorisé 
    useEffect(() => {
        axios.get("http://localhost:8000/api/budget")
        .then(res => setBudget(res.data))
    }, []);

    // Chargement de remboursement d'employé
    useEffect(() => {
        axios.get(`http://localhost:8000/api/remboursement/${form.id_employe}`)
        .then(res => {
            setRemboursement(res.data);
            localStorage.setItem("Remboursement",JSON.stringify(res.data))
        })
    },[form.id_employe])

    const handleEmployeeSelect = (e) => {
        const empId = e.target.value;
        setSelectedEmpId(empId);

        if (empId) {
            const emp = employees.find(ep => String(ep.id) === String(empId));
            if (emp) {
                setForm(prev => ({
                    ...prev,
                    id_employe:emp.id,
                    anciennete: emp.anciennete,
                    employe: `${emp.prenom} ${emp.nom}`,
                    type_contrat: emp.contrats[0].type_contrat,
                    statut_Emp: emp.active == 1 ? 'actif' : 'Suspendu',
                    poste_Emp: emp.fonction || "",
                    type_credit: "",
                    montant_credit:"",
                    date_credit:"",
                    taux_credit: parseFloat(emp.taux_credit),
                    statut:""
                }));

                
            }
        } else {
            setForm(prev => ({
                ...prev,
                id_employe:0,
                anciennete: "",
                employe: "",
                type_contrat: "",
                statut_Emp: "",
                poste_Emp: "",
                type_Credit:"",
                montant_demande:"",
                taux_credit:"",
                id_Credit:""
            }));
        }
    };

    {/*useEffect(() => {
        console.log("l'id employe :",selectedEmpId)
        axios.get("http://127.0.0.1:8000/api/credit")
        .then(res => {
            if(res.data && Array.isArray(res.data)){
                const encours = res.data.flatMap(emp => {
                    if(emp.id === selectedEmpId){
                        return emp.credits
                        .filter(credit => credit.statut && credit.statut === "en cours")
                        .map(credit => ({
                            id: credit.id_credit,
                            departement_id: emp.departement_id,

                            //Les données personnels de l'employe
                            employe: `${emp.nom} ${emp.prenom}`,
                            anciennete: emp.anciennete,
                            type_contrat: emp.contrats?.[0]?.type_contrat,
                            statut_emp: Number(emp.active) ? "Actif" : "Suspendu",
                            fonction: emp.fonction,
                            salaire: emp.salaire_base,

                            //Les données de demande de crédit
                            type_credit: credit.type_credit,
                            date_credit: credit.date_credit,
                            montant_credit: credit.montant_credit,
                            duree_demande: credit.nbr_mois ? `${credit.nbr_mois} Mois` : "-",
                            statut_credit: credit.statut
                        }));
                    }

                    return [];
                });
                setCreditEncours(encours);
                localStorage.setItem("creditEncours",JSON.stringify(encours))
            }
        })
    },[selectedEmpId]) */}


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

    useEffect(() => {
        if(form.statut === "Validé (Finance)"){
            const today = new Date();
            today.setMonth(today.getMonth() + 1);
            const nextDate = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-05";
            setForm({...form,date_remboursement:nextDate});
                 
        }
    },[form.statut])

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if(initialData){  
            const mtn = budget?.[0]?.montant_disponible - form.montant_credit
            console.log("THE FORM IS :",Remboursement)
            console.log("montant disponible de credit :",mtn)

            
            axios.post("http://127.0.0.1:8000/api/budget-rembourser",{montant:form.montant_credit})

            await onSave(Remboursement,true)
        }

          
    };

    return mode ? (
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
                                        value={form.id_credit}
                                        onChange={handleEmployeeSelect}
                                        name="id_employe"
                                        className="custom-input"
                                        size="sm"
                                        disabled={!!initialData}
                                    >
                                        <option value=""></option>
                                        {employees
                                            .filter(emp => initialData && initialData.id_employe === emp.id_employe)
                                            .map(emp => (
                                                <option key={emp.id} value={emp.id}>
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
                                        value={form.statut_Emp}
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
                                        value={form.poste_Emp}
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
                                        value={form.anciennete ? `${form.anciennete} Mois` : ""}
                                        className="custom-input"
                                        size="sm"
                                        readOnly
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="g-2">
                            <Col md={12}>
                                <Form.Label className="small fw-bold">
                                    <DollarSign size={16} className="me-2" />
                                    Salaire d'Employé
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={form.salaire ? `${form.salaire} DH` : ""}
                                    className="custom-input"
                                    size="sm"
                                    style={{ backgroundColor: '#f3f4f6' }}
                                    readOnly
                                />
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
                                    <Form.Control
                                        type="text"
                                        value={form.type_credit}
                                        className="custom-input"
                                        style={{ backgroundColor: '#f3f4f6' }}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Montant demandé (MAD)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="montant_demande"
                                        value={form.montant_credit}
                                        style={{ backgroundColor: '#f3f4f6' }}
                                        className="custom-input"
                                        size="sm"
                                        disabled={!isEditable.montant}
                                        onChange={(e) => setForm({...form,montant_credit:e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={1} className="d-flex align-items-center">
                                <Form.Check 
                                    type="checkbox"
                                    name="montant"
                                    style={{ width: "0.7rem", height: "0.7rem",margin:0 }}
                                    checked={isEditable.montant}
                                    onChange={(e) => setIsEditable({...isEditable,montant:e.target.value})}
                                />
                            </Col>
                        </Row>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Durée Demandée (Mois)</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        value={form.duree_demande || Duree()}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setForm({
                                                ...form,
                                                duree_demande: val
                                            })
                                        }}
                                        readOnly
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                </Form.Group>
                            </Col>
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
                        </Row>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-4">
                            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b' }}>
                                <div className="d-flex align-items-center mb-2">
                                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#ecfdf5', marginRight: '12px' }}>
                                        <FontAwesomeIcon icon={faMoneyBills} style={{ fontSize: '1.2rem', color: '#ff853a' }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Budget Crédit</div>
                                </div>
                                <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{`${budget?.[0]?.budget_creditInterne} DH`}</div>
                            </div>
                        </div>
                        <div className="col-4">
                            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b' }}>
                                <div className="d-flex align-items-center mb-2">
                                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#ecfdf5', marginRight: '12px' }}>
                                        <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '1.2rem', color: '#10b981' }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Montant disponible</div>
                                </div>
                                <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{`${budget?.[0]?.montant_disponible} DH`}</div>
                            </div>
                        </div>
                        <div className="col-4">
                            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b' }}>
                                <div className="d-flex align-items-center mb-2">
                                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#ecfdf5', marginRight: '12px' }}>
                                        <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '1.2rem', color: '#2f8dff' }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Taux d'endettement</div>
                                </div>
                                <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{`${parseInt(budget?.[0]?.taux_endettement)}%`}</div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section mb-4">
                        <h6 className="section-title-custom mb-2">
                            <FontAwesomeIcon icon={faMagnifyingGlassDollar} size={16} className="me-2" />
                            Analyse financière
                        </h6>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Taux de crédit</Form.Label>
                                    <Form.Control 
                                        value={`${form.taux_credit} %`}
                                        type="text"
                                        style={{ backgroundColor: '#f3f4f6' }}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Mensualité</Form.Label>
                                    <Form.Control 
                                        value={form.mensualite || 0}
                                        type="text"
                                        style={{ backgroundColor: '#f3f4f6' }}
                                        onChange={(e) => setForm({...form,mensualite:e.target.value})}
                                        disabled={!isEditable.mensualite}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Taux d'endettement (Employé)</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        value={MensualiteTotal ? `${(((MensualiteTotal) / (form.salaire))*100).toFixed(0)} %` : '0 %'}
                                        style={{ backgroundColor: '#f3f4f6' }}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Montant Total</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        value={form.montant_total}
                                        style={{ backgroundColor: '#f3f4f6' }}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Statut</Form.Label>
                                    <Form.Select
                                        onChange={(e) => setForm({...form,statut:e.target.value})}
                                    >
                                        <option value="">-- Choisir --</option>
                                        <option value="Validé (Finance)">Validé (Finance)</option>
                                        <option value="Refusé">Refusé</option>
                                    </Form.Select>
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
                     Valider
                </button>
            </div>
        </div>
    ) : (
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
                    Remboursements Crédits
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
            <div className="row g-3 mb-4 mt-2">
                <div className="col-4 ">
                    <div style={{ backgroundColor: '#b4d3ff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b' }}>
                        <div className="d-flex align-items-center mb-2">
                            <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#ecfdf5', marginRight: '12px' }}>
                                <FontAwesomeIcon icon={faFile} style={{ fontSize: '1.2rem', color: '#2f00ff' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#000000' }}>remboursement en cours</div>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '1.5rem' }}>{remboursementTypes.en_cours}</div>
                    </div>
                </div>
                <div className="col-4">
                    <div style={{ backgroundColor: '#c2ffc5', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b'}}>
                        <div className="d-flex align-items-center mb-2">
                            <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#ecfdf5', marginRight: '12px' }}>
                                <FontAwesomeIcon icon={faFile} style={{ fontSize: '1.2rem', color: '#09ff00' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#000000' }}>remboursement validé</div>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '1.5rem' }}>{remboursementTypes.valide}</div>
                    </div>
                </div>
                <div className="col-4">
                    <div style={{ backgroundColor: '#ffe1a9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b'}}>
                        <div className="d-flex align-items-center mb-2">
                            <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#ecfdf5', marginRight: '12px' }}>
                                <FontAwesomeIcon icon={faFile} style={{ fontSize: '1.2rem', color: '#ff7300' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#000000' }}>remboursement terminé</div>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '1.5rem' }}>{remboursementTypes.termine}</div>
                    </div>
                </div>
            </div>

            <div className="ms-3">
                <h5 style={{fontWeight:600, fontSize:'1.15rem',letterSpacing:'0.5px'}}>Détails de remboursements</h5>
            </div>

            <div className="p-2 bg-warning-subtle rounded-2 mt-2 ms-3 me-3 overflow-hidden">
                <table className="table table-hover mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>date remboursement</th>
                            <th>montant paye</th>
                            <th>reste paye</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {remboursement.map(remb => {
                            return <tr key={remb.id_remboursement}>
                                <td>{remb.date_remboursement}</td>
                                <td>{remb.montant_paye}</td>
                                <td>{remb.reste_paye}</td>
                                <td>{remb.statut_remboursement}</td>
                            </tr>
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
};

export default FinanceValider;
