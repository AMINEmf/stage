<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Horaire;

class HorairePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_horaires');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_horaires');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_horaires');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_horaires');
    }
}
