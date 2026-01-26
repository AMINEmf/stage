<?php

namespace App\Policies;

use App\Models\User;

class ContratPolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_contrats');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_contrats');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_contrats');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_contrats');
    }
}


