<?php

namespace App\Policies;

use App\Models\User;

class GpGroupPaiePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_groupes_paie');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_groupes_paie');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_groupes_paie');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_groupes_paie');
    }
}


