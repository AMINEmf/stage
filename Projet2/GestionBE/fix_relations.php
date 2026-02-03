<?php

use App\Models\Employe;

$employes = Employe::whereNotNull('departement_id')->get();
echo "Found " . $employes->count() . " employees with departement_id\n";

foreach($employes as $emp) {
    if($emp->departements()->count() == 0) {
        $emp->departements()->attach($emp->departement_id);
        echo "Attached Dept " . $emp->departement_id . " to Emp " . $emp->id . "\n";
    }
}
echo "Done.\n";
