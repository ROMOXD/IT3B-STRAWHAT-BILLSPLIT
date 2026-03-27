<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    protected function profileRules(?int $userId = null): array
    {
        return [
            'firstname' => ['required', 'string', 'max:255', 'regex:/^\S.*$/'],
            'lastname'  => ['required', 'string', 'max:255', 'regex:/^\S.*$/'],
            'nickname'  => ['required', 'string', 'max:255', 'regex:/^\S.*$/',
                $userId === null
                    ? Rule::unique(User::class, 'nickname')
                    : Rule::unique(User::class, 'nickname')->ignore($userId),
            ],
            'email'     => ['required', 'string', 'email', 'max:255',
                $userId === null
                    ? Rule::unique(User::class)
                    : Rule::unique(User::class)->ignore($userId),
            ],
        ];
    }
}
