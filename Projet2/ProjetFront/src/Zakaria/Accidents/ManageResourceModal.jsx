import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup, Table } from 'react-bootstrap';
import { Trash2, Edit2, X, Save } from 'lucide-react';
import Swal from 'sweetalert2';

const TEAL = '#2c7a7b';

const ManageResourceModal = ({ show, onHide, title, items, onAdd, onEdit, onDelete }) => {
    const [newItemName, setNewItemName] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [editName, setEditName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async () => {
        if (!newItemName.trim() || isLoading) return;

        const duplicate = items.find(item =>
            item.nom.toLowerCase().trim() === newItemName.toLowerCase().trim()
        );
        if (duplicate) {
            Swal.fire({
                icon: 'warning',
                title: 'Doublon détecté',
                text: `"${newItemName}" existe déjà.`,
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        setIsLoading(true);
        try {
            await onAdd(newItemName);
            setNewItemName("");
            Swal.fire({
                icon: 'success',
                title: 'Ajouté !',
                text: 'L\'élément a été ajouté avec succès.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Une erreur est survenue lors de l\'ajout.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = (item) => {
        setEditingItem(item);
        setEditName(item.nom);
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setEditName("");
    };

    const saveEdit = async () => {
        if (!editName.trim() || !editingItem || isLoading) return;

        const duplicate = items.find(item =>
            String(item.id) !== String(editingItem.id) &&
            item.nom.toLowerCase().trim() === editName.toLowerCase().trim()
        );
        if (duplicate) {
            Swal.fire({
                icon: 'warning',
                title: 'Doublon détecté',
                text: `"${editName}" existe déjà.`,
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        setIsLoading(true);
        try {
            await onEdit(editingItem.id, editName);
            setEditingItem(null);
            setEditName("");
            Swal.fire({
                icon: 'success',
                title: 'Modifié !',
                text: 'L\'élément a été modifié avec succès.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de modifier cet élément.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Êtes-vous sûr?',
            text: "Vous ne pourrez pas revenir en arrière!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer!',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            try {
                await onDelete(id);
                Swal.fire({
                    title: 'Supprimé!',
                    text: 'L\'élément a été supprimé.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: 'Erreur!',
                    text: 'Impossible de supprimer cet élément (peut-être lié à un accident).',
                    icon: 'error'
                });
            }
        }
    };

    /* ── style helpers ── */
    const iconBtn = (color, border) => ({
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        border: `1.5px solid ${border}`,
        background: 'transparent',
        color: color,
        cursor: 'pointer',
        transition: 'background 0.15s',
        padding: 0,
    });

    return (
        <Modal show={show} onHide={onHide} centered size="md">
            {/* ── Header ── */}
            <Modal.Header
                closeButton
                style={{
                    borderBottom: '1px solid #e5e7eb',
                    padding: '16px 20px',
                }}
            >
                <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                    {title}
                </Modal.Title>
            </Modal.Header>

            {/* ── Body ── */}
            <Modal.Body style={{ padding: '20px' }}>

                {/* Add row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <Form.Control
                        placeholder="Nouveau..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        disabled={isLoading || editingItem !== null}
                        style={{
                            flex: 1,
                            borderRadius: '8px',
                            border: '1.5px solid #d1d5db',
                            fontSize: '0.9rem',
                            padding: '8px 12px',
                            outline: 'none',
                            boxShadow: 'none',
                        }}
                    />
                    <button
                        onClick={handleAdd}
                        disabled={isLoading || editingItem !== null || !newItemName.trim()}
                        style={{
                            background: TEAL,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 18px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: (isLoading || editingItem !== null || !newItemName.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (isLoading || editingItem !== null || !newItemName.trim()) ? 0.6 : 1,
                            whiteSpace: 'nowrap',
                            transition: 'opacity 0.15s',
                        }}
                    >
                        Ajouter
                    </button>
                </div>

                {/* Table */}
                <div style={{ maxHeight: '320px', overflowY: 'auto', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#fff' }}>
                                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                                    Nom
                                </th>
                                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#111827', width: '120px' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr
                                    key={item.id}
                                    style={{
                                        background: idx % 2 === 0 ? '#f9fafb' : '#fff',
                                        borderBottom: '1px solid #f3f4f6',
                                        transition: 'background 0.12s',
                                    }}
                                >
                                    {/* Name cell */}
                                    <td style={{ padding: '10px 16px', fontSize: '0.9rem', color: '#374151' }}>
                                        {editingItem && String(editingItem.id) === String(item.id) ? (
                                            <Form.Control
                                                size="sm"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                disabled={isLoading}
                                                style={{ borderRadius: '6px', fontSize: '0.88rem' }}
                                            />
                                        ) : (
                                            item.nom
                                        )}
                                    </td>

                                    {/* Actions cell */}
                                    <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                        {editingItem && String(editingItem.id) === String(item.id) ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                                {/* Save */}
                                                <button
                                                    onClick={saveEdit}
                                                    disabled={isLoading}
                                                    title="Enregistrer"
                                                    style={{ ...iconBtn('#16a34a', '#16a34a') }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Save size={15} />
                                                </button>
                                                {/* Cancel */}
                                                <button
                                                    onClick={cancelEdit}
                                                    disabled={isLoading}
                                                    title="Annuler"
                                                    style={{ ...iconBtn('#6b7280', '#9ca3af') }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                                {/* Edit */}
                                                <button
                                                    onClick={() => startEdit(item)}
                                                    disabled={isLoading || editingItem !== null}
                                                    title="Modifier"
                                                    style={{ ...iconBtn('#3b82f6', '#3b82f6') }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    disabled={isLoading || editingItem !== null}
                                                    title="Supprimer"
                                                    style={{ ...iconBtn('#ef4444', '#ef4444') }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={2} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '0.9rem' }}>
                                        Aucun élément
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal.Body>

            {/* ── Footer ── */}
            <Modal.Footer style={{ borderTop: '1px solid #e5e7eb', padding: '12px 20px' }}>
                <button
                    onClick={onHide}
                    style={{
                        background: TEAL,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 24px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                    }}
                >
                    Fermer
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default ManageResourceModal;
