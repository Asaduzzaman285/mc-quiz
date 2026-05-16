<?php

namespace App\Models;

use Laravel\Passport\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable {
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $table = 'users';

    /**
    * The attributes that are mass assignable.
    *
    * @var array
    */
    protected $fillable = [
        'name', 'email', 'password', 'status', 'force_password', 'phone', 'avatar', 'division', 'district', 'subscription_status', 'subscription_expiry', 'joining_date'
    ];

    /**
    * The attributes that should be hidden for arrays.
    *
    * @var array
    */
    protected $hidden = [
        'password', 'remember_token', 'pivot'
    ];

    /**
    * The attributes that should be cast to native types.
    *
    * @var array
    */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'status' => 'integer',
        'subscription_expiry' => 'date',
    ];

    public function setStatusAttribute( $value ) {
        $this->attributes[ 'status' ] = $value ?? '1';
    }

    public function quizResults() {
        return $this->hasMany(UserQuizResult::class);
    }

    public function magazinePurchases() {
        return $this->hasMany(MagazinePurchase::class);
    }
}
