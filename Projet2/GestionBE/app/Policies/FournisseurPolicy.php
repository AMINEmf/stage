<?php

namespace App\Policies;

use App\Models\User;

class FournisseurPolicy
{
    public function viewAllFournisseurs(User $user)
    {
        return $user->hasPermission('view_all_fournisseurs');
    }

    public function createFournisseur(User $user)
    {
        return $user->hasPermission('create_fournisseurs');
    }

    public function viewFournisseur(User $user)
    {
        return $user->hasPermission('view_fournisseurs');
    }

    public function editFournisseur(User $user)
    {
        return $user->hasPermission('update_fournisseurs');
    }

    public function deleteFournisseur(User $user)
    {
        return $user->hasPermission('delete_fournisseurs');
    }
}