<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MagazineController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\LeaderboardController;

Route::group([
    'prefix' => 'v1'
], function(){
    Route::post('login', [AuthController::class, 'login'])->name('login')->middleware("throttle:30,5");
    Route::post('signup', [AuthController::class, 'signup']);
});

Route::group([
    'prefix' => 'v1',
    'middleware' => 'auth:api',
], function () {
    Route::post('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('profileUpdate', [AuthController::class, 'profileUpdate']);

    // Magazines
    Route::get('magazines', [MagazineController::class, 'index']);
    Route::get('magazines/{id}', [MagazineController::class, 'show']);
    Route::post('magazines/{id}/purchase', [MagazineController::class, 'purchase']);

    // Quizzes
    Route::get('quizzes', [QuizController::class, 'index']);
    Route::get('quizzes/{id}', [QuizController::class, 'show']);
    Route::get('active-quiz', [QuizController::class, 'activeQuiz']);
    Route::post('quizzes/{id}/submit', [QuizController::class, 'submit']);

    // Leaderboard
    Route::get('leaderboard', [LeaderboardController::class, 'index']);

    // Roles & Permissions
    Route::get('role/getAllRoles', [\App\Http\Controllers\PermissionController::class, 'getAllRoles']);
    Route::get('role/getRole/{id}', [\App\Http\Controllers\PermissionController::class, 'getRole']);
    Route::get('permission/getAllpermissions', [\App\Http\Controllers\PermissionController::class, 'getAllPermissions']);
    
    // Common Support Data
    Route::match(['get', 'post'], 'supportdata', [\App\Http\Controllers\CommonController::class, 'supportData']);

    // Admin Routes
    Route::group(['prefix' => 'admin', 'middleware' => function ($request, $next) {
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Forbidden. Admin access required.'], 403);
        }
        return $next($request);
    }], function() {
        // Magazine Admin
        Route::post('magazines', [MagazineController::class, 'store']);
        Route::post('magazines/{id}/upload', [MagazineController::class, 'uploadFile']);
        
        // Quiz Admin
        Route::post('quizzes', [QuizController::class, 'store']);
        Route::post('quizzes/{id}/upload-questions', [QuizController::class, 'uploadQuestions']);

        // User Management
        Route::get('users', [AuthController::class, 'userList']);
    });
});
