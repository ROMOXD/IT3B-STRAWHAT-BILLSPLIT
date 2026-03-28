@component('mail::message')
# Verify your email, {{ $user->firstname }}!

Use the code below to verify your email address. It expires in **15 minutes**.

@component('mail::panel')
# {{ $code }}
@endcomponent

If you did not create an account, you can safely ignore this email.

Thanks,<br>
**The SplitBill Team**
@endcomponent
