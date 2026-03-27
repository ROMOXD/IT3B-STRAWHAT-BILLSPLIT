<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnforceGuestAccessExpiry
{
    public function handle(Request $request, Closure $next): Response
    {
        // Guest access expiry is now handled via session token in GuestController.
        // This middleware only applies to authenticated (registered) users.
        return $next($request);
    }
}
