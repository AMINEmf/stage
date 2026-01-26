<?php

namespace App\Policies;

use App\Models\User;

class EmployePolicy
{
    public function viewAllEmployes(User $user)
    {
        return $user->hasPermission('view_all_employes');
    }

    public function createEmploye(User $user)
    {
        return $user->hasPermission('create_employes');
    }

    public function viewEmploye(User $user)
    {
        return $user->hasPermission('view_employes');
    }

    public function editEmploye(User $user)
    {
        return $user->hasPermission('update_employes');
    }

    public function deleteEmploye(User $user)
    {
        return $user->hasPermission('delete_employes');
    }
}
