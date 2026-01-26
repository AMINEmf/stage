<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Gate;

class AuthController extends Controller
{

    public function user()
    {
        // if (Gate::allows('view_all_users')) {
        //     $user = Auth::user();
        //     $user = User::with('roles.permissions')->find($user->id)->get();
        //     return response()->json([
        //         'status' => 1,
        //         'user' => [
        //             'id' => $user->id,
        //             'name' => $user->name,
        //             'email' => $user->email,
        //             'photo' => $user->photo,
        //             'roles' => $user->roles->pluck('name'), 
        //             'permissions' => $user->roles->flatMap(function ($role) {
        //                 return $role->permissions->pluck('name');
        //             }), 
        //         ],
        //     ]);
        // } else {
        //     abort(403, 'Vous n\'avez pas l\'autorisation de voir la liste des utilisateurs.');
        // }
        // Get the currently authenticated user
        $user = Auth::user();
        $users = User::where('id', $user->id)->with('roles.permissions')->get();
        return response()->json($users, 200);
    }


    public function logout()
    {
        if (Auth::check()) {
            $cookie = Cookie::forget('jwt');

            $user_id = Auth::user()->id;
            $user = User::where('id', $user_id)->first();

            if ($user) {
                $user->tokens()->delete();
            }

            return response()->json([
                'status'    => 1,
                'message'   => "User Logged out",
            ])->withCookie($cookie);
        }

        return response()->json([
            'status'    => 0,
            'message'   => "User not authenticated",
        ]);
    }

    public function register(Request $request)
    {
        if (Gate::allows('create_user')) {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|unique:users|max:255',
                'password' => 'required|string|min:8',
                'role' => 'required|string',
                'permissions' => 'array',
                'permissions.*' => 'string|exists:permissions,name',
                'photo' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:2048',
                        ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 0,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = new User([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
            ]);

            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('public/photos');
                $user->photo = Storage::url($photoPath);
            }

            $user->save();

            $role = Role::firstOrCreate(['name' => $request->role]);
            $user->roles()->sync([$role->id]);

            if ($request->has('permissions')) {
                $permissions = Permission::whereIn('name', $request->permissions)->get();
                $role->permissions()->sync($permissions);
            }

            return response()->json([
                'status' => 1,
                'message' => 'Utilisateur ajouter avec succès',
                'user' => $user,
            ], 201);
        } else {
            abort(403, 'Vous n\'avez pas l\'autorisation d\'ajouter un utilisateur.');
        }
    }



    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);
    
        $user = User::where('email', $request->email)->first();
    
        if (!$user) {
            return response()->json([
                'status'  => 0,
                'message' => 'Email not found',
            ], 400);
        }
    
        if ($user && $user->password !== $request->password) {
            return response()->json([
                'status'  => 0,
                'message' => 'Incorrect password',
            ], 400);
        }
    
        Auth::login($user);
    
        $token = $user->createToken('API_TOKEN')->plainTextToken;
    
        $cookie = Cookie::make('jwt', $token, 60, null, null, false, true);
    
        return response()->json([
            'status'    => 1,
            'message'   => 'Utilisateur connecté',
            'user'      => $user,
            'photo'     => $user->photo,
            'token'     => $token,
        ], 200)->withCookie($cookie);
    }
    

    
    public function update(Request $request, $id)
    {
        Log::info('Requête reçue pour modification d\'utilisateur : ', $request->all());
        if (Gate::allows('edit_user')) {
            Log::info('--- [UPDATE USER] Début de la mise à jour ---', [
                'user_id' => $id,
                'payload' => $request->all(),
            ]);
    
            $user = User::findOrFail($id);
            Log::info('[UPDATE USER] Utilisateur trouvé', ['user' => $user]);
    
            $validator = Validator::make($request->all(), [
                'name' => 'string|max:255',
                'email' => 'string|email|max:255',
                'photo' => 'file|mimes:jpeg,png,jpg,gif|max:2048',
                'password' => 'string|min:8',
                'role' => 'string',
                'permissions' => 'array',
                'permissions.*' => 'string|exists:permissions,name',
            ], [
                'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            ]);
    
            if ($validator->fails()) {
                Log::warning('[UPDATE USER] Validation échouée', [
                    'errors' => $validator->errors(),
                ]);
    
                return response()->json([
                    'status' => 0,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors(),
                ], 422);
            }
    
            Log::info('[UPDATE USER] Validation réussie');
    
            $user->name = $request->input('name', $user->name);
            $user->email = $request->input('email', $user->email);
    
            if ($request->has('password')) {
                Log::info('[UPDATE USER] Mise à jour du mot de passe');
                $user->password = $request->input('password');
            }
    
            if ($request->hasFile('photo')) {
                try {
                    Log::info('[UPDATE USER] Upload de la photo détecté');
                    $photoPath = $request->file('photo')->store('public/photos');
                    $user->photo = Storage::url($photoPath);
                    Log::info('[UPDATE USER] Photo stockée', ['photo_path' => $photoPath]);
                } catch (\Exception $e) {
                    Log::error('[UPDATE USER] Erreur lors du stockage de la photo', [
                        'error' => $e->getMessage(),
                    ]);
                    return response()->json([
                        'status' => 0,
                        'message' => 'Erreur lors du stockage de la photo.',
                        'error' => $e->getMessage(),
                    ], 500);
                }
            }
    
            $user->save();
            Log::info('[UPDATE USER] Utilisateur sauvegardé avec succès');
    
            if ($request->has('role')) {
                Log::info('[UPDATE USER] Synchronisation du rôle', ['role' => $request->role]);
                $role = Role::firstOrCreate(['name' => $request->role]);
                $user->roles()->sync([$role->id]);
            }
    
            if ($request->has('permissions')) {
                Log::info('[UPDATE USER] Permissions reçues', [
                    'permissions' => $request->permissions,
                ]);
    
                $permissions = Permission::whereIn('name', $request->permissions)->get();
                Log::info('[UPDATE USER] Permissions trouvées', ['permissions' => $permissions->pluck('name')]);
    
                if (isset($role)) {
                    $role->permissions()->sync($permissions);
                    Log::info('[UPDATE USER] Permissions synchronisées avec le rôle');
                } else {
                    Log::warning('[UPDATE USER] Aucun rôle trouvé pour associer les permissions');
                }
            }
    
            Log::info('--- [UPDATE USER] Fin de la mise à jour ---');
    
            return response()->json([
                'status' => 1,
                'message' => 'Utilisateur mis à jour avec succès',
                'user' => $user,
            ]);
        } else {
            Log::warning('[UPDATE USER] Accès refusé pour la mise à jour', ['user_id' => $id]);
            abort(403, 'Vous n\'avez pas l\'autorisation de modifier un utilisateur.');
        }
    }
    



    public function destroy($id)
    {
        if (Gate::allows('delete_user')) {
            $user = User::findOrFail($id);

            $user->delete();

            return response()->json([
                'status' => 1,
                'message' => 'Utilisateur supprimé avec succès',
            ]);
        } else {
            abort(403, 'Vous n\'avez pas l\'autorisation de supprimer un utilisateur.');
        }
    }

    public function index()
    {
        // Vérifie si l'utilisateur est autorisé à voir tous les utilisateurs
        if (Gate::allows('view_all_users')) {
            // Récupère tous les utilisateurs avec leurs rôles et permissions
            $users = User::with('roles.permissions')->get();
            
            // Retourne la réponse JSON avec la liste des utilisateurs
            return response()->json($users, 200);
        } else {
            // Si l'utilisateur n'est pas autorisé, retourne une erreur 403
            abort(403, 'Vous n\'avez pas l\'autorisation de voir la liste des utilisateurs.');
        }
    }
    
    public function edit($id)
    {
        $user = User::with('roles.permissions')->findOrFail($id);

        return response()->json([
            'status' => 1,
            'user' => $user,
        ]);
    }
}
