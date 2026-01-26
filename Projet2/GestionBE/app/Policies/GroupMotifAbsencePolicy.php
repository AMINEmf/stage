<?php

namespace App\Policies;

use App\Models\User;

class GroupMotifAbsencePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_group_motifs');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_group_motifs');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_group_motifs');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_group_motifs');
    }
}


