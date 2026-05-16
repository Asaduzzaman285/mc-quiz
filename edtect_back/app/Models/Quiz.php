<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'magazine_id', 'date', 'deadline', 'resultDate', 'total_marks', 'duration_minutes'
    ];

    protected $casts = [
        'date' => 'date',
        'deadline' => 'date',
    ];

    public function magazine()
    {
        return $this->belongsTo(Magazine::class);
    }

    public function questions() {
        return $this->hasMany(Question::class);
    }

    public function results() {
        return $this->hasMany(UserQuizResult::class);
    }
}
