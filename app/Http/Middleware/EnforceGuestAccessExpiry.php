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
        $user = Auth::user();

        if ($user && $user->usertype === 'guest') {
            if ($user->guest_access_expires_at && now()->isAfter($user->guest_access_expires_at)) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('guest.lookup')
                    ->withErrors(['access' => 'Your guest access has expired. Please use your invitation code again.']);
            }
        }

        return $next($request);
    }
}
