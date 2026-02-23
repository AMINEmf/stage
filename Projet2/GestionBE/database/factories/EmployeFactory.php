<?php

namespace Database\Factories;

use App\Models\Employe;
use App\Models\Departement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employe>
 */
class EmployeFactory extends Factory
{
    protected $model = Employe::class;

    /**
     * Prénoms marocains
     */
    private $prenomsHommes = [
        'Mohammed', 'Ahmed', 'Youssef', 'Omar', 'Hassan', 'Karim', 'Rachid', 'Mustapha',
        'Abdellatif', 'Brahim', 'Driss', 'Hamid', 'Khalid', 'Said', 'Nabil', 'Fouad',
        'Jamal', 'Aziz', 'Mehdi', 'Amine', 'Samir', 'Reda', 'Hicham', 'Zakaria'
    ];

    private $prenomsFemmes = [
        'Fatima', 'Khadija', 'Aicha', 'Meryem', 'Sanae', 'Laila', 'Houda', 'Sara',
        'Nadia', 'Samira', 'Zineb', 'Naima', 'Soukaina', 'Imane', 'Loubna', 'Hanane',
        'Karima', 'Malika', 'Amina', 'Ikram', 'Salma', 'Ghizlane', 'Wiame', 'Hajar'
    ];

    private $noms = [
        'Alaoui', 'Benali', 'Chakir', 'Darif', 'El Amrani', 'Fassi', 'Ghazi', 'Hajji',
        'Idrissi', 'Jaafari', 'Kadiri', 'Lamrani', 'Mazouzi', 'Naciri', 'Ouazzani',
        'Rahmani', 'Sabri', 'Tazi', 'Wahbi', 'Zniber', 'El Fassi', 'Benjelloun',
        'Berrada', 'Chaoui', 'El Khattabi', 'Filali', 'Guessous', 'Hassani'
    ];

    private $villes = [
        'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Agadir', 'Meknès',
        'Oujda', 'Kénitra', 'Tétouan', 'Salé', 'Mohammedia', 'El Jadida', 'Béni Mellal'
    ];

    private $fonctions = [
        'Développeur Web', 'Comptable', 'Technicien', 'Ingénieur', 'Commercial',
        'Assistant RH', 'Chef de projet', 'Responsable qualité', 'Opérateur',
        'Magasinier', 'Agent de sécurité', 'Secrétaire', 'Chauffeur', 'Électricien',
        'Mécanicien', 'Soudeur', 'Cariste', 'Agent d\'entretien', 'Contrôleur qualité'
    ];

    private $categories = ['A', 'B', 'C', 'D', 'E', 'Cadre', 'Employé', 'Ouvrier'];
    
    private $niveaux = ['Bac', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Doctorat'];

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $sexe = $this->faker->randomElement(['M', 'F']);
        $prenom = $sexe === 'M' 
            ? $this->faker->randomElement($this->prenomsHommes)
            : $this->faker->randomElement($this->prenomsFemmes);
        
        $nom = $this->faker->randomElement($this->noms);
        $ville = $this->faker->randomElement($this->villes);
        
        // Dates logiques
        $dateNaissance = $this->faker->dateTimeBetween('-55 years', '-22 years');
        $dateEntree = $this->faker->dateTimeBetween('-15 years', '-6 months');
        $dateEmbauche = $this->faker->dateTimeBetween($dateEntree, 'now');
        
        // Générer matricule unique
        $matricule = 'MAT' . str_pad($this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT);
        
        // Salaire basé sur la catégorie
        $salaireBase = $this->faker->randomFloat(2, 3500, 25000);
        
        return [
            'matricule' => $matricule,
            'num_badge' => 'B' . $this->faker->unique()->numberBetween(1000, 9999),
            'nom' => $nom,
            'prenom' => $prenom,
            'lieu_naiss' => $ville,
            'date_naiss' => $dateNaissance->format('Y-m-d'),
            'cin' => strtoupper($this->faker->randomLetter()) . $this->faker->unique()->numberBetween(100000, 999999),
            'cnss' => $this->faker->unique()->numberBetween(100000000, 999999999),
            'sexe' => $sexe,
            'situation_fm' => $this->faker->randomElement(['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)']),
            'nb_enfants' => $this->faker->numberBetween(0, 5),
            'adresse' => $this->faker->numberBetween(1, 200) . ' ' . $this->faker->randomElement(['Rue', 'Avenue', 'Boulevard']) . ' ' . $this->faker->lastName,
            'ville' => $ville,
            'pays' => 'Maroc',
            'code_postal' => $this->faker->numberBetween(10000, 99999),
            'tel' => '06' . $this->faker->numberBetween(10000000, 99999999),
            'fax' => null,
            'email' => strtolower($prenom) . '.' . strtolower(str_replace(' ', '', $nom)) . '@' . $this->faker->randomElement(['gmail.com', 'outlook.ma', 'hotmail.com', 'company.ma']),
            'fonction' => $this->faker->randomElement($this->fonctions),
            'nationalite' => 'Marocaine',
            'niveau' => $this->faker->randomElement($this->niveaux),
            'echelon' => $this->faker->numberBetween(1, 10),
            'categorie' => $this->faker->randomElement($this->categories),
            'coeficients' => $this->faker->randomFloat(2, 1, 2.5),
            'imputation' => $this->faker->randomElement(['Production', 'Administration', 'Commercial', 'Technique', 'Support']),
            'date_entree' => $dateEntree->format('Y-m-d'),
            'date_embauche' => $dateEmbauche->format('Y-m-d'),
            'date_sortie' => null,
            'salaire_base' => $salaireBase,
            'remarque' => $this->faker->optional(0.3)->sentence(),
            'url_img' => null,
            'centreCout' => $this->faker->randomElement(['CC01', 'CC02', 'CC03', 'CC04', 'CC05']),
            'departement_id' => Departement::inRandomOrder()->first()?->id ?? 1,
            'active' => $this->faker->boolean(85), // 85% actifs
            'bulletin_modele' => $this->faker->optional(0.5)->randomElement(['Modèle A', 'Modèle B', 'Modèle C']),
            'salaire_moyen' => $salaireBase * $this->faker->randomFloat(2, 0.9, 1.3),
            'salaire_reference_annuel' => $salaireBase * 12,
        ];
    }

    /**
     * Employé actif
     */
    public function actif(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => true,
            'date_sortie' => null,
        ]);
    }

    /**
     * Employé inactif (sorti)
     */
    public function inactif(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => false,
            'date_sortie' => $this->faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'motif_depart' => $this->faker->randomElement(['Démission', 'Licenciement', 'Fin de contrat', 'Retraite', 'Mutation']),
        ]);
    }

    /**
     * Employé cadre
     */
    public function cadre(): static
    {
        return $this->state(fn (array $attributes) => [
            'categorie' => 'Cadre',
            'niveau' => $this->faker->randomElement(['Bac+4', 'Bac+5', 'Doctorat']),
            'salaire_base' => $this->faker->randomFloat(2, 15000, 35000),
        ]);
    }
}
