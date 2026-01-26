<?php

namespace App\Policies;

use App\Models\User;

class AbsencePrevisionnelPolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_absence_previsionnels');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_absence_previsionnels');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_absence_previsionnels');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_absence_previsionnels');
    }
}


