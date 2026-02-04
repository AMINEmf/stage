<?php

// use App\Http\Controllers\AuthController;
// use App\Http\Controllers\AutorisationController;
// use App\Http\Controllers\BonLivraisonController;
// use App\Http\Controllers\CalibreController;
// use App\Http\Controllers\CasseController;
// use App\Http\Controllers\CategorieController;
// use App\Http\Controllers\ChargementCommandeController;
// use App\Http\Controllers\ChiffreAffaireController;
// use App\Http\Controllers\ClientController;
// use App\Http\Controllers\CommandeController;
// use App\Http\Controllers\ComptesController;
// use App\Http\Controllers\DevisController;
// use App\Http\Controllers\EncaissementController;
// use App\Http\Controllers\EntrerBanqueController;
// use App\Http\Controllers\EtatRecouvrementController;
// use App\Http\Controllers\FactureController;
// use App\Http\Controllers\FournisseurController;
// use App\Http\Controllers\LigneCommandeController;
// use App\Http\Controllers\LigneDevisController;
// use App\Http\Controllers\LigneencaissementController;
// use App\Http\Controllers\LigneentrercompteController;
// use App\Http\Controllers\LigneFactureController;
// use App\Http\Controllers\LigneLivraisonController;
// use App\Http\Controllers\LivreurController;
// use App\Http\Controllers\ObjectifController;
// use App\Http\Controllers\OeuffinisemifiniController;
// use App\Http\Controllers\PermisController;
// use App\Http\Controllers\PermissionController;
// use App\Http\Controllers\PreparationCommandeController;
// use App\Http\Controllers\PreparationLigneCommandeController;
// use App\Http\Controllers\ProduitController;
// use App\Http\Controllers\ReclamationController;
// use App\Http\Controllers\RegionController;
// use App\Http\Controllers\RoleController;
// use App\Http\Controllers\SiteClientController;
// use App\Http\Controllers\StatusCommandeController;
// use App\Http\Controllers\StockController;
// use App\Http\Controllers\VehiculeController;
// use App\Http\Controllers\VehiculeLivreurController;
// use App\Http\Controllers\VisiteController;
// use App\Http\Controllers\ZoneController;

// use App\Http\Controllers\OffreController;
// use App\Http\Controllers\OffreDetailController;

// use App\Http\Controllers\GroupeClientController; //new 

// use App\Http\Controllers\ClientGroupeClientController;  //new


// use App\Http\Controllers\OffreGroupeController;  //new
 

// // use App\Http\Controllers\SocieteController;
// use App\Http\Controllers\DepartementController;
// use App\Http\Controllers\EmployeController;
// use App\Http\Controllers\EmployeDepartementController;


// use App\Models\Role;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Route;
 
// /*  
// |--------------------------------------------------------------------------
// | API Routes
// |--------------------------------------------------------------------------
// |
// | Here is where you can register API routes for your application. These
// | routes are loaded by the RouteServiceProvider and all of them will
// | be assigned to the "api" middleware group. Make something great!
// |
// */

// // Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
// //     return $request->user();
// // });
// Route::post("/login", [AuthController::class, 'login']);

//     //logout
//      Route::post("/logout", [AuthController::class, 'logout']);


// Route::middleware('auth:sanctum')->group(function () {
//     Route::post("/register", [AuthController::class, 'register']);
//     Route::get("/user", [AuthController::class, 'user']);

//     //produits
//     Route::get('produits', [ProduitController::class, 'index']);
//     Route::get('produits/{produit}', [ProduitController::class, 'show']);
//     Route::put('produits/{produit}', [ProduitController::class, 'update']);
//     Route::delete('produits/{produit}', [ProduitController::class, 'destroy']);
//     Route::post('produits', [ProduitController::class, 'store']);

//     // Fournisseurs
//     Route::get('fournisseurs', [FournisseurController::class, 'index']);
//     Route::post('fournisseurs', [FournisseurController::class, 'store']);
//     Route::get('fournisseurs/{fournisseur}', [FournisseurController::class, 'show']);
//     Route::put('fournisseurs/{fournisseur}', [FournisseurController::class, 'update']);
//     Route::delete('fournisseurs/{fournisseur}', [FournisseurController::class, 'destroy']);



//     //user
//     Route::get('/users/{id}/edit', [AuthController::class, 'edit']);
//     Route::put('/users/{id}',  [AuthController::class, 'update']);
//     Route::delete('/users/{id}',   [AuthController::class, 'destroy']);
//     Route::get('/users', [AuthController::class, 'index']);
   


//     Route::apiResource('/roles', RoleController::class);
//     Route::apiResource('/categories', CategorieController::class);

//     //zone
//     Route::get('zones', [ZoneController::class, 'index']);
//     Route::post('zones', [ZoneController::class, 'store']);
//     Route::get('zones/{zone}', [ZoneController::class, 'show']);
//     Route::put('zones/{zone}', [ZoneController::class, 'update']);
//     Route::delete('zones/{zone}', [ZoneController::class, 'destroy']);

//     Route::get('/objectifs', [ObjectifController::class, 'index']);
//     Route::post('/objectifs', [ObjectifController::class, 'store']);
//     Route::get('/objectifs/{id}', [ObjectifController::class, 'show']);
//     Route::put('/objectifs/{id}', [ObjectifController::class, 'update']);
//     Route::delete('/objectifs/{id}', [ObjectifController::class, 'destroy']);


//     // Routes pour Livreurs
//     Route::get('/livreurs', [LivreurController::class, 'index']);
//     Route::post('/livreurs', [LivreurController::class, 'store']);
//     Route::get('/livreurs/{id}', [LivreurController::class, 'show']);
//     Route::put('/livreurs/{id}', [LivreurController::class, 'update']);
//     Route::delete('/livreurs/{id}', [LivreurController::class, 'destroy']);


//     // Routes pour Vehicules
//     Route::get('/vehicules', [VehiculeController::class, 'index']);
//     Route::post('/vehicules', [VehiculeController::class, 'store']);
//     Route::get('/vehicules/{id}', [VehiculeController::class, 'show']);
//     Route::put('/vehicules/{id}', [VehiculeController::class, 'update']);
//     Route::delete('/vehicules/{id}', [VehiculeController::class, 'destroy']);

//     Route::get('/vehicule-livreurs', [VehiculeLivreurController::class, 'index']);
//     Route::post('/vehicule-livreurs', [VehiculeLivreurController::class, 'store']);
//     Route::get('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'show']);
//     Route::put('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'update']);
//     Route::delete('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'destroy']);


//     // Définition des routes pour les site clients
//     Route::get('siteclients', [SiteClientController::class, 'index']); // Route pour obtenir tous les site clients
//     Route::get('siteclients/{siteclient}', [SiteClientController::class, 'show']);
//     Route::put('siteclients/{siteclient}', [SiteClientController::class, 'update']);
//     Route::post('siteclients', [SiteClientController::class, 'store']);
//     Route::delete('siteclients/{siteclient}', [SiteClientController::class, 'destroy']);
//     // Route pour obtenir les site clients associés à un client spécifique
//     Route::get('clients/{clientId}/siteclients', [ClientController::class, 'siteclients']);

//     Route::get('clients/{clientId}/bonslivraison', [ClientController::class, 'bonsLivraisonClient']);

//     Route::apiResource('/devises', DevisController::class);
//     Route::apiResource('/lignedevis', LigneDevisController::class);
//     // Route pour obtenir les lignedevis associés à un devis spécifique
//     Route::get('devises/{devisId}/lignedevis', [DevisController::class, 'lignedevis']);
//     //Factures
//     Route::apiResource('/factures', FactureController::class);
//     Route::apiResource('/lignefactures', LigneFactureController::class);
//     //stock
//     Route::get('stock', [StockController::class, 'index']);
//     Route::post('stock', [StockController::class, 'store']);
//     Route::get('stock/{stock}', [StockController::class, 'show']);
//     Route::put('stock/{stock}', [StockController::class, 'update']);
//     Route::delete('stock/{stck}', [StockController::class, 'destroy']);
//     //permis
//     Route::get('/permis', [PermisController::class, 'index']);
//     Route::post('/permis', [PermisController::class, 'store']);
//     Route::get('/permis/{id}', [PermisController::class, 'show']);
//     Route::put('/permis/{id}', [PermisController::class, 'update']);
//     Route::delete('/permis/{id}', [PermisController::class, 'destroy']);
//     //Calibre
//     Route::apiResource('/calibres', CalibreController::class);


//     //region
//     Route::get('regions', [RegionController::class, 'index']);
//     Route::post('regions', [RegionController::class, 'store']);
//     Route::get('regions/{region}', [RegionController::class, 'show']);
//     Route::put('regions/{region}', [RegionController::class, 'update']);
//     Route::delete('regions/{region}', [RegionController::class, 'destroy']);

//       //Commandes
//       Route::get('commandes', [CommandeController::class, 'index']);
//       Route::post('commandes', [CommandeController::class, 'store']);
//       Route::get('commandes/{commande}', [CommandeController::class, 'show']);
//       Route::put('commandes/{commande}', [CommandeController::class, 'update']);
//       Route::delete('commandes/{commande}', [CommandeController::class, 'destroy']);
//       Route::get('/clients/{clientId}/commandes', [CommandeController::class, 'getOrdersByClientId']);

//       Route::apiResource('/chargementCommandes', ChargementCommandeController::class);
//       Route::get('chargementCommandes/{commandeId}/commandes', [ChargementCommandeController::class, 'getByCommandeId']);
  
//       Route::apiResource('/ligneCommandes', LigneCommandeController::class);
//       Route::apiResource('/statusCommande', StatusCommandeController::class);
//       Route::apiResource('/statusCommande', StatusCommandeController::class);
//       Route::apiResource('/lignePreparationCommandes', PreparationLigneCommandeController::class);
//       Route::apiResource('/PreparationCommandes', PreparationCommandeController::class);
//       Route::get('PreparationCommandes/{preparationCommande}/lignePreparationCommandes', [PreparationCommandeController::class, 'getLignesPreparationByPreparation']);
//       Route::apiResource('/livraisons', BonLivraisonController::class);

//       //autorisation onsa
//       Route::apiResource('/autorisation', AutorisationController::class);
//       Route::apiResource('/vis/store', VisiteController::class);
//       Route::apiResource('/oeuffinisemifini', OeuffinisemifiniController::class);
//       Route::apiResource('/oeufcasses', CasseController::class);
// //les api de amine 
// Route::get('/chiffre-affaire', [ChiffreAffaireController::class, 'index']);
// Route::post('/chiffre-affaire', [ChiffreAffaireController::class, 'store']);
// Route::get('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'show']);
// Route::put('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'update']);
// Route::delete('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'destroy']);


// Route::apiResource('/devises', DevisController::class);
// Route::apiResource('/ligneDevis', LigneDevisController::class);
// // Route pour obtenir les lignedevis associés à un devis spécifique
// Route::get('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
// Route::post('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
// Route::put('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
// Route::delete('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);


// //Ligneentrercompte
// Route::apiResource('/ligneentrercompte',LigneentrercompteController::class);
// //Route for EntrerBanque
// Route::get('/banques', [EntrerBanqueController::class, 'index']);
// Route::post('/banques', [EntrerBanqueController::class, 'store']);
// Route::get('/banques/{id}', [EntrerBanqueController::class, 'show']);
// Route::put('/banques/{id}', [EntrerBanqueController::class, 'update']);
// Route::delete('/banques/{id}', [EntrerBanqueController::class, 'destroy']);
// Route::apiResource('/etat-recouvrements', EtatRecouvrementController::class,);

// Route::get('/reclamations', [ReclamationController::class, 'index']);
// Route::post('/reclamations', [ReclamationController::class, 'store']);
// Route::get('/reclamations/{id}', [ReclamationController::class, 'show']);
// Route::put('/reclamations/{id}', [ReclamationController::class, 'update']);
// Route::delete('/reclamations/{id}', [ReclamationController::class, 'destroy']);

// Route::apiResource('/encaissements', EncaissementController::class,);


// Route::apiResource('/ligneencaissement', LigneencaissementController::class,);

// //compte
// Route::apiResource('/comptes', ComptesController::class,);
// //Factures
// Route::apiResource('/factures', FactureController::class);

// Route::apiResource('/ligneFacture', LigneFactureController::class);
// // Route pour obtenir les lignedevis associés à un devis spécifique
// Route::get('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
// Route::post('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
// Route::put('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
// Route::delete('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);

// //bon livresan
// Route::apiResource('/livraisons', BonLivraisonController::class);
// Route::apiResource('/lignelivraisons', LigneLivraisonController::class);
// // Route pour obtenir les lignedevis associés à un devis spécifique
// Route::get('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
// Route::post('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
// Route::put('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
// Route::delete('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);



// //clients
// Route::get('clients', [ClientController::class, 'index']);
// Route::post('clients', [ClientController::class, 'store']);
// Route::get('clients/{client}', [ClientController::class, 'show']);
// Route::put('clients/{client}', [ClientController::class, 'update']);
// Route::delete('clients/{client}', [ClientController::class, 'destroy']);
    

// Route::get('/groupes', [GroupeClientController::class, 'index']);
// Route::post('/groupes', [GroupeClientController::class, 'store']);
// Route::get('/groupes/{Id_groupe}', [GroupeClientController::class, 'show']);
// Route::put('/groupes/{Id_groupe}', [GroupeClientController::class, 'update']);
// Route::delete('/groupes/{Id_groupe}', [GroupeClientController::class, 'destroy']);

// Route::get('/client-groupe-relations', [GroupeClientController::class, 'getRelations']);
// Route::get('/clients-groupe', [ClientGroupeClientController::class, 'index']);
// Route::post('/clients-groupe', [ClientGroupeClientController::class, 'store']);
// Route::get('/clients-groupe/{id}', [ClientGroupeClientController::class, 'show']);
// Route::put('/clients-groupe/{id}', [ClientGroupeClientController::class, 'update']);
// Route::delete('/clients-groupe/{id}', [ClientGroupeClientController::class, 'destroy']);
// Route::delete('/clients-groupe/{id}', [ClientGroupeClientController::class, 'removeClientFromGroup']);


// Route::get('/offres-groupe', [OffreGroupeController::class, 'index']);
// Route::post('/offres-groupe', [OffreGroupeController::class, 'store']);
// Route::get('/offres-groupe/{id}', [OffreGroupeController::class, 'show']);
// Route::put('/offres-groupe/{id}', [OffreGroupeController::class, 'update']);
// Route::delete('/offres-groupe/{id}', [OffreGroupeController::class, 'destroy']);
// Route::delete('/offres-groupe/{id}', [OffreGroupeController::class, 'removeOffreFromGroup']);
// Route::put('offres/{id}/update-groupes', [OffreController::class, 'updateGroupes']);
// Route::put('/offres/{id}/update-groupes', [OffreController::class, 'updateGroupes']);
// Route::apiResource('/offres', OffreController::class);
// // Resource routes for OffreDetailController
// Route::apiResource('/offre_details', OffreDetailController::class);
// // Route to get OffreDetails associated with a specific Offre
// Route::get('offres/{offreId}/offre_details', [OffreController::class, 'offreDetails']);






// // Societes routes

// // Route::get('/societes', [SocieteController::class, 'index']);
// // Route::post('/societes', [SocieteController::class, 'store']);
// // Route::put('/societes/{societe}', [SocieteController::class, 'update']);
// // Route::delete('/societes/{societe}', [SocieteController::class, 'destroy']);

// // Departements routes
// // Route::get('/societes/{societe}/departements', [DepartementController::class, 'index']);
// // Route::post('/societes/{societe}/departements', [DepartementController::class, 'store']);
// // Route::put('/departements/{departement}', [DepartementController::class, 'update']);
// // Route::delete('/departements/{departement}', [DepartementController::class, 'destroy']);

// // Employes routes
// // Route::get('/departements/{departement}/employes', [EmployeController::class, 'index']);
// // Route::post('/departements/{departement}/employes', [EmployeController::class, 'store']);
// // Route::post('/departements/employes', [EmployeController::class, 'store']);
// // Route::put('/employes/{employe}', [EmployeController::class, 'update']);
// // Route::delete('/employes/{employe}', [EmployeController::class, 'destroy']);










// // Route::get('/departements', [DepartementController::class, 'index']);
// // Route::post('/departements', [DepartementController::class, 'store']);
// // Route::put('/departements/{departement}', [DepartementController::class, 'update']);
// // Route::delete('/departements/{departement}', [DepartementController::class, 'destroy']);
// // Route::get('/departements/{departement}/children', [DepartementController::class, 'children']); // Fetch child departments
// // Route::post('/departements/{departement}/children', [DepartementController::class, 'storeChild']); // Create a department inside another



// // // Add this route to handle employees within a specific department
// // Route::get('/departements/{departementId}/employes', [EmployeController::class, 'index']);
// // Route::post('/departements/{departement}/employes', [EmployeController::class, 'storeEmployeForDepartement']);

// // Route::post('/employe', [EmployeController::class, 'store']);


// // Route::put('/employes/{employe}', [EmployeController::class, 'update']);
// // Route::delete('/employes/{employe}', [EmployeController::class, 'destroy']);


// // Route::get('/employe-departements', [EmployeDepartementController::class, 'index']);
// // Route::post('/employe-departements', [EmployeDepartementController::class, 'store']);
// // Route::get('/employe-departements/{employeDepartement}', [EmployeDepartementController::class, 'show']);
// // Route::delete('/employe-departements/{employeDepartement}', [EmployeDepartementController::class, 'destroy']);
// // Route::post('/employes', [EmployeController::class, 'store']);




// Route::get('/departements', [DepartementController::class, 'index']);
// Route::post('/departements', [DepartementController::class, 'store']);
// Route::put('/departements/{departement}', [DepartementController::class, 'update']);
// Route::delete('/departements/{departement}', [DepartementController::class, 'destroy']);
// Route::get('/departements/{departement}/children', [DepartementController::class, 'children']); // Fetch child departments
// Route::post('/departements/{departement}/children', [DepartementController::class, 'storeChild']); // Create a department inside another



// // Add this route to handle employees within a specific department
// Route::get('/departements/{departementId}/employes', [EmployeController::class, 'index']);
// // Route::post('/departements/employes', [EmployeController::class, 'storeEmployeForDepartement']);

// Route::put('/employes/{employe}', [EmployeController::class, 'update']);
// Route::delete('/employes/{employe}', [EmployeController::class, 'destroy']);


// Route::get('/employe-departements', [EmployeDepartementController::class, 'index']);
// Route::post('/employe-departements', [EmployeDepartementController::class, 'store']);
// Route::get('/employe-departements/{employeDepartement}', [EmployeDepartementController::class, 'show']);
// Route::delete('/employe-departements/{employeDepartement}', [EmployeDepartementController::class, 'destroy']);
// Route::post('/employe',[EmployeController::class , 'store']);


// Route::get('/employes', [EmployeController::class, 'index']);


// });



use App\Http\Controllers\AuthController;
use App\Http\Controllers\AutorisationController;
use App\Http\Controllers\BonLivraisonController;
use App\Http\Controllers\CalibreController;
use App\Http\Controllers\CasseController;
use App\Http\Controllers\CategorieController;
use App\Http\Controllers\ChargementCommandeController;
use App\Http\Controllers\ChiffreAffaireController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CommandeController;
use App\Http\Controllers\ComptesController;
use App\Http\Controllers\DevisController;
use App\Http\Controllers\EncaissementController;
use App\Http\Controllers\EntrerBanqueController;
use App\Http\Controllers\EtatRecouvrementController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\FournisseurController;
use App\Http\Controllers\LigneCommandeController;
use App\Http\Controllers\LigneDevisController;
use App\Http\Controllers\LigneencaissementController;
use App\Http\Controllers\LigneentrercompteController;
use App\Http\Controllers\LigneFactureController;
use App\Http\Controllers\LigneLivraisonController;
use App\Http\Controllers\LivreurController;
use App\Http\Controllers\ObjectifController;
use App\Http\Controllers\OeuffinisemifiniController;
use App\Http\Controllers\PermisController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PreparationCommandeController;
use App\Http\Controllers\PreparationLigneCommandeController;
use App\Http\Controllers\ProduitController;
use App\Http\Controllers\ReclamationController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SiteClientController;
use App\Http\Controllers\StatusCommandeController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\VehiculeController;
use App\Http\Controllers\VehiculeLivreurController;
use App\Http\Controllers\VisiteController;
use App\Http\Controllers\ZoneController;

use App\Http\Controllers\OffreController;
use App\Http\Controllers\OffreDetailController;

use App\Http\Controllers\GroupeClientController; //new 

use App\Http\Controllers\ClientGroupeClientController;  //new


use App\Http\Controllers\OffreGroupeController;  //new
 

// use App\Http\Controllers\SocieteController;
use App\Http\Controllers\DepartementController;
use App\Http\Controllers\EmployeController;
use App\Http\Controllers\EmployeDepartementController;
use App\Http\Controllers\ContratController;
use App\Http\Controllers\AccidentController;
use App\Http\Controllers\CimrAffiliationController;
use App\Http\Controllers\CimrDeclarationController;


use App\Http\Controllers\ContractTypeController;

use App\Http\Controllers\DetailMotifAbsenceController;
use App\Http\Controllers\GroupMotifAbsenceController;
use App\Http\Controllers\JourFeriesController;
use App\Http\Controllers\AbsencePrevisionnelController;
use App\Http\Controllers\HoraireController;
use App\Http\Controllers\GroupeHoraireController;
use App\Http\Controllers\HorairePeriodiqueController;

use App\Http\Controllers\DetailsPeriodiqueController;
use App\Http\Controllers\CalendrieController;




use App\Http\Controllers\DetailsCalendrieController;
use App\Http\Controllers\RegleCompensationController;
use App\Http\Controllers\PenaliteController;
use App\Http\Controllers\GroupeArrondiController;
use App\Http\Controllers\ArrondiController;
use App\Http\Controllers\ParametreBaseController;
use App\Http\Controllers\DetailsRegleController;
use App\Http\Controllers\HeureTravailController;
use App\Http\Controllers\HoraireExceptionnelController;

// api_Soukaina

use App\Http\Controllers\PaysController;
use App\Http\Controllers\VilleController;
use App\Http\Controllers\CommuneController;


use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UniteController;
use App\Http\Controllers\PosteController;
use App\Http\Controllers\GpCalendrierEmployeController;
use App\Http\Controllers\RegleCompEmployeController;
use App\Http\Controllers\GpBanqueController;
use App\Http\Controllers\GpAgenceController;
use App\Http\Controllers\GpCompteBancaireController;
use App\Http\Controllers\SocieteController;
use App\Http\Controllers\GpBonSortieController;

use App\Http\Controllers\GroupConstanteController;
use App\Http\Controllers\GroupRubriqueController;
use App\Http\Controllers\TypeRubriqueController;
use App\Http\Controllers\MemoController;
use App\Http\Controllers\RubriqueController;
use App\Http\Controllers\MemosConstanteController;
use App\Http\Controllers\ImprimableController;
use App\Http\Controllers\MoisClotureController;
use App\Http\Controllers\RappelSalaireController;
use App\Http\Controllers\ProprieteController;
use App\Http\Controllers\CalculController;
use App\Http\Controllers\TypeConstanteController;



use App\Http\Controllers\ConstanteController;
use App\Http\Controllers\BultinModelController;
use App\Http\Controllers\ThemeBultinModelController;
use App\Http\Controllers\GpEmployeBulletinController;
use App\Http\Controllers\GpGroupPaieController;
use App\Http\Controllers\GpCongeController;
use App\Http\Controllers\GpDemandeCongeController;

















use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
 
/*  
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });



Route::get('/full-data', [PaysController::class, 'getFullData']);




Route::get('/employes/themes-bulletins', [EmployeController::class, 'getThemesBulletins']);
Route::get('/employes/{id}/rubriques-constantes', [EmployeController::class, 'getRubriquesEtConstantes']);













Route::post("/login", [AuthController::class, 'login']);

    //logout
     Route::post("/logout", [AuthController::class, 'logout']);

// Accidents public API (no auth)
Route::apiResource('accidents', AccidentController::class);
Route::apiResource('cimr-affiliations', CimrAffiliationController::class);
Route::get('cimr-declarations/eligible-employees', [CimrDeclarationController::class, 'eligibleEmployees']);
Route::post('cimr-declarations/delete-by-period', [CimrDeclarationController::class, 'destroyByPeriod']);
Route::apiResource('cimr-declarations', CimrDeclarationController::class);
Route::get('/departements/employes', [EmployeController::class, 'index']);


Route::middleware('auth:sanctum')->group(function () {

    Route::post("/register", [AuthController::class, 'register']);
    Route::get("/user", [AuthController::class, 'user']);
    Route::apiResource('calendrie', CalendrieController::class);












Route::apiResource('pays', PaysController::class);
Route::apiResource('villes', VilleController::class);
Route::apiResource('communes', CommuneController::class);
Route::get('/villes', [VilleController::class, 'getVilles']);

Route::get('/communes', [CommuneController::class, 'getCommunes']);

Route::apiResource('postes ', PosteController::class);
Route::get('postes/{id}/hierarchy', [PosteController::class, 'getHierarchy']);

Route::apiResource('services', ServiceController::class);
Route::apiResource('unites', UniteController::class);

Route::get('/departements/{id}/services', [DepartementController::class, 'getServices']);
Route::get('/services/{id}/unites', [ServiceController::class, 'getUnitesByService']);
Route::get('/unites/{id}/postes', [PosteController::class, 'getPostesByUnite']);




Route::get('/departements', [DepartementController::class, 'index']);
Route::post('/departements', [DepartementController::class, 'store']);
Route::put('/departements/{departement}', [DepartementController::class, 'update']);
Route::delete('/departements/{departement}', [DepartementController::class, 'destroy']);
Route::get('/departements/{departement}/children', [DepartementController::class, 'children']);
Route::post('/departements/{departement}/children', [DepartementController::class, 'storeChild']);

Route::apiResource('calendriers-employes', GpCalendrierEmployeController::class);
// Route::apiResource('calendrie', CalendrieController::class);
// Route::get('/departements/employes', [EmployeController::class, 'index']);
Route::apiResource('regles-comp-employes', RegleCompEmployeController::class);




Route::apiResource('banque', GpBanqueController::class);
Route::apiResource('agences', GpAgenceController::class);
Route::apiResource('comptes-bancaires', GpCompteBancaireController::class);




// Routes pour les constantes
Route::apiResource('type-constantes', TypeConstanteController::class);
Route::apiResource('constantes', ConstanteController::class);



// Routes pour les constantes et groupes de constantes
Route::apiResource('constante', ConstanteController::class);
Route::apiResource('group-constantes', GroupConstanteController::class);

// Routes pour les rubriques et leurs composants
Route::apiResource('group-rubriques', GroupRubriqueController::class);
Route::apiResource('type-rubriques', TypeRubriqueController::class);
Route::apiResource('memos', MemoController::class);
Route::apiResource('rubriques', RubriqueController::class);

// Routes spéciales pour les rubriques incomplètes/complètes
Route::get('/rubriques/incomplete', [RubriqueController::class, 'getIncomplete']);
Route::post('/rubriques/{rubrique}/mark-complete', [RubriqueController::class, 'markAsComplete']);

Route::apiResource('memos-constantes', MemosConstanteController::class);
Route::apiResource('imprimables', ImprimableController::class);
Route::apiResource('mois-clotures', MoisClotureController::class);
Route::apiResource('rappel-salaires', RappelSalaireController::class);
Route::apiResource('proprietes', ProprieteController::class);

// Route spécialisée pour la liaison Rubriques ↔ Calculs - Reconstruction de formule
Route::post('rubriques/{rubrique}/rebuild-formule', [RubriqueController::class, 'rebuildFormule']);

// Routes pour les calculs
Route::apiResource('calculs', CalculController::class);

// Route pour récupérer les calculs par groupe
Route::get('/calculs/group/{groupId}', [CalculController::class, 'getByGroup']);

// <---------------------------- api SALMA -------------------------->
Route::apiResource('bultinmodels',BultinModelController::class);
Route::get('/bultinmodels/{id}/rubriques', [BultinModelController::class, 'getRubriques']);
Route::post('/bultinmodels/{id}/rubriques', [BultinModelController::class, 'attachRubriques']);


Route::get('/allrubriques', [RubriqueController::class, 'allrubrique']);
Route::get('/constantesbultinmodels', [ConstanteController::class, 'allconstante']);
Route::get('/bultinmodels/{id}/constantes', [BultinModelController::class, 'getConstantes']);
Route::post('/bultinmodels/{id}/constantes', [BultinModelController::class, 'attachConstantes']);
Route::delete('/bultinmodels/{bultinModel}/rubriques/{rubrique}', [BultinModelController::class, 'detachRubrique']);
Route::delete('/bultinmodels/{bultinModel}/constantes/{constante}', [BultinModelController::class, 'detachConstante']);
Route::post('/bultinmodels/{id}/duplicate', [BultinModelController::class, 'duplicate']);
Route::put('/rubriques/{id}/ordre', [BultinModelController::class, 'updateOrdreRubrique']);
Route::put('/constantes/{id}/ordre', [BultinModelController::class, 'updateOrdreConstante']);
Route::post('/constantes/unlink-multiple', [BultinModelController::class, 'unlinkMultipleConstante']);
Route::post('/rubriques/unlink-multiple', [BultinModelController::class, 'UnlikMultipleRubrique']);

//pour theme
Route::apiResource('themes',ThemeBultinModelController::class);
Route::put('/themes/{id}', [ThemeBultinModelController::class, 'update']);
Route::post('/themes/{id}/definir-par-defaut', [ThemeBultinModelController::class, 'definirParDefaut']);

// <---------------------------- api IKRAM -------------------------->

// Route::get('/employes/themes-bulletins', [EmployeController::class, 'getThemesBulletins']);
// Route::get('/employes/{id}/rubriques-constantes', [EmployeController::class, 'getRubriquesEtConstantes']);
//route afficher department
// routes/api.php

Route::get('departements/hierarchy', [DepartementController::class, 'getHierarchy']);

Route::get('/departements/{id}', [DepartementController::class, 'show']);
Route::get('/constantes-rubriques', [ConstantesRubriquesController::class, 'index']);
Route::post('/employes/{employe}/bulletins', [GpEmployeBulletinController::class, 'store']);




Route::get('/groupes-paie/{id}/rubriques', [GpGroupPaieController::class, 'getRubriques']);
Route::post('/groupes-paie/{id}/rubriques', [GpGroupPaieController::class, 'attachRubriques']);

Route::delete('groupes-paie/{groupPaie}/rubriques/{rubrique}', [GpGroupPaieController::class, 'detachRubrique']);

Route::apiResource('groupes-paie', GpGroupPaieController::class);
Route::apiResource('gp_bon_sortie', GpBonSortieController::class);
Route::get('/employes/dashboard-stats', [EmployeController::class, 'getDashboardStats']);
Route::get('/total-departemet', [DepartementController::class, 'TotalDepartemet']);










Route::post('/import-employes',[EmployeController::class , 'import']);

//societe
Route::apiResource('societes', SocieteController::class);
Route::get('/employee-history', [EmployeDepartementController::class, 'getEmployeeHistory']);


Route::get('/conge', [GpCongeController::class, 'index']);

Route::apiResource('demandes-conges', GpDemandeCongeController::class);
Route::apiResource('groupe-arrondi', GroupeArrondiController::class);
























    //produits
    Route::get('produits', [ProduitController::class, 'index']);
    Route::get('produits/{produit}', [ProduitController::class, 'show']);
    Route::put('produits/{produit}', [ProduitController::class, 'update']);
    Route::delete('produits/{produit}', [ProduitController::class, 'destroy']);
    Route::post('produits', [ProduitController::class, 'store']);

    // Fournisseurs
    Route::get('fournisseurs', [FournisseurController::class, 'index']);
    Route::post('fournisseurs', [FournisseurController::class, 'store']);
    Route::get('fournisseurs/{fournisseur}', [FournisseurController::class, 'show']);
    Route::put('fournisseurs/{fournisseur}', [FournisseurController::class, 'update']);
    Route::delete('fournisseurs/{fournisseur}', [FournisseurController::class, 'destroy']);



    //user
    Route::get('/users/{id}/edit', [AuthController::class, 'edit']);
    Route::put('/users/{id}',  [AuthController::class, 'update']);
    Route::delete('/users/{id}',   [AuthController::class, 'destroy']);
    Route::get('/users', [AuthController::class, 'index']);
   


    Route::apiResource('/roles', RoleController::class);
    Route::apiResource('/categories', CategorieController::class);

    //zone
    Route::get('zones', [ZoneController::class, 'index']);
    Route::post('zones', [ZoneController::class, 'store']);
    Route::get('zones/{zone}', [ZoneController::class, 'show']);
    Route::put('zones/{zone}', [ZoneController::class, 'update']);
    Route::delete('zones/{zone}', [ZoneController::class, 'destroy']);

    Route::get('/objectifs', [ObjectifController::class, 'index']);
    Route::post('/objectifs', [ObjectifController::class, 'store']);
    Route::get('/objectifs/{id}', [ObjectifController::class, 'show']);
    Route::put('/objectifs/{id}', [ObjectifController::class, 'update']);
    Route::delete('/objectifs/{id}', [ObjectifController::class, 'destroy']);


    // Routes pour Livreurs
    Route::get('/livreurs', [LivreurController::class, 'index']);
    Route::post('/livreurs', [LivreurController::class, 'store']);
    Route::get('/livreurs/{id}', [LivreurController::class, 'show']);
    Route::put('/livreurs/{id}', [LivreurController::class, 'update']);
    Route::delete('/livreurs/{id}', [LivreurController::class, 'destroy']);


    // Routes pour Vehicules
    Route::get('/vehicules', [VehiculeController::class, 'index']);
    Route::post('/vehicules', [VehiculeController::class, 'store']);
    Route::get('/vehicules/{id}', [VehiculeController::class, 'show']);
    Route::put('/vehicules/{id}', [VehiculeController::class, 'update']);
    Route::delete('/vehicules/{id}', [VehiculeController::class, 'destroy']);

    Route::get('/vehicule-livreurs', [VehiculeLivreurController::class, 'index']);
    Route::post('/vehicule-livreurs', [VehiculeLivreurController::class, 'store']);
    Route::get('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'show']);
    Route::put('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'update']);
    Route::delete('/vehicule-livreurs/{id}', [VehiculeLivreurController::class, 'destroy']);


    // Définition des routes pour les site clients
    Route::get('siteclients', [SiteClientController::class, 'index']); // Route pour obtenir tous les site clients
    Route::get('siteclients/{siteclient}', [SiteClientController::class, 'show']);
    Route::put('siteclients/{siteclient}', [SiteClientController::class, 'update']);
    Route::post('siteclients', [SiteClientController::class, 'store']);
    Route::delete('siteclients/{siteclient}', [SiteClientController::class, 'destroy']);
    // Route pour obtenir les site clients associés à un client spécifique
    Route::get('clients/{clientId}/siteclients', [ClientController::class, 'siteclients']);

    Route::get('clients/{clientId}/bonslivraison', [ClientController::class, 'bonsLivraisonClient']);

    Route::apiResource('/devises', DevisController::class);
    Route::apiResource('/lignedevis', LigneDevisController::class);
    // Route pour obtenir les lignedevis associés à un devis spécifique
    Route::get('devises/{devisId}/lignedevis', [DevisController::class, 'lignedevis']);
    //Factures
    Route::apiResource('/factures', FactureController::class);
    Route::apiResource('/lignefactures', LigneFactureController::class);
    //stock
    Route::get('stock', [StockController::class, 'index']);
    Route::post('stock', [StockController::class, 'store']);
    Route::get('stock/{stock}', [StockController::class, 'show']);
    Route::put('stock/{stock}', [StockController::class, 'update']);
    Route::delete('stock/{stck}', [StockController::class, 'destroy']);
    //permis
    Route::get('/permis', [PermisController::class, 'index']);
    Route::post('/permis', [PermisController::class, 'store']);
    Route::get('/permis/{id}', [PermisController::class, 'show']);
    Route::put('/permis/{id}', [PermisController::class, 'update']);
    Route::delete('/permis/{id}', [PermisController::class, 'destroy']);
    //Calibre
    Route::apiResource('/calibres', CalibreController::class);


    //region
    Route::get('regions', [RegionController::class, 'index']);
    Route::post('regions', [RegionController::class, 'store']);
    Route::get('regions/{region}', [RegionController::class, 'show']);
    Route::put('regions/{region}', [RegionController::class, 'update']);
    Route::delete('regions/{region}', [RegionController::class, 'destroy']);

      //Commandes
      Route::get('commandes', [CommandeController::class, 'index']);
      Route::post('commandes', [CommandeController::class, 'store']);
      Route::get('commandes/{commande}', [CommandeController::class, 'show']);
      Route::put('commandes/{commande}', [CommandeController::class, 'update']);
      Route::delete('commandes/{commande}', [CommandeController::class, 'destroy']);
      Route::get('/clients/{clientId}/commandes', [CommandeController::class, 'getOrdersByClientId']);

      Route::apiResource('/chargementCommandes', ChargementCommandeController::class);
      Route::get('chargementCommandes/{commandeId}/commandes', [ChargementCommandeController::class, 'getByCommandeId']);
  
      Route::apiResource('/ligneCommandes', LigneCommandeController::class);
      Route::apiResource('/statusCommande', StatusCommandeController::class);
      Route::apiResource('/statusCommande', StatusCommandeController::class);
      Route::apiResource('/lignePreparationCommandes', PreparationLigneCommandeController::class);
      Route::apiResource('/PreparationCommandes', PreparationCommandeController::class);
      Route::get('PreparationCommandes/{preparationCommande}/lignePreparationCommandes', [PreparationCommandeController::class, 'getLignesPreparationByPreparation']);
      Route::apiResource('/livraisons', BonLivraisonController::class);

      //autorisation onsa
      Route::apiResource('/autorisation', AutorisationController::class);
      Route::apiResource('/vis/store', VisiteController::class);
      Route::apiResource('/oeuffinisemifini', OeuffinisemifiniController::class);
      Route::apiResource('/oeufcasses', CasseController::class);
//les api de amine 
Route::get('/chiffre-affaire', [ChiffreAffaireController::class, 'index']);
Route::post('/chiffre-affaire', [ChiffreAffaireController::class, 'store']);
Route::get('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'show']);
Route::put('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'update']);
Route::delete('/chiffre-affaire/{id}', [ChiffreAffaireController::class, 'destroy']);


Route::apiResource('/devises', DevisController::class);
Route::apiResource('/ligneDevis', LigneDevisController::class);
// Route pour obtenir les lignedevis associés à un devis spécifique
Route::get('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
Route::post('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
Route::put('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);
Route::delete('devises/{devisId}/ligneDevis', [DevisController::class, 'lignedevis']);


//Ligneentrercompte
Route::apiResource('/ligneentrercompte',LigneentrercompteController::class);
//Route for EntrerBanque
Route::get('/banques', [EntrerBanqueController::class, 'index']);
Route::post('/banques', [EntrerBanqueController::class, 'store']);
Route::get('/banques/{id}', [EntrerBanqueController::class, 'show']);
Route::put('/banques/{id}', [EntrerBanqueController::class, 'update']);
Route::delete('/banques/{id}', [EntrerBanqueController::class, 'destroy']);
Route::apiResource('/etat-recouvrements', EtatRecouvrementController::class,);

Route::get('/reclamations', [ReclamationController::class, 'index']);
Route::post('/reclamations', [ReclamationController::class, 'store']);
Route::get('/reclamations/{id}', [ReclamationController::class, 'show']);
Route::put('/reclamations/{id}', [ReclamationController::class, 'update']);
Route::delete('/reclamations/{id}', [ReclamationController::class, 'destroy']);

Route::apiResource('/encaissements', EncaissementController::class,);


Route::apiResource('/ligneencaissement', LigneencaissementController::class,);

//compte
Route::apiResource('/comptes', ComptesController::class,);
//Factures
Route::apiResource('/factures', FactureController::class);

Route::apiResource('/ligneFacture', LigneFactureController::class);
// Route pour obtenir les lignedevis associés à un devis spécifique
Route::get('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
Route::post('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
Route::put('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);
Route::delete('factures/{facturesId}/ligneFacture', [FactureController::class, 'lignefacture']);

//bon livraison
Route::apiResource('/livraisons', BonLivraisonController::class);
Route::apiResource('/lignelivraisons', LigneLivraisonController::class);
// Route pour obtenir les lignedevis associés à un devis spécifique
Route::get('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
Route::post('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
Route::put('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);
Route::delete('livraisons/{livraisonsId}/lignelivraisons', [BonLivraisonController::class, 'lignelivraison']);



//clients
Route::get('clients', [ClientController::class, 'index']);
Route::post('clients', [ClientController::class, 'store']);
Route::get('clients/{client}', [ClientController::class, 'show']);
Route::put('clients/{client}', [ClientController::class, 'update']);
Route::delete('clients/{client}', [ClientController::class, 'destroy']);
    

Route::get('/groupes', [GroupeClientController::class, 'index']);
Route::post('/groupes', [GroupeClientController::class, 'store']);
Route::get('/groupes/{Id_groupe}', [GroupeClientController::class, 'show']);
Route::put('/groupes/{Id_groupe}', [GroupeClientController::class, 'update']);
Route::delete('/groupes/{Id_groupe}', [GroupeClientController::class, 'destroy']);

Route::get('/client-groupe-relations', [GroupeClientController::class, 'getRelations']);
Route::get('/clients-groupe', [ClientGroupeClientController::class, 'index']);
Route::post('/clients-groupe', [ClientGroupeClientController::class, 'store']);
Route::get('/clients-groupe/{id}', [ClientGroupeClientController::class, 'show']);
Route::put('/clients-groupe/{id}', [ClientGroupeClientController::class, 'update']);
Route::delete('/clients-groupe/{id}', [ClientGroupeClientController::class, 'destroy']);
Route::delete('/clients-groupe/{id}', [ClientGroupeClientController::class, 'removeClientFromGroup']);


Route::get('/offres-groupe', [OffreGroupeController::class, 'index']);
Route::post('/offres-groupe', [OffreGroupeController::class, 'store']);
Route::get('/offres-groupe/{id}', [OffreGroupeController::class, 'show']);
Route::put('/offres-groupe/{id}', [OffreGroupeController::class, 'update']);
Route::delete('/offres-groupe/{id}', [OffreGroupeController::class, 'destroy']);
Route::delete('/offres-groupe/{id}', [OffreGroupeController::class, 'removeOffreFromGroup']);
Route::put('offres/{id}/update-groupes', [OffreController::class, 'updateGroupes']);
Route::put('/offres/{id}/update-groupes', [OffreController::class, 'updateGroupes']);
Route::apiResource('/offres', OffreController::class);
// Resource routes for OffreDetailController
Route::apiResource('/offre_details', OffreDetailController::class);
// Route to get OffreDetails associated with a specific Offre
Route::get('offres/{offreId}/offre_details', [OffreController::class, 'offreDetails']);




// api_Soukaina

// Route::apiResource('pays', PaysController::class);
// Route::apiResource('villes', VilleController::class);
// Route::apiResource('communes', CommuneController::class);







// Societes routes

// Route::get('/societes', [SocieteController::class, 'index']);
// Route::post('/societes', [SocieteController::class, 'store']);
// Route::put('/societes/{societe}', [SocieteController::class, 'update']);
// Route::delete('/societes/{societe}', [SocieteController::class, 'destroy']);

// Departements routes
// Route::get('/societes/{societe}/departements', [DepartementController::class, 'index']);
// Route::post('/societes/{societe}/departements', [DepartementController::class, 'store']);
// Route::put('/departements/{departement}', [DepartementController::class, 'update']);
// Route::delete('/departements/{departement}', [DepartementController::class, 'destroy']);

// Employes routes
// Route::get('/departements/{departement}/employes', [EmployeController::class, 'index']);
// Route::post('/departements/{departement}/employes', [EmployeController::class, 'store']);
// Route::post('/departements/employes', [EmployeController::class, 'store']);
// Route::put('/employes/{employe}', [EmployeController::class, 'update']);
// Route::delete('/employes/{employe}', [EmployeController::class, 'destroy']);










// Route::get('/departements', [DepartementController::class, 'index']);
// Route::post('/departements', [DepartementController::class, 'store']);
// Route::put('/departements/{departement}', [DepartementController::class, 'update']);
// Route::delete('/departements/{departement}', [DepartementController::class, 'destroy']);
// Route::get('/departements/{departement}/children', [DepartementController::class, 'children']); // Fetch child departments
// Route::post('/departements/{departement}/children', [DepartementController::class, 'storeChild']); // Create a department inside another



// // Add this route to handle employees within a specific department
// Route::get('/departements/{departementId}/employes', [EmployeController::class, 'index']);
// Route::post('/departements/{departement}/employes', [EmployeController::class, 'storeEmployeForDepartement']);

// Route::post('/employe', [EmployeController::class, 'store']);


// Route::put('/employes/{employe}', [EmployeController::class, 'update']);
// Route::delete('/employes/{employe}', [EmployeController::class, 'destroy']);


// Route::get('/employe-departements', [EmployeDepartementController::class, 'index']);
// Route::post('/employe-departements', [EmployeDepartementController::class, 'store']);
// Route::get('/employe-departements/{employeDepartement}', [EmployeDepartementController::class, 'show']);
// Route::delete('/employe-departements/{employeDepartement}', [EmployeDepartementController::class, 'destroy']);
// Route::post('/employes', [EmployeController::class, 'store']);




// Route::get('/departements', [DepartementController::class, 'index']);
// Route::post('/departements', [DepartementController::class, 'store']);
// Route::put('/departements/{departement}', [DepartementController::class, 'update']);
// Route::delete('/departements/{departement}', [DepartementController::class, 'destroy']);
// Route::get('/departements/{departement}/children', [DepartementController::class, 'children']); // Fetch child departments
// Route::post('/departements/{departement}/children', [DepartementController::class, 'storeChild']); // Create a department inside another



// Add this route to handle employees within a specific department

// Route::post('/departements/employes', [EmployeController::class, 'storeEmployeForDepartement']);

Route::put('/employes/{employe}', [EmployeController::class, 'update']);
Route::delete('/employes/{employe}', [EmployeController::class, 'destroy']);

Route::post('/employe',[EmployeController::class , 'store']);
Route::get('/employes', [EmployeController::class, 'index']);

Route::post('/employes/update-departement', [EmployeController::class, 'updateDepartement']);


Route::get('/employe-departements', [EmployeDepartementController::class, 'index']);
Route::post('/employe-departements', [EmployeDepartementController::class, 'store']);
Route::get('/employe-departements/{employeDepartement}', [EmployeDepartementController::class, 'show']);
Route::delete('/employe-departements/{employeDepartement}', [EmployeDepartementController::class, 'destroy']);
Route::put('/employe-departements/update', [EmployeDepartementController::class, 'updateOrCreate']);

// Route::get('/employee-history', [EmployeDepartementController::class, 'getEmployeeHistory']);
// Route::get('departements/hierarchy', [DepartementController::class, 'getHierarchy']);

Route::get('/contrats', [ContratController::class, 'index']);
Route::post('/contrats', [ContratController::class, 'store']);
Route::get('/contrats/{id}', [ContratController::class, 'show']);
Route::put('/contrats/{id}', [ContratController::class, 'update']);
Route::delete('/contrats/{id}', [ContratController::class, 'destroy']);
// Route::get('/employes/{employeId}/contrats', [ContratController::class, 'getContratsByEmploye']);
Route::get('/employes/{id}/contrats', [ContratController::class, 'getContratsByEmploye']);


Route::get('/contract-types', [ContractTypeController::class, 'index']);
Route::post('/contract-types', [ContractTypeController::class, 'store']);
Route::put('/contract-types/{id}', [ContractTypeController::class, 'update']);
Route::delete('/contract-types/{id}', [ContractTypeController::class, 'destroy']);


Route::apiResource('/group-motifs', GroupMotifAbsenceController::class);


Route::apiResource('detail-motif-absences', DetailMotifAbsenceController::class);

Route::get('/detail-motif-absences', [DetailMotifAbsenceController::class, 'index'])
    ->name('detail-motif-absences.index');


    Route::get('/jour-feries/type-options', [JourFeriesController::class, 'getTypeOptions']);
    Route::resource('jour-feries', JourFeriesController::class);

    Route::apiResource('/absencePrevisionnel', AbsencePrevisionnelController::class);
    Route::get('/absencePrevisionnel/employee/{employeeId}', [AbsencePrevisionnelController::class, 'getAbsencesByEmployee']);

    Route::get('/horaires', [HoraireController::class, 'index']);
    Route::post('/horaires', [HoraireController::class, 'store']);
    Route::put('/horaires/{id}', [HoraireController::class, 'update']);
    Route::delete('/horaires/{id}', [HoraireController::class, 'destroy']);
    
    Route::apiResource('/groupes-horaires', GroupeHoraireController::class);


    

Route::apiResource('horaires-periodiques', HorairePeriodiqueController::class);
Route::apiResource('details-periodiques', DetailsPeriodiqueController::class);


Route::apiResource('details-calendrie', DetailsCalendrieController::class);
// Route::apiResource('calendrie', CalendrieController::class);
Route::apiResource('regle-compensations', RegleCompensationController::class);
Route::apiResource('penalites', PenaliteController::class);
// Route::apiResource('details-regles', DetailsRegleController::class);
Route::apiResource('arrondis', ArrondiController::class);

Route::apiResource('parametres', ParametreBaseController::class);
Route::apiResource('details-regles', DetailsRegleController::class);
Route::apiResource('heures-travail', HeureTravailController::class);


Route::apiResource('horaire-exceptionnel', HoraireExceptionnelController::class);


});


  