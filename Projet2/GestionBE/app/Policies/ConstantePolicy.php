<?php

namespace App\Policies;

use App\Models\User;

class ConstantePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_constantes');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_constantes');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_constantes');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_constantes');
    }
}


