<?php

namespace App\Policies;

use App\Models\User;

class LivreurPolicy
{
    public function viewAllLivreurs(User $user)
    {
        return $user->hasPermission('view_all_livreurs');
    }

    public function createLivreur(User $user)
    {
        return $user->hasPermission('create_livreurs');
    }

    public function viewLivreur(User $user)
    {
        return $user->hasPermission('view_livreurs');
    }

    public function editLivreur(User $user)
    {
        return $user->hasPermission('update_livreurs');
    }

    public function deleteLivreur(User $user)
    {
        return $user->hasPermission('delete_livreurs');
    }
}