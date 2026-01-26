<?php

namespace App\Policies;

use App\Models\User;

class DepartementPolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_departements');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_departements');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_departements');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_departements');
    }
}


