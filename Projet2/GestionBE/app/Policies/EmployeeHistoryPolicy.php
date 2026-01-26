<?php

namespace App\Policies;

use App\Models\User;

class EmployeeHistoryPolicy
{
    public function viewAll(User $user)
    {
        return $user->hasPermission('view_all_employee_histories');
    }

    public function create(User $user)
    {
        return $user->hasPermission('create_employee_histories');
    }

    public function update(User $user)
    {
        return $user->hasPermission('update_employee_histories');
    }

    public function delete(User $user)
    {
        return $user->hasPermission('delete_employee_histories');
    }
}


