<?php
namespace App\Policies;

use App\Models\User;
use App\Models\GpBonSortie;

class BonDeSortiePolicy
{
    public function view_all(User $user)
    {
        return $user->hasPermission('view_all_bon_de_sortie');
    }
    public function view(User $user, GpBonSortie $bonDeSortie)
    {
        return $user->hasPermission('view_all_bon_de_sortie');
    }
    public function create(User $user)
    {
        return $user->hasPermission('create_bon_de_sortie');
    }
    public function update(User $user, GpBonSortie $bonDeSortie)
    {
        return $user->hasPermission('update_bon_de_sortie');
    }
    public function delete(User $user, GpBonSortie $bonDeSortie)
    {
        return $user->hasPermission('delete_bon_de_sortie');
    }
}
