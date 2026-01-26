<?php

namespace App\Policies;

use App\Models\User;

class GpDemandeCongePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_demandes_conges');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_demandes_conges');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_demandes_conges');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_demandes_conges');
    }
}


