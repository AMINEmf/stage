import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { User, Mail, Shield, Camera, Lock, Key } from 'lucide-react';

const UsersForm = ({ onSubmit, onCancel, initialData, onOpenPermissionsModal }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        role: initialData?.role || initialData?.roles?.[0]?.name || '',
        photo: initialData?.photo || '',
        password: initialData?.password || '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
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
        if (!formData.name.trim()) {
            errors.name = 'Le nom est requis';
        }
        if (!formData.email.trim()) {
            errors.email = "L'email est requis";
        }
        if (!formData.role.trim()) {
            errors.role = 'Le rôle est requis';
        }
        if (!initialData && !formData.password.trim()) {
            errors.password = 'Le mot de passe est requis';
        }
        if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 8) {
            errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
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
        .users-form-container {
            border: none;
            border-radius: 0;
            background-color: transparent;
            box-shadow: none;
            height: 100%;
            width: 100%;
        }

        .users-form-header {
            padding: 0.99rem 0;
            letter-spacing: 0.5px;
            margin: 0;
            background: #f9fafb;
            border-bottom :1px solid #e9ecef;
        }


        .users-form-header h5 {
            letter-spacing: 0.2px;
            font-size: 1.15rem;
            font-weight: 600;
            color: #4b5563;
            margin: 0;
            padding: 0;
        }

        .users-form-header-inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 1rem;
        }

        .users-form-header-inner h5 {
            flex: 1;
            align-items: center;
        }

        .permissions-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            border: none;
            background: transparent;
            color: #4b5563;
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: 4px;
        }

        .permissions-btn:hover {
            background-color: #f3f4f6;
            color: #00afaa;
        }

        .users-form-header .separator {
            height: 1px;
            background-color: #e9ecef;
            margin: 1rem 0 0 0;
            width: 100%;
        }

        .users-form-body {
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
            background-color: #e5e7eb;
            border-color: #9ca3af;
            color: #374151;
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

        .file-input-wrapper {
            position: relative;
            width: 100%;
        }

        .file-input-label {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background-color: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            color: #4b5563;
        }

        .file-input-label:hover {
            border-color: #00afaa;
            background-color: #f9fafb;
        }

        .file-name {
            margin-left: 0.5rem;
            color: #6b7280;
            font-size: 0.875rem;
        }
        `}
        </style>

        <Card className="users-form-container" style={{ height: '100%', width: '100%' }}>
            <div className="users-form-header">
               <div className="users-form-header-inner">
                 <h5>
                   {initialData ? 'Modifier Utilisateur' : 'Ajouter Utilisateur'}
                 </h5>
                 {onOpenPermissionsModal && (
                   <button
                     onClick={onOpenPermissionsModal}
                     className="permissions-btn"
                     title="Gérer les permissions"
                   >
                     <Key size={20} />
                   </button>
                 )}
               </div>
            </div>
            
            <div className="users-form-body">
                <Form onSubmit={handleSubmit}>
                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <User size={16} className="icon-accent" />
                            Nom
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.name ? 'is-invalid' : ''}`}
                            placeholder="Entrez le nom"
                        />
                        {validationErrors.name && (
                            <span className="error-message">{validationErrors.name}</span>
                        )}
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Mail size={16} className="icon-accent" />
                            Email
                        </Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.email ? 'is-invalid' : ''}`}
                            placeholder="Entrez l'email"
                        />
                        {validationErrors.email && (
                            <span className="error-message">{validationErrors.email}</span>
                        )}
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Shield size={16} className="icon-accent" />
                            Rôle
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.role ? 'is-invalid' : ''}`}
                            placeholder="Entrez le rôle"
                        />
                        {validationErrors.role && (
                            <span className="error-message">{validationErrors.role}</span>
                        )}
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Camera size={16} className="icon-accent" />
                            Photo
                        </Form.Label>
                        <div className="file-input-wrapper">
                            <Form.Control
                                type="file"
                                name="photo"
                                onChange={handleChange}
                                accept="image/*"
                                className="form-control-enhanced"
                            />
                        </div>
                    </div>

                    <div className="form-group-wrapper">
                        <Form.Label className="form-label-enhanced">
                            <Lock size={16} className="icon-accent" />
                            {initialData ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                        </Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`form-control-enhanced ${validationErrors.password ? 'is-invalid' : ''}`}
                            minLength={8}
                            placeholder={initialData ? "Entrez le nouveau mot de passe" : "Entrez le mot de passe"}
                        />
                        {validationErrors.password && (
                            <span className="error-message">{validationErrors.password}</span>
                        )}
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

export default UsersForm;

