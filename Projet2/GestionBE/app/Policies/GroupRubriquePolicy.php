<?php

namespace App\Policies;

use App\Models\User;

class GroupRubriquePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_group_rubriques');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_group_rubriques');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_group_rubriques');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_group_rubriques');
    }
}


