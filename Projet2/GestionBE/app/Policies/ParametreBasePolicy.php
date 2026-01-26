<?php
namespace App\Policies;

use App\Models\User;
use App\Models\ParametreBase;

class ParametreBasePolicy
{
    public function view_all(User $user)
    {
        return $user->hasPermission('view_all_parametre_base');
    }
    public function view(User $user, ParametreBase $item)
    {
        return $user->hasPermission('view_all_parametre_base');
    }
    public function create(User $user)
    {
        return $user->hasPermission('create_parametre_base');
    }
    public function update(User $user, ParametreBase $item)
    {
        return $user->hasPermission('update_parametre_base');
    }
    public function delete(User $user, ParametreBase $item)
    {
        return $user->hasPermission('delete_parametre_base');
    }
}
