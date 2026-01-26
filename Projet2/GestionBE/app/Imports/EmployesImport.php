<?php 

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Collection;
use App\Models\Employe;
use Illuminate\Support\Carbon;

class EmployesImport implements ToCollection
{
    protected $fieldMappings;
    protected $departementId;

    public function __construct(array $fieldMappings, $departementId)
    {
        $this->fieldMappings = $fieldMappings;
        $this->departementId = $departementId;
    }

    private function excelColumnLetterToIndex(string $letter): int
    {
        $letter = strtoupper($letter);
        $index = 0;
        $length = strlen($letter);

        for ($i = 0; $i < $length; $i++) {
            $index *= 26;
            $index += ord($letter[$i]) - ord('A') + 1;
        }

        return $index - 1;
    }

    public function collection(Collection $rows)
    {
        $rows->shift();
        foreach ($rows as $row) {
            $data = [];

            foreach ($this->fieldMappings as $field => $colLetter) {
                $colIndex = $this->excelColumnLetterToIndex($colLetter);
                $data[$field] = $row[$colIndex] ?? null;
            }

            if (!empty($data['date_naiss'])) {
                try {
                    $data['date_naiss'] = Carbon::parse($data['date_naiss']);
                } catch (\Exception $e) {
                    $data['date_naiss'] = null;
                }
            }

            $data['departement_id'] = $this->departementId;

            \Log::info('Données importées:', $data);

            Employe::create($data);
        }
    }
}
