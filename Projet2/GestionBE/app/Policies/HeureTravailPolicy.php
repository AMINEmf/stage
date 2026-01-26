<?php
namespace App\Policies;

use App\Models\User;
use App\Models\HeureTravail;

class HeureTravailPolicy
{
    public function view_all(User $user)
    {
        return $user->hasPermission('view_all_heure_travail');
    }
    public function view(User $user, HeureTravail $item)
    {
        return $user->hasPermission('view_all_heure_travail');
    }
    public function create(User $user)
    {
        return $user->hasPermission('create_heure_travail');
    }
    public function update(User $user, HeureTravail $item)
    {
        return $user->hasPermission('update_heure_travail');
    }
    public function delete(User $user, HeureTravail $item)
    {
        return $user->hasPermission('delete_heure_travail');
    }
}
