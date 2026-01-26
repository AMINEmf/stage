<?php

namespace App\Policies;

use App\Models\User;

class VehiculePolicy
{
    public function viewAllVehicules(User $user)
    {
        return $user->hasPermission('view_all_vehicules');
    }

    public function createVehicule(User $user)
    {
        return $user->hasPermission('create_vehicules');
    }

    public function viewVehicule(User $user)
    {
        return $user->hasPermission('view_vehicules');
    }

    public function editVehicule(User $user)
    {
        return $user->hasPermission('update_vehicules');
    }

    public function deleteVehicule(User $user)
    {
        return $user->hasPermission('delete_vehicules');
    }
}