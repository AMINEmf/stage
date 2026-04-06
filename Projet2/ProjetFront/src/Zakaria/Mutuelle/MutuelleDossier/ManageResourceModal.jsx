import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Table, InputGroup } from 'react-bootstrap';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import {
  showSuccessMessage,
  showErrorMessage,
  showConfirmDialog
} from '../../../utils/messageHelper';

const ManageResourceModal = ({
  show,
  onHide,
  title,
  fetchItems,
  onAdd,
  onEdit,
  onDelete,
  resourceName = "Ressource",
  fields = [], // [{ name: 'label', label: 'Libellé', type: 'text' }]
  initialItems = null,
  cacheKey = null,
  cacheTtlMs = 10 * 60 * 1000,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for single-field mode (backward compatibility)
  const [newItemName, setNewItemName] = useState("");
  const [editingName, setEditingName] = useState("");

  // State for multi-field mode
  const initialFormState = fields.reduce((acc, field) => ({
    ...acc,
    [field.name]: field.type === 'checkbox' ? false : ''
  }), {});
  const [newItemData, setNewItemData] = useState(initialFormState);
  const [editingData, setEditingData] = useState({});

  const [editingId, setEditingId] = useState(null);
  const loadRequestRef = useRef(0);

  const isMultiField = fields && fields.length > 0;

  const readModalCache = () => {
    if (!cacheKey) return null;

    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!Array.isArray(parsed.data) || !parsed.ts) return null;
      if (Date.now() - parsed.ts > cacheTtlMs) return null;

      return parsed.data;
    } catch {
      return null;
    }
  };

  const writeModalCache = (nextItems) => {
    if (!cacheKey) return;

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: nextItems }));
    } catch {
      // Ignore localStorage write errors.
    }
  };

  useEffect(() => {
    if (show) {
      const seedFromProps = Array.isArray(initialItems) ? initialItems : null;
      const seedFromCache = readModalCache();
      const seedItems = seedFromProps ?? seedFromCache ?? [];

      setItems(Array.isArray(seedItems) ? seedItems : []);
      loadItems({ silent: true });

      if (isMultiField) {
        setNewItemData(initialFormState);
      } else {
        setNewItemName("");
      }
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;
    if (!Array.isArray(initialItems)) return;
    setItems(initialItems);
  }, [show, initialItems]);

  const loadItems = async ({ silent = false } = {}) => {
    const requestId = ++loadRequestRef.current;

    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchItems();
      if (requestId !== loadRequestRef.current) return;

      const nextItems = Array.isArray(data) ? data : [];
      setItems(nextItems);
      writeModalCache(nextItems);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      console.error("Erreur chargement:", error);
    } finally {
      if (requestId !== loadRequestRef.current) return;

      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const translateError = (msg) => {
    if (!msg) return "";
    const translations = {
      "The label has already been taken.": "Ce libellé est déjà utilisé.",
      "The label field is required.": "Le libellé est obligatoire.",
      "The selected id is invalid.": "ID invalide.",
      "Impossible to add this item.": "Impossible d'ajouter cet élément.",
      "Impossible to modify this item.": "Impossible de modifier cet élément.",
      "Impossible to delete this item.": "Impossible de supprimer cet élément."
    };

    for (const [eng, fra] of Object.entries(translations)) {
      if (msg.toLowerCase().includes(eng.toLowerCase())) return fra;
    }
    return msg;
  };

  const handleAdd = async () => {
    try {
      if (isMultiField) {
        // Validate
        const emptyFields = fields.filter(f => f.required && !newItemData[f.name]);
        if (emptyFields.length > 0) return;

        await onAdd(newItemData);
        setNewItemData(initialFormState);
      } else {
        if (!newItemName.trim()) return;
        await onAdd(newItemName);
        setNewItemName("");
      }
      loadItems({ silent: true });
      window.dispatchEvent(new CustomEvent('operationTypesUpdated'));
      showSuccessMessage(
        'Ajouté!',
        'L\'élément a été ajouté avec succès.',
        { timer: 1500, showConfirmButton: false }
      );
    } catch (error) {
      console.error("Erreur ajout:", error);
      const errorMsg = error.response?.data?.message ||
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : 'Impossible d\'ajouter cet élément.');

      showErrorMessage(
        'Erreur',
        translateError(errorMsg)
      );
    }
  };

  const handleUpdate = async (id) => {
    try {
      if (isMultiField) {
        await onEdit(id, editingData);
        setEditingId(null);
        setEditingData({});
      } else {
        if (!editingName.trim()) return;
        await onEdit(id, editingName);
        setEditingId(null);
        setEditingName("");
      }
      loadItems({ silent: true });
      window.dispatchEvent(new CustomEvent('operationTypesUpdated'));
      showSuccessMessage(
        'Modifié!',
        'L\'élément a été modifié avec succès.',
        { timer: 1500, showConfirmButton: false }
      );
    } catch (error) {
      console.error("Erreur modification:", error);
      const errorMsg = error.response?.data?.message ||
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : 'Impossible de modifier cet élément.');

      showErrorMessage(
        'Erreur',
        translateError(errorMsg)
      );
    }
  };

  const startEditing = (item) => {
    const id = item.id !== undefined ? item.id : item.value;
    setEditingId(id);
    if (isMultiField) {
      const data = {};
      fields.forEach(f => {
        // Handle boolean false/zero values correctly
        const val = item[f.name] !== undefined ? item[f.name] : (item[f.mapFrom] !== undefined ? item[f.mapFrom] : '');
        data[f.name] = val;
      });
      setEditingData(data);
    } else {
      setEditingName(item.label || item.nom || '');
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await showConfirmDialog(
        'Êtes-vous sûr?',
        "Cette action est irréversible!",
        {
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Oui, supprimer!',
          cancelButtonText: 'Annuler'
        }
      );

      if (result.isConfirmed) {
        await onDelete(id);
        loadItems({ silent: true });
        window.dispatchEvent(new CustomEvent('operationTypesUpdated'));
        showSuccessMessage(
          'Supprimé!',
          'L\'element a été supprimé avec succès.',
          { timer: 1500, showConfirmButton: false }
        );
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      const errorMsg = error.response?.data?.message ||
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : 'Impossible de supprimer cet élément (peut-être utilisé ailleurs).');
      showErrorMessage(
        'Erreur',
        translateError(errorMsg)
      );
    }
  };

  return (
    <>
      <style>{`
        .manage-resource-modal .modal-content {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          border: none;
        }
        .manage-resource-modal .modal-header {
          border-bottom: 1px solid #f1f5f9;
          padding: 1.25rem 1.5rem;
        }
        .manage-resource-modal .modal-title {
          color: #212529;
          font-weight: 600;
          font-size: 1.25rem;
        }
        .manage-resource-modal .form-control {
          border-color: #ced4da;
          font-size: 0.95rem;
          padding: 0.65rem 1rem;
          color: #444;
        }
        .manage-resource-modal .form-control:focus {
          border-color: #2c767c;
          box-shadow: 0 0 0 0.2rem rgba(44, 118, 124, 0.15);
        }
        .manage-resource-modal .form-control-custom-bg {
          background-color: #f1f5f9;
          border-color: #e2e8f0;
        }
        .manage-resource-modal .btn-teal-joined {
          background-color: #7eb1b4;
          border-color: #7eb1b4;
          color: white;
          font-weight: 500;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          transition: all 0.2s;
        }
        .manage-resource-modal .btn-teal-joined:hover {
          background-color: #6da0a3;
          border-color: #6da0a3;
        }
        .manage-resource-modal .btn-teal-joined:disabled {
          background-color: #acc8ca;
          border-color: #acc8ca;
          opacity: 0.8;
        }
        .manage-resource-modal .resource-table-container {
          max-height: 320px;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }
        /* Scrollbar */
        .manage-resource-modal .resource-table-container::-webkit-scrollbar {
          width: 7px;
        }
        .manage-resource-modal .resource-table-container::-webkit-scrollbar-track {
          background: #f8f9fa;
        }
        .manage-resource-modal .resource-table-container::-webkit-scrollbar-thumb {
          background-color: #999;
          border-radius: 10px;
          border: 2px solid #f8f9fa;
        }
        .manage-resource-modal .table thead th {
          background-color: #f8f9fa;
          color: #000;
          font-weight: 700;
          font-size: 1rem;
          border-bottom: 1px solid #dee2e6;
          padding: 0.85rem 1rem;
        }
        .manage-resource-modal .item-text {
          color: #212529;
          font-size: 1rem;
          font-weight: 500;
        }
        .manage-resource-modal .btn-outline-primary {
          border-color: #007bff;
          color: #007bff;
          border-radius: 4px;
          background: white;
        }
        .manage-resource-modal .btn-outline-primary:hover {
          background-color: #007bff;
          color: white;
        }
        .manage-resource-modal .btn-outline-danger {
          border-color: #dc3545;
          color: #dc3545;
          border-radius: 4px;
          background: white;
        }
        .manage-resource-modal .btn-outline-danger:hover {
          background-color: #dc3545;
          color: white;
        }
        .manage-resource-modal .modal-footer {
          border-top: none;
          padding: 1rem 1.5rem 1.5rem;
        }
        .manage-resource-modal .btn-secondary-custom {
          background-color: #8c8c8c;
          border-color: #8c8c8c;
          color: white;
          padding: 0.5rem 1.5rem;
          font-weight: 500;
          border-radius: 6px;
        }
        .manage-resource-modal .btn-secondary-custom:hover {
          background-color: #7a7a7a;
          border-color: #7a7a7a;
          color: white;
        }
        .manage-resource-modal .table-striped tbody tr:nth-of-type(odd) {
          background-color: #f8f9fa;
        }
        .manage-resource-modal .table-striped tbody tr:nth-of-type(even) {
          background-color: #ffffff;
        }
        .manage-resource-modal .table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid #dee2e6;
        }
        /* Masquer la case à cocher parasite dans SweetAlert */
        .swal2-no-checkbox .swal2-checkbox {
          display: none !important;
        }
      `}</style>

      <Modal
        show={show}
        onHide={onHide}
        centered
        className="manage-resource-modal"
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '1.5rem' }}>
          <div className="mb-4">
            {/* Formulaire d'ajout */}
            {isMultiField ? (
              <div className="d-flex gap-2 flex-wrap align-items-end p-3 bg-light rounded-3 mb-3">
                {fields.map((field) => (
                  <Form.Group key={field.name} style={{ flex: field.width || 1, minWidth: '150px' }} className={field.type === 'checkbox' ? 'd-flex align-items-center mb-0' : 'mb-0'}>
                    {field.type === 'checkbox' ? (
                      <Form.Check
                        type="checkbox"
                        label={field.label}
                        id={`new-${field.name}`}
                        className="small fw-medium"
                        checked={!!newItemData?.[field.name]}
                        onChange={(e) => setNewItemData({ ...newItemData, [field.name]: e.target.checked })}
                      />
                    ) : (
                      <>
                        <Form.Label className="small fw-bold text-muted mb-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{field.label}</Form.Label>
                        <Form.Control
                          type={field.type || 'text'}
                          placeholder={field.placeholder || 'Saisir...'}
                          value={newItemData?.[field.name] || ''}
                          onChange={(e) => setNewItemData({ ...newItemData, [field.name]: e.target.value })}
                          className="form-control-custom-bg"
                        />
                      </>
                    )}
                  </Form.Group>
                ))}
                <Button
                  className="btn-teal-joined fw-bold"
                  onClick={handleAdd}
                  disabled={fields.some(f => f.required && !newItemData[f.name]?.toString().trim())}
                  style={{ height: '38px', borderRadius: '6px' }}
                >
                  Ajouter
                </Button>
              </div>
            ) : (
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder={`Nouveau...`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="form-control-custom-bg"
                  style={{ borderRadius: '6px 0 0 6px' }}
                />
                <Button
                  className="btn-teal-joined fw-bold"
                  onClick={handleAdd}
                  disabled={!newItemName.trim()}
                  style={{
                    borderRadius: '0 6px 6px 0',
                    marginLeft: '-1px'
                  }}
                >
                  Ajouter
                </Button>
              </InputGroup>
            )}
          </div>

          <div className="resource-table-container">
            {isRefreshing && items.length > 0 && (
              <div className="text-end px-3 pt-2">
                <small className="text-muted">Mise a jour...</small>
              </div>
            )}

            {loading && items.length === 0 ? (
              <div className="text-center p-4">
                <div className="spinner-border spinner-border-sm text-secondary me-2" role="status"></div>
                <span className="small text-muted">Chargement...</span>
              </div>
            ) : (
              <Table striped bordered={false} hover={false} className="mb-0 table-striped">
                <thead>
                  <tr>
                    {isMultiField ? (
                      fields.map((field) => (
                        <th key={field.name} style={{ textAlign: 'left' }}>{field.label}</th>
                      ))
                    ) : (
                      <th style={{ width: '70%' }}>Nom</th>
                    )}
                    <th className="text-center" style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isMultiField ? fields.length + 1 : 2}
                        className="text-center text-muted p-4"
                      >
                        Aucun élément trouvé
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const isEditing = editingId === (item.id || item.value);
                      return (
                        <tr key={item.id || item.value}>
                          {isMultiField ? (
                            fields.map((field) => (
                              <td key={field.name} className="align-middle px-3">
                                {isEditing ? (
                                  field.type === 'checkbox' ? (
                                    <Form.Check
                                      type="checkbox"
                                      id={`edit-${item.id}-${field.name}`}
                                      checked={!!editingData?.[field.name]}
                                      onChange={(e) => setEditingData({ ...editingData, [field.name]: e.target.checked })}
                                    />
                                  ) : (
                                    <Form.Control
                                      type={field.type || 'text'}
                                      value={editingData?.[field.name] || ''}
                                      onChange={(e) => setEditingData({ ...editingData, [field.name]: e.target.value })}
                                      size="sm"
                                    />
                                  )
                                ) : (
                                  field.type === 'checkbox' ? (
                                    <span className="item-text">{item[field.name] ? 'Oui' : 'Non'}</span>
                                  ) : (
                                    <span className="item-text">
                                      {item[field.name] || item[item.mapFrom] || ''}
                                    </span>
                                  )
                                )}
                              </td>
                            ))
                          ) : (
                            <td className="align-middle px-3">
                              {isEditing ? (
                                <Form.Control
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  size="sm"
                                  autoFocus
                                />
                              ) : (
                                <span className="item-text">
                                  {item.label || item.nom}
                                </span>
                              )}
                            </td>
                          )}

                          <td className="text-center align-middle">
                            {isEditing ? (
                              <div className="d-flex justify-content-center gap-1">
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  className="p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => handleUpdate(item.id || item.value)}
                                >
                                  <Check size={16} strokeWidth={3} />
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => {
                                    setEditingId(null);
                                    if (!isMultiField) setEditingName("");
                                    else setEditingData({});
                                  }}
                                >
                                  <X size={16} strokeWidth={3} />
                                </Button>
                              </div>
                            ) : (
                              <div className="d-flex justify-content-center gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="p-1"
                                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => {
                                    setEditingId(item.id || item.value);
                                    startEditing(item);
                                  }}
                                >
                                  <Edit2 size={15} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="p-1"
                                  style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => handleDelete(item.id || item.value)}
                                >
                                  <Trash2 size={15} />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </Table>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="btn-secondary-custom"
            onClick={onHide}
          >
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ManageResourceModal;
