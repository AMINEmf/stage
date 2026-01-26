import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Calendar, Clock, CalendarDays } from 'lucide-react';
import axios from 'axios';
import { faGear, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const CalendrieForm = ({ onSubmit, onCancel, initialData, selectedGroup, selectedType }) => {
    const [formData, setFormData] = useState({
        debut: initialData?.debut || '',
        fin: initialData?.fin || '',
        groupe_horaire_id: initialData?.groupe_horaire_id || '', 
        groupe_id: Number(selectedGroup?.id) || '',
        jourDebut: initialData?.jourDebut || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [groups, setGroups] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    const formatTime = (time) => {
        return time ? time.replace(/^(\d{1,2}:\d{2}):\d{2}$/, '$1') : '00:00';
    };

    const validateTimeOrder = (time1, time2, fieldName1, fieldName2) => {
        if (!time1 || !time2) return true;
        return new Date(`2000/01/01 ${time1}`) <= new Date(`2000/01/01 ${time2}`);
    };

    const validateForm = () => {
        const errors = {};
        
        // Required field validations
        if (!formData.debut) {
            errors.debut = 'La date de début est requise';
        }
        if (!formData.fin) {
            errors.fin = 'La date de fin est requise';
        }
        if (!formData.groupe_horaire_id) {
            errors.groupe_horaire_id = "L'horaire est requis";
        }

        // Time order validations
        if (formData.debut && formData.fin && new Date(formData.debut) > new Date(formData.fin)) {
            errors.fin = "La date de fin doit être après la date de début";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const fetchGroups = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/groupes-horaires');
            setGroups(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setError('Failed to fetch groups');
            setIsLoading(false);
        }
    };

    const getDayOfWeekInFrench = (dateString) => {
        if (!dateString) return { nom: '', numero: null };
    
        console.log(' getDayOfWeekInFrench appelée avec :', dateString);
    
        const date = new Date(dateString);
        const daysInFrench = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
        const jsDay = date.getDay();
        const numeroFrancais = jsDay === 0 ? 7 : jsDay;
    
        return {
            nom: daysInFrench[jsDay],
            numero: numeroFrancais
        };
    };
    
    //     if (selectedGroup) {
    //         setFormData(prev => ({
    //             ...prev,
    //             groupe_horaire_id: selectedGroup.id
    //         }));
    //     }
    // }, [selectedGroup]);
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/horaires-periodiques');
                console.log("Groupes Horaires Data:", response.data);
                if (Array.isArray(response.data.horairePeriodique)) {
                    setGroups(response.data.horairePeriodique);
                } else {
                    console.error("Invalid data format:", response.data);
                    setError("Format de données invalide");
                }
            } catch (error) {
                console.error('Error fetching groups:', error);
                setError('Échec de récupération des groupes horaires');
            }
        };

        fetchGroups();
    }, []);

    
    const handleChange = (e) => {
        const { name, value } = e.target;
    
        setFormData(prev => {
            const newFormData = {
                ...prev,
                [name]: value
            };
    
            if (name === 'debut' && value && !prev.jourDebut) {
                const { nom, numero } = getDayOfWeekInFrench(value);
                console.log(' Résultat :', nom, numero);

                newFormData.jourDebut = nom;
                newFormData.numeroJourDebut = numero;
            }
    
            if (name === 'reposDe' || name === 'reposA') {
                if (newFormData.reposDe && newFormData.reposA) {
                    newFormData.dureeRepos = calculateTimeDifference(
                        newFormData.reposDe,
                        newFormData.reposA
                    );
                }
            }
    
            return newFormData;
        });
    };
    
    console.log('form', formData)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (!validateForm()) return;

        try {
            setLoading(true);
            setError('');
            await onSubmit({
                ...formData,
                groupe_id: selectedGroup.id,
                groupe_horaire_id: formData.groupe_horaire_id
            });
            // onCancel();

            setFormData({
                debut: '',
                fin: '',
                groupe_id: '',
                groupe_horaire_id: '',
                jourDebut: ''
            });

        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'enregistrement du calendrier");
            console.error("Error details:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <style>
        {`
        .societe-form-container {
            border: none;
            border-radius: 0;
            background-color: transparent;
            box-shadow: none;
            height: 100%;
            width: 100%;
        }

        .societe-form-header {
            padding: 0.99rem 0;
            letter-spacing: 0.5px;
            margin: 0;
            background: #f9fafb;
            border-bottom :1px solid #e9ecef
;
        }

        .societe-form-header h5 {
            display: flex;
            justify-content: center;
            letter-spacing: 0.2px;
            font-size: 1.15rem;
            font-weight: 600;
            color: #4b5563;
            margin: 0;
        }

        .separator {
            height: 1px;
            background-color: #e9ecef;
            margin: 0 -15px 15px -15px;
            width: 100%;
        }

        .societe-form-body {
            padding: 1.5rem;
            background-color: transparent;
            height: calc(100% - 60px);
            overflow-y: auto;
        }

        .form-group-wrapper {
            margin-bottom: 1.25rem;
            position: relative;
        }

        .form-group-wrapper:not(:last-child)::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -0.625rem;
            height: 1px;
            background-color: #f3f4f6;
        }

        .form-label-enhanced {
            font-size: 0.875rem;
            font-weight: 500;
            color: #4b5563;
            margin-bottom: 0.5rem;
        }

        .form-control-enhanced {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 0.875rem;
            color: #111827;
            background-color: #ffffff;
            transition: all 0.2s ease;
        }

        .form-control-enhanced:focus {
            outline: none;
            border-color: #00afaa;
            box-shadow: 0 0 0 2px rgba(0, 175, 170, 0.1);
        }

        .form-control-enhanced::placeholder {
            color: #9ca3af;
            font-size: 0.875rem;
        }

        .form-control-enhanced.is-invalid {
            border-color: #ef4444;
        }

        .icon-accent {
            color: #4b5563;
            margin-bottom: 0.1rem;
            margin-right: 0.5rem;
        }

        .error-message {
            color: #ef4444;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
        }

        .form-actions {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 1rem;
            justify-content: center;
        }

        .btn-primary-custom {
            background-color: #00afaa;
            border: 1px solid #00afaa;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            min-width: 120px;
            transition: all 0.2s ease;
        }

        .btn-primary-custom:hover:not(:disabled) {
            background-color: #009691;
            border-color: #009691;
        }

        .btn-primary-custom:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-secondary-custom {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            color: #4b5563;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            min-width: 120px;
            transition: all 0.2s ease;
        }

        .btn-secondary-custom:hover:not(:disabled) {
            background-color: #009691;
            border-color: #009691;
        }

        .btn-secondary-custom:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .alert-custom {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            margin-top: 1rem;
        }


        `}
        </style>

        <Card className="societe-form-container">
            <div className="societe-form-header">
                <h5>
                <FontAwesomeIcon 
                                            
                 style={{
                fontSize: "16px",
                marginRight: "10px",
                marginTop: "1px"
                                }}
/>

                    {initialData ? 'Modifier le calendrier' : 'Ajouter Calendrier'}

                </h5>
                

            </div>

            <div className="societe-form-body">
                <Form onSubmit={handleSubmit}>
                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Calendar size={16} className="icon-accent" />
                            Date de début
                        </Form.Label>
                        <Form.Control
                            type="date"
                            name="debut"
                            value={formData.debut}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.debut ? 'is-invalid' : ''}`}
                        />
                        {validationErrors.debut && (
                            <span className="error-message">{validationErrors.debut}</span>
                        )}
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Calendar size={16} className="icon-accent" />
                            Date de fin
                        </Form.Label>
                        <Form.Control
                            type="date"
                            name="fin"
                            value={formData.fin}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.fin ? 'is-invalid' : ''}`}
                        />
                        {validationErrors.fin && (
                            <span className="error-message">{validationErrors.fin}</span>
                        )}
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Clock size={16} className="icon-accent" />
                            Horaire
                        </Form.Label>
                        <Form.Select
                            name="groupe_horaire_id"
                            value={formData.groupe_horaire_id || ''}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.groupe_horaire_id ? 'is-invalid' : ''}`}
                        >
                            <option value="">Sélectionnez un horaire</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.nom}
                                </option>
                            ))}
                        </Form.Select>
                        {validationErrors.groupe_horaire_id && (
                            <span className="error-message">{validationErrors.groupe_horaire_id}</span>
                        )}
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <CalendarDays size={16} className="icon-accent" />
                            Jour de début
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="jourDebut"
                            value={`${formData.jourDebut} ${formData.numeroJourDebut || ''}`}

                            className="form-control-enhanced"
                            placeholder="Jour de début"
                            readOnly
                        />
                    </div>

                    {error && (
                        <div className="alert-custom">
                            {error}
                        </div>
                    )}

                    <div className="form-actions">
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="btn-primary-custom"
                        >
                            {loading ? (
                                <>
                                    <Spinner 
                                        animation="border" 
                                        size="sm" 
                                        className="me-2"
                                    />
                                    Chargement...
                                </>
                            ) : initialData ? 'Modifier' : 'Ajouter'}
                        </Button>
                        <Button 
                            type="button"
                            onClick={onCancel} 
                            disabled={loading}
                            className="btn-secondary-custom"
                        >
                            Annuler
                        </Button>
                    </div>
                </Form>
            </div>
        </Card>
        </>
    );
};

export default CalendrieForm;