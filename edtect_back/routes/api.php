<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MagazineController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\LeaderboardController;

// ── Public routes ─────────────────────────────────────────────────────────────
Route::group(['prefix' => 'v1'], function () {
    Route::post('login',  [AuthController::class, 'login'])->middleware('throttle:30,5');
    Route::post('signup', [AuthController::class, 'signup']);
});

// ── Authenticated routes ──────────────────────────────────────────────────────
Route::group(['prefix' => 'v1', 'middleware' => 'auth:api'], function () {

    // Auth
    Route::post('me',            [AuthController::class, 'me']);
    Route::post('logout',        [AuthController::class, 'logout']);
    Route::post('profileUpdate', [AuthController::class, 'profileUpdate']);

    // Magazines
    Route::get('magazines',                [MagazineController::class, 'index']);
    Route::get('magazines/{id}',           [MagazineController::class, 'show']);
    Route::post('magazines/{id}/purchase', [MagazineController::class, 'purchase']);
    Route::get('magazines/{id}/download',  [\App\Http\Controllers\DownloadController::class, 'magazine']);

    // Quizzes — public (authenticated)
    Route::get('quizzes',              [QuizController::class, 'index']);
    Route::get('quizzes/{id}',         [QuizController::class, 'show']);
    Route::get('active-quiz',          [QuizController::class, 'activeQuiz']);

    // Quiz engine — session-based
    Route::post('quiz/start',          [QuizController::class, 'start']);
    Route::post('quiz/submit',         [QuizController::class, 'submit']);

    // Legacy submit (backward compat)
    Route::post('quizzes/{id}/submit', [QuizController::class, 'submitLegacy']);

    // Leaderboard
    Route::get('leaderboard',                    [LeaderboardController::class, 'index']);
    Route::get('quizzes/{quizId}/leaderboard',   [QuizController::class, 'leaderboard']);

    // Roles & Permissions
    Route::get('role/getAllRoles',              [\App\Http\Controllers\PermissionController::class, 'getAllRoles']);
    Route::post('role/getAllRoles',             [\App\Http\Controllers\PermissionController::class, 'getAllRoles']);
    Route::get('role/getRole/{id}',            [\App\Http\Controllers\PermissionController::class, 'getRole']);
    Route::post('role/getRole',                [\App\Http\Controllers\PermissionController::class, 'getRole']);
    Route::get('permission/getAllpermissions', [\App\Http\Controllers\PermissionController::class, 'getAllPermissions']);

    // Support data (for admin panel filters)
    Route::match(['get', 'post'], 'supportdata', [\App\Http\Controllers\CommonController::class, 'supportData']);

    // ── Admin routes ──────────────────────────────────────────────────────────
    Route::group(['prefix' => 'admin', 'middleware' => 'admin'], function () {

        // Magazine admin
        Route::post('magazines',                    [MagazineController::class, 'store']);
        Route::post('magazines/{id}/upload',        [MagazineController::class, 'uploadFile']);

        // Quiz admin
        Route::post('quizzes',                      [QuizController::class, 'store']);
        Route::post('quizzes/{id}/upload-questions',[QuizController::class, 'uploadQuestions']);

        // User management
        Route::get('users',                         [AuthController::class, 'userList']);

        // Purchases / Transactions
        Route::get('purchases',                     [\App\Http\Controllers\PurchaseController::class, 'index']);

        // Stats dashboard
        Route::get('stats',                         [\App\Http\Controllers\CommonController::class, 'adminStats']);
    });
});
