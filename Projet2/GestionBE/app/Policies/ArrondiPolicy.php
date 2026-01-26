<?php
namespace App\Policies;

use App\Models\User;
use App\Models\Arrondi;

class ArrondiPolicy
{
    public function view_all(User $user)
    {
        return $user->hasPermission('view_all_arrondis');
    }
    public function view(User $user, Arrondi $arrondi)
    {
        return $user->hasPermission('view_all_arrondis');
    }
    public function create(User $user)
    {
        return $user->hasPermission('create_arrondis');
    }
    public function update(User $user, Arrondi $arrondi)
    {
        return $user->hasPermission('update_arrondis');
    }
    public function delete(User $user, Arrondi $arrondi)
    {
        return $user->hasPermission('delete_arrondis');
    }
}
