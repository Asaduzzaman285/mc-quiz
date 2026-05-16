<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Quiz;
use App\Models\Question;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        $quiz = Quiz::create([
            'title' => 'MCQuiz April 2026 — Monthly Challenge',
            'date' => '2026-04-30',
            'time' => '11:59 PM',
            'duration' => 3,
            'questions_count' => 12,
            'prize_pool' => 15000,
            'status' => 'upcoming',
        ]);

        $questions = [
            ['question' => 'Bangladesh became a member of the United Nations in which year?', 'options' => ['1972', '1973', '1974', '1975'], 'correct' => 2, 'category' => 'Bangladesh Affairs'],
            ['question' => 'Who is the Father of the Nation of Bangladesh?', 'options' => ['Ziaur Rahman', 'A. K. Fazlul Huq', 'Sheikh Mujibur Rahman', 'H. M. Ershad'], 'correct' => 2, 'category' => 'History'],
            ['question' => 'What is the national flower of Bangladesh?', 'options' => ['Rose', 'Lotus', 'Water Lily (Shapla)', 'Sunflower'], 'correct' => 2, 'category' => 'General Knowledge'],
            ['question' => 'The Sundarbans mangrove forest is shared between Bangladesh and which country?', 'options' => ['Myanmar', 'India', 'Nepal', 'Bhutan'], 'correct' => 1, 'category' => 'Environment'],
            ['question' => 'Which river is formed by the confluence of the Ganges and Brahmaputra?', 'options' => ['Meghna', 'Surma', 'Karnaphuli', 'Jamuna'], 'correct' => 0, 'category' => 'Geography'],
            ['question' => 'In which year was the Language Movement (Bhasha Andolon) in Bangladesh?', 'options' => ['1950', '1951', '1952', '1953'], 'correct' => 2, 'category' => 'History'],
            ['question' => "Bangladesh's Liberation War was fought in which year?", 'options' => ['1969', '1970', '1971', '1972'], 'correct' => 2, 'category' => 'History'],
            ['question' => 'What is the national animal of Bangladesh?', 'options' => ['Lion', 'Elephant', 'Bengal Tiger', 'Deer'], 'correct' => 2, 'category' => 'General Knowledge'],
            ['question' => 'Which is the longest river in Bangladesh?', 'options' => ['Meghna', 'Padma', 'Jamuna (Brahmaputra)', 'Surma'], 'correct' => 2, 'category' => 'Geography'],
            ['question' => 'What is the official language of Bangladesh?', 'options' => ['Hindi', 'Urdu', 'Bengali (Bangla)', 'Arabic'], 'correct' => 2, 'category' => 'General Knowledge'],
            ['question' => 'The International Mother Language Day is celebrated on?', 'options' => ['February 20', 'February 21', 'February 22', 'March 7'], 'correct' => 1, 'category' => 'International'],
            ['question' => 'Who is the current Secretary-General of the United Nations (as of 2026)?', 'options' => ['Ban Ki-moon', 'Kofi Annan', 'António Guterres', 'Boutros Ghali'], 'correct' => 2, 'category' => 'International'],
        ];

        foreach ($questions as $q) {
            Question::create([
                'quiz_id' => $quiz->id,
                'question_text' => $q['question'],
                'options' => $q['options'],
                'correct_option' => $q['correct'],
                'category' => $q['category'],
            ]);
        }
    }
}
