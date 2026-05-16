<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Magazine;

class MagazineSeeder extends Seeder
{
    public function run(): void
    {
        $magazines = [
            [
                'name' => 'MCQuiz April 2026',
                'month' => 'April 2026',
                'title' => 'Current Affairs & International Events',
                'price' => 50,
                'pages' => 200,
                'topics' => ['Bangladesh Affairs', 'International Events', 'BCS Special', 'Science & Tech', 'Geography', 'History'],
                'featured' => true,
                'color' => '#7C6FFF',
                'questions_count' => 200,
            ],
            [
                'name' => 'MCQuiz March 2026',
                'month' => 'March 2026',
                'title' => 'Current Affairs & International Events',
                'price' => 50,
                'pages' => 200,
                'topics' => ['Bangladesh Affairs', 'International Events', 'BCS Special', 'Economics', 'Environment'],
                'featured' => false,
                'color' => '#4F9CF9',
                'questions_count' => 200,
            ],
        ];

        foreach ($magazines as $magazine) {
            Magazine::create($magazine);
        }
    }
}
