<?php

namespace App\Policies;

use App\Models\User;

class BultinModelPolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_bultin_models');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_bultin_models');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_bultin_models');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_bultin_models');
    }
}


