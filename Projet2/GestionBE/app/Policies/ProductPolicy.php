<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Produit;

class ProductPolicy
{
    public function viewAllProducts(User $user)
    {
        return $user->hasPermission('view_all_products');
    }
    
    public function createProduct(User $user)
    {
        return $user->hasPermission('create_product');
    }
    
    public function viewProduct(User $user)
    {
        return $user->hasPermission('view_product');
    }
    
    public function editProduct(User $user)
    {
        return $user->hasPermission('edit_product');
    }
    
    public function deleteProduct(User $user)
    {
        return $user->hasPermission('delete_product');
    }
}
