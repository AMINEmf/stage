import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Building, CreditCard, Hash, FileText, MapPin, Users } from 'lucide-react';

const SocieteForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
        RaisonSocial: initialData?.RaisonSocial || '',
        ICE: initialData?.ICE || '',
        NumeroCNSS: initialData?.NumeroCNSS || '',
        NumeroFiscale: initialData?.NumeroFiscale || '',
        RegistreCommercial: initialData?.RegistreCommercial || '',
        AdresseSociete: initialData?.AdresseSociete || '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear validation error when field is modified
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.RaisonSocial.trim()) {
            errors.RaisonSocial = 'La raison sociale est requise';
        }
        if (!formData.ICE.trim()) {
            errors.ICE = "L'ICE est requis";
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!validateForm()) return;
        try {
            setLoading(true);
            await onSubmit(formData);
        } catch (err) {
            console.error("Erreur lors de l'envoi des données:", err.response?.data);
            setError(err.response?.data?.message || "Une erreur est survenue");
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
            border-bottom :1px solid #e9ecef;
        }


        .societe-form-header h5 {
            display: flex;
            justify-content: center;
            letter-spacing: 0.2px;
            font-size: 1.15rem;
            font-weight: 600;
            color: #4b5563;
            margin: 0;
            padding: 0;
        }

        .societe-form-header .separator {
            height: 1px;
            background-color: #e9ecef;
            margin: 1rem 0 0 0;
            width: 100%;
        }

        .societe-form-body {
            padding: 1.5rem;
            background-color: transparent;
            height: calc(100% - 80px);
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
            margin-right: 0.5rem ;
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
            background-color: #2c767c;
            border: none;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            min-width: 120px;
            transition: all 0.2s ease;
        }

        .btn-secondary-custom:hover:not(:disabled) {
            background-color: #245f64;
            border-color: #245f64;
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

        <Card className="societe-form-container" style={{ height: '100%', width: '100%' }}>
            <div className="societe-form-header">
               <h5>
               {initialData ? 'Modifier Société' : 'Ajouter Société'}
               </h5>
            </div>
            
            <div className="societe-form-body">
                <Form onSubmit={handleSubmit}>
                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Building size={16} className="icon-accent" />
                            Raison Sociale
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="RaisonSocial"
                            value={formData.RaisonSocial}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.RaisonSocial ? 'is-invalid' : ''}`}
                            placeholder="Entrez la raison sociale"
                        />
                        {validationErrors.RaisonSocial && (
                            <span className="error-message">{validationErrors.RaisonSocial}</span>
                        )}
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <CreditCard size={16} className="icon-accent" />
                            ICE
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="ICE"
                            value={formData.ICE}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.ICE ? 'is-invalid' : ''}`}
                            placeholder="Entrez l'ICE"
                        />
                        {validationErrors.ICE && (
                            <span className="error-message">{validationErrors.ICE}</span>
                        )}
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Hash size={16} className="icon-accent" />
                            Numéro CNSS
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="NumeroCNSS"
                            value={formData.NumeroCNSS}
                            onChange={handleChange}
                            className="form-control-enhanced"
                            placeholder="Entrez le numéro CNSS"
                        />
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <FileText size={16} className="icon-accent" />
                            Numéro Fiscale
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="NumeroFiscale"
                            value={formData.NumeroFiscale}
                            onChange={handleChange}
                            className="form-control-enhanced"
                            placeholder="Entrez le numéro fiscale"
                        />
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <FileText size={16} className="icon-accent" />
                            Registre Commercial
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="RegistreCommercial"
                            value={formData.RegistreCommercial}
                            onChange={handleChange}
                            className="form-control-enhanced"
                            placeholder="Entrez le registre commercial"
                        />
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <MapPin size={16} className="icon-accent" />
                            Adresse
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="AdresseSociete"
                            value={formData.AdresseSociete}
                            onChange={handleChange}
                            className="form-control-enhanced"
                            placeholder="Entrez l'adresse"
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

export default SocieteForm;