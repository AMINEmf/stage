<?php

namespace App\Policies;

use App\Models\User;

class ThemeBultinModelPolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_theme_bultin_models');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_theme_bultin_models');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_theme_bultin_models');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_theme_bultin_models');
    }
}


