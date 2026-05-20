<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!auth()->check() || !auth()->user()->hasRole('admin')) {
            return response()->json([
                'status'  => 'failed',
                'code'    => 403,
                'data'    => null,
                'message' => ['Forbidden. Admin access required.'],
                'errors'  => null,
            ], 200);
        }

        return $next($request);
    }
}
