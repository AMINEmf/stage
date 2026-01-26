<?php

namespace App\Policies;

use App\Models\User;

class CommandePolicy
{
    public function viewAllCommandes(User $user)
    {
        return $user->hasPermission('view_all_commandes');
    }

    public function createCommande(User $user)
    {
        return $user->hasPermission('create_commandes');
    }

    public function viewCommande(User $user)
    {
        return $user->hasPermission('view_commandes');
    }

    public function editCommande(User $user)
    {
        return $user->hasPermission('update_commandes');
    }

    public function deleteCommande(User $user)
    {
        return $user->hasPermission('delete_commandes');
    }
}