<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function create(array $input): User
    {
        Validator::make($input, [
            'firstname'  => ['required', 'string', 'max:255', 'regex:/^\S.*\S$|^\S$/'],
            'lastname'   => ['required', 'string', 'max:255', 'regex:/^\S.*\S$|^\S$/'],
            'nickname'   => ['required', 'string', 'max:255', 'regex:/^\S.*\S$|^\S$/', Rule::unique('users', 'nickname')],
            'username'   => ['required', 'string', 'max:255', 'regex:/^\S.*\S$|^\S$/', Rule::unique('users', 'username')],
            'email'      => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password'   => $this->passwordRules(),
        ])->validate();

        return User::create([
            'firstname' => $input['firstname'],
            'lastname'  => $input['lastname'],
            'nickname'  => $input['nickname'],
            'username'  => $input['username'],
            'email'     => $input['email'],
            'password'  => Hash::make($input['password']),
            'usertype'  => 'standard',
        ]);
    }
}