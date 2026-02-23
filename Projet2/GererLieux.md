# Gérer les Lieux — Code complet

## 1. Frontend : ManageResourceModal.jsx
> `ProjetFront/src/Zakaria/Accidents/ManageResourceModal.jsx`

```jsx
import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup, Table } from 'react-bootstrap';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import Swal from 'sweetalert2';

const ManageResourceModal = ({ show, onHide, title, items, onAdd, onEdit, onDelete }) => {
    const [newItemName, setNewItemName] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [editName, setEditName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ── Ajout ──────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        if (!newItemName.trim() || isLoading) return;

        // Vérifier les doublons (insensible à la casse)
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
                text: "L'élément a été ajouté avec succès.",
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: "Une erreur est survenue lors de l'ajout."
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ── Modification ───────────────────────────────────────────────────────
    const startEdit  = (item) => { setEditingItem(item); setEditName(item.nom); };
    const cancelEdit = ()     => { setEditingItem(null); setEditName(""); };

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
                text: "L'élément a été modifié avec succès.",
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de modifier cet élément.' });
        } finally {
            setIsLoading(false);
        }
    };

    // ── Suppression ────────────────────────────────────────────────────────
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
                    text: "L'élément a été supprimé.",
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                Swal.fire({
                    title: 'Erreur!',
                    text: 'Impossible de supprimer cet élément (peut-être lié à un accident).',
                    icon: 'error'
                });
            }
        }
    };

    // ── Rendu ──────────────────────────────────────────────────────────────
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Champ ajout */}
                <InputGroup className="mb-3">
                    <Form.Control
                        placeholder="Nouveau..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        disabled={isLoading || editingItem !== null}
                    />
                    <Button variant="primary" onClick={handleAdd} disabled={isLoading || editingItem !== null}>
                        <Plus size={18} />
                    </Button>
                </InputGroup>

                {/* Tableau des éléments */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table striped bordered hover size="sm">
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                            <tr>
                                <th style={{ width: '70%' }}>Nom</th>
                                <th style={{ width: '30%', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        {editingItem && String(editingItem.id) === String(item.id) ? (
                                            <Form.Control
                                                size="sm"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                disabled={isLoading}
                                            />
                                        ) : (
                                            item.nom
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {editingItem && String(editingItem.id) === String(item.id) ? (
                                            <div className="d-flex justify-content-center gap-1">
                                                <Button variant="success" size="sm" onClick={saveEdit} disabled={isLoading}>
                                                    <Save size={14} />
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={cancelEdit} disabled={isLoading}>
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="d-flex justify-content-center gap-1">
                                                <Button variant="outline-primary" size="sm" onClick={() => startEdit(item)} disabled={isLoading || editingItem !== null}>
                                                    <Edit2 size={14} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)} disabled={isLoading || editingItem !== null}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="text-center text-muted">Aucun élément</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Fermer</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ManageResourceModal;
```

---

## 2. Frontend : handlers dans AddAccident.jsx
> `ProjetFront/src/Zakaria/Accidents/AddAccident.jsx`

```jsx
// ── État ──────────────────────────────────────────────────────────────────
const [lieux, setLieux]                     = useState([]);
const [manageLieuModal, setManageLieuModal] = useState(false);

// ── Chargement depuis l'API (avec cache localStorage) ────────────────────
const fetchLieux = () => {
    const cached = localStorage.getItem('accidentLieuxCache');
    if (cached) {
        try {
            const data = JSON.parse(cached);
            if (Array.isArray(data) && data.length > 0) setLieux(data);
        } catch (e) { /* ignore */ }
    }
    axios.get("http://127.0.0.1:8000/api/accident-lieux", { withCredentials: true })
        .then(res => {
            const data = Array.isArray(res.data) ? res.data : [];
            setLieux(data);
            localStorage.setItem('accidentLieuxCache', JSON.stringify(data));
        })
        .catch(err => console.error("Error fetching lieux", err));
};

// ── Ajout ─────────────────────────────────────────────────────────────────
const handleAddLieu = async (nom) => {
    const res = await axios.post("http://127.0.0.1:8000/api/accident-lieux", { nom }, { withCredentials: true });
    const newLieux = [...lieux, res.data];
    setLieux(newLieux);
    setForm(prev => ({ ...prev, accident_lieu_id: res.data.id })); // sélectionne auto
    localStorage.setItem('accidentLieuxCache', JSON.stringify(newLieux));
    onResourceUpdate?.('lieux', newLieux);
};

// ── Modification ──────────────────────────────────────────────────────────
const handleEditLieu = async (id, nom) => {
    const res = await axios.put(`http://127.0.0.1:8000/api/accident-lieux/${id}`, { nom }, { withCredentials: true });
    const newLieux = lieux.map(item => String(item.id) === String(id) ? res.data : item);
    setLieux(newLieux);
    localStorage.setItem('accidentLieuxCache', JSON.stringify(newLieux));
    onResourceUpdate?.('lieux', newLieux);
};

// ── Suppression ───────────────────────────────────────────────────────────
const handleDeleteLieu = async (id) => {
    await axios.delete(`http://127.0.0.1:8000/api/accident-lieux/${id}`, { withCredentials: true });
    const newLieux = lieux.filter(item => String(item.id) !== String(id));
    setLieux(newLieux);
    localStorage.setItem('accidentLieuxCache', JSON.stringify(newLieux));
    onResourceUpdate?.('lieux', newLieux);
    if (String(form.accident_lieu_id) === String(id))
        setForm(prev => ({ ...prev, accident_lieu_id: "" }));
};

// ── Dans le JSX — bouton d'ouverture du modal ─────────────────────────────
<InputGroup size="sm">
    <Form.Select
        name="accident_lieu_id"
        value={form.accident_lieu_id}
        onChange={handleChange}
    >
        <option value="">-- Choisir un lieu --</option>
        {lieux.map(l => (
            <option key={l.id} value={l.id}>{l.nom}</option>
        ))}
    </Form.Select>
    <Button
        variant="outline-secondary"
        onClick={() => setManageLieuModal(true)}
        title="Gérer les lieux"
    >
        <Plus size={18} color="#2c767c" />
    </Button>
</InputGroup>

// ── Modal ─────────────────────────────────────────────────────────────────
<ManageResourceModal
    show={manageLieuModal}
    onHide={() => setManageLieuModal(false)}
    title="Gérer les Lieux"
    items={lieux}
    onAdd={handleAddLieu}
    onEdit={handleEditLieu}
    onDelete={handleDeleteLieu}
/>
```

---

## 3. Backend : AccidentLieuController.php
> `GestionBE/app/Http/Controllers/AccidentLieuController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\AccidentLieu;
use Illuminate\Http\Request;

class AccidentLieuController extends Controller
{
    // GET /api/accident-lieux
    public function index()
    {
        return AccidentLieu::orderBy('nom')->get();
    }

    // POST /api/accident-lieux
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:accident_lieux,nom|max:255',
        ]);

        return response()->json(AccidentLieu::create($validated), 201);
    }

    // PUT /api/accident-lieux/{id}
    public function update(Request $request, $id)
    {
        $lieu = AccidentLieu::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'required|string|unique:accident_lieux,nom,' . $id . '|max:255',
        ]);

        $lieu->update($validated);
        return response()->json($lieu);
    }

    // DELETE /api/accident-lieux/{id}
    public function destroy($id)
    {
        AccidentLieu::findOrFail($id)->delete();
        return response()->noContent();
    }
}
```

---

## 4. Modèle Eloquent : AccidentLieu.php
> `GestionBE/app/Models/AccidentLieu.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccidentLieu extends Model
{
    use HasFactory;

    protected $table    = 'accident_lieux';
    protected $fillable = ['nom'];
}
```

---

## 5. Routes API
> `GestionBE/routes/api.php`

```php
Route::get('accident-lieux',        [AccidentLieuController::class, 'index']);
Route::post('accident-lieux',       [AccidentLieuController::class, 'store']);
Route::put('accident-lieux/{id}',   [AccidentLieuController::class, 'update']);
Route::delete('accident-lieux/{id}',[AccidentLieuController::class, 'destroy']);
```

---

## Flux résumé

```
Utilisateur tape nom + clique [+]
  → handleAdd() vérifie doublon (client)
  → POST /api/accident-lieux  { nom }
      → validate unique en base (serveur)
      → AccidentLieu::create()
      → retourne 201 + objet JSON
  → state lieux mis à jour
  → localStorage mis à jour
  → lieu auto-sélectionné dans le formulaire
  → SweetAlert "Ajouté !"
```
