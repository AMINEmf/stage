import React, { useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { Form, Button, Modal } from 'react-bootstrap';
import {
  showSuccessMessage,
  showErrorMessage,
  showErrorFromResponse,
  showConfirmDialog,
  showInfoMessage,
  STANDARD_MESSAGES
} from '../../../utils/messageHelper';
import "../AffiliationMutuelle/AddAffiliationMutuelle.css";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    withCredentials: true,
});

function AddMutuelleDocument({ operations, onClose, onSaved }) {
    const [selectedOperation, setSelectedOperation] = useState(null);
    const [file, setFile] = useState(null);
    const [nom, setNom] = useState('');
    const [loading, setLoading] = useState(false);

    const operationOptions = operations.map(op => ({
        value: op.id,
        label: `${op.date_operation} - ${op.type_operation} (${op.montant_total} DH)`
    }));

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedOperation || !file) {
            showInfoMessage(
                'Attention',
                'Veuillez sélectionner une opération et un fichier.'
            );
            return;
        }

        const formData = new FormData();
        formData.append('operation_id', selectedOperation.value);
        formData.append('fichier', file);
        if (nom) formData.append('nom', nom);

        setLoading(true);
        try {
            await api.post('/mutuelles/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showSuccessMessage(
                'Succès',
                'Document ajouté avec succès',
                { timer: 2000, showConfirmButton: false }
            );
            onSaved();
        } catch (error) {
            console.error('Erreur upload:', error);
            showErrorMessage(
                'Erreur',
                "Impossible d'ajouter le document."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-affiliation-overlay">
            <div
                className="add-affiliation-panel"
                style={{ maxWidth: '500px', width: '100%', height: '90vh', display: 'flex', flexDirection: 'column' }}
            >
                <div className="panel-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div className="panel-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h5 className="mb-0" style={{ color: '#3a8a90', fontWeight: 600 }}>Ajouter un document</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
                    </div>
                    <div className="panel-body" style={{ padding: '24px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Opération concernée *</Form.Label>
                                <Select
                                    options={operationOptions}
                                    value={selectedOperation}
                                    onChange={setSelectedOperation}
                                    placeholder="Sélectionner..."
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Nom du document (Optionnel)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={nom}
                                    onChange={(e) => setNom(e.target.value)}
                                    placeholder="Ex: Facture, Ordonnance..."
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Fichier *</Form.Label>
                                <Form.Control
                                    type="file"
                                    onChange={handleFileChange}
                                />
                            </Form.Group>

                            <div className="d-flex justify-content-center gap-3 pt-3">
                                <Button
                                    variant="primary"
                                    onClick={onClose}
                                    disabled={loading}
                                    style={{ backgroundColor: '#3a8a90', borderColor: '#3a8a90', padding: '8px 24px', fontWeight: 600 }}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={loading}
                                    style={{ backgroundColor: '#3a8a90', borderColor: '#3a8a90', padding: '8px 24px', fontWeight: 600 }}
                                >
                                    {loading ? 'Envoi...' : 'Enregistrer'}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddMutuelleDocument;
