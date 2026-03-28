@component('mail::message')
# Reset your password, {{ $user->firstname }}!

Use the code below to reset your password. It expires in **15 minutes**.

@component('mail::panel')
# {{ $code }}
@endcomponent

If you did not request a password reset, you can safely ignore this email.

Thanks,<br>
**The SplitBill Team**
@endcomponent
