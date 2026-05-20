<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'title', 'magazine_id', 'date', 'time', 'duration',
        'deadline', 'resultDate', 'total_marks', 'duration_minutes',
        'questions_count', 'status', 'prize_pool'
    ];

    protected $casts = [
        'date'     => 'date',
        'deadline' => 'date',
    ];

    public function magazine()
    {
        return $this->belongsTo(Magazine::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function results()
    {
        return $this->hasMany(UserQuizResult::class);
    }

    public function sessions()
    {
        return $this->hasMany(QuizSession::class);
    }

    /**
     * Get questions without the correct_option field (for frontend delivery)
     */
    public function questionsForFrontend()
    {
        return $this->hasMany(Question::class)->select(['id', 'quiz_id', 'question_text', 'options', 'category']);
    }
}
