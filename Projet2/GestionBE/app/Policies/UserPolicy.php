<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
     public function viewAllUsers(User $user)
    {
        return $user->hasPermission('view_all_users');
    }
    
    public function createUser(User $user)
    {
        return $user->hasPermission('create_user');
    }
    
    public function viewUser(User $user)
    {
        return $user->hasPermission('view_user');
    }
    
    public function editUser(User $user)
    {
        return $user->hasPermission('edit_user');
    }
    
    public function deleteUser(User $user)
    {
        return $user->hasPermission('delete_user');
    }

}
