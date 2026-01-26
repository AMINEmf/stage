<?php

namespace App\Policies;

use App\Models\User;
use App\Models\HorairePeriodique;

class HorairePeriodiquePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_horaire_periodiques');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_horaire_periodiques');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_horaire_periodiques');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_horaire_periodiques');
    }
}
