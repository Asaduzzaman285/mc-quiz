<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Magazine extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'month', 'title', 'price', 'pages', 'topics', 'featured', 'color', 'pdf_path', 'image'
    ];

    protected $casts = [
        'topics' => 'array',
        'featured' => 'boolean',
    ];

    public function quiz()
    {
        return $this->hasOne(Quiz::class);
    }

    public function purchases()
    {
        return $this->hasMany(MagazinePurchase::class);
    }
}
