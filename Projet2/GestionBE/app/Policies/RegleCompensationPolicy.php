<?php
namespace App\Policies;

use App\Models\User;
use App\Models\RegleCompensation;

class RegleCompensationPolicy
{
    public function view_all(User $user)
    {
        return $user->hasPermission('view_all_regle_compensation');
    }
    public function view(User $user, RegleCompensation $regle)
    {
        return $user->hasPermission('view_all_regle_compensation');
    }
    public function create(User $user)
    {
        return $user->hasPermission('create_regle_compensation');
    }
    public function update(User $user, RegleCompensation $regle)
    {
        return $user->hasPermission('update_regle_compensation');
    }
    public function delete(User $user, RegleCompensation $regle)
    {
        return $user->hasPermission('delete_regle_compensation');
    }
}
