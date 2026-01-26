<?php
namespace App\Policies;

use App\Models\User;
use App\Models\Societe;

class SocietePolicy
{
    public function view_all(User $user)
    {
        return $user->hasPermission('view_all_societes');
    }
    public function view(User $user, Societe $societe)
    {
        return $user->hasPermission('view_all_societes');
    }
    public function create(User $user)
    {
        return $user->hasPermission('create_societes');
    }
    public function update(User $user, Societe $societe)
    {
        return $user->hasPermission('update_societes');
    }
    public function delete(User $user, Societe $societe)
    {
        return $user->hasPermission('delete_societes');
    }
}
