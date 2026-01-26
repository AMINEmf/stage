<?php
namespace App\Policies;

use App\Models\User;
use App\Models\Penalite;

class PenalitePolicy
{
    public function view_all(User $user)
    {
        return $user->hasPermission('view_all_penalites');
    }
    public function view(User $user, Penalite $penalite)
    {
        return $user->hasPermission('view_all_penalites');
    }
    public function create(User $user)
    {
        return $user->hasPermission('create_penalites');
    }
    public function update(User $user, Penalite $penalite)
    {
        return $user->hasPermission('update_penalites');
    }
    public function delete(User $user, Penalite $penalite)
    {
        return $user->hasPermission('delete_penalites');
    }
}
