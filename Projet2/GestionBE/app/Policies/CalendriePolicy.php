<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Calendrie;

class CalendriePolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_calendries');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_calendries');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_calendries');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_calendries');
    }
}
