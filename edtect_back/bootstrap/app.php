<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'CheckPermission' => \App\Http\Middleware\CheckPermission::class,
            'admin'           => \App\Http\Middleware\EnsureAdmin::class,
        ]);
        // Ensure API requests return 401 instead of redirecting
        $middleware->redirectTo(function ($request) {
            if ($request->is('api/*')) {
                return null;
            }
            return route('login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Optional: Force JSON for API exceptions if Accept header is missing
    })->create();
