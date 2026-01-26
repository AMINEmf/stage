<?php

namespace App\Policies;

use App\Models\User;

class GpCongePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_conges');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_conges');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_conges');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_conges');
    }
}


