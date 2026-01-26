<?php

namespace App\Policies;

use App\Models\User;

class RubriquePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_rubriques');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_rubriques');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_rubriques');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_rubriques');
    }
}


