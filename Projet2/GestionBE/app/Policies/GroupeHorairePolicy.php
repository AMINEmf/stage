<?php

namespace App\Policies;

use App\Models\User;

class GroupeHorairePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_groupe_horaires');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_groupe_horaires');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_groupe_horaires');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_groupe_horaires');
    }
}


