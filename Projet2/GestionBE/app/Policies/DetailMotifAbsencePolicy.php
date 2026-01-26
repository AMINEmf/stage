<?php

namespace App\Policies;

use App\Models\User;

class DetailMotifAbsencePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_absences');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_absences');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_absences');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_absences');
    }
}


