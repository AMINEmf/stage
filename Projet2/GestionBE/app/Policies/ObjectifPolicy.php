<?php

namespace App\Policies;

use App\Models\User;

class ObjectifPolicy
{
    public function viewAllObjectifs(User $user)
    {
        return $user->hasPermission('view_all_objectifs');
    }

    public function createObjectif(User $user)
    {
        return $user->hasPermission('create_objectifs');
    }

    public function viewObjectif(User $user)
    {
        return $user->hasPermission('view_objectifs');
    }

    public function editObjectif(User $user)
    {
        return $user->hasPermission('update_objectifs');
    }

    public function deleteObjectif(User $user)
    {
        return $user->hasPermission('delete_objectifs');
    }
}