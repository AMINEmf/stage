<?php
namespace App\Policies;

use App\Models\User;
use App\Models\HoraireExceptionnel;

class HoraireExceptionnelPolicy
{
    public function view_all(User $user)
    {
        return $user->hasPermission('view_all_horaire_exceptionnel');
    }
    public function view(User $user, HoraireExceptionnel $item)
    {
        return $user->hasPermission('view_all_horaire_exceptionnel');
    }
    public function create(User $user)
    {
        return $user->hasPermission('create_horaire_exceptionnel');
    }
    public function update(User $user, HoraireExceptionnel $item)
    {
        return $user->hasPermission('update_horaire_exceptionnel');
    }
    public function delete(User $user, HoraireExceptionnel $item)
    {
        return $user->hasPermission('delete_horaire_exceptionnel');
    }
}
