<?php

namespace App\Policies;

use App\Models\User;

class JourFeriesPolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_jour_feries');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_jour_feries');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_jour_feries');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_jour_feries');
    }
}


