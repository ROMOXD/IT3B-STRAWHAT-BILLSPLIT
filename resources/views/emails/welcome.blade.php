@component('mail::message')
# 🎉 Welcome to SplitBill, {{ $user->firstname }}!

Congratulations on creating your account! We're thrilled to have you on board.

With SplitBill you can:
- Create bills and split expenses fairly with friends
- Invite registered users or guests to join your bills
- Track who paid what and how much everyone owes

Your account is set up and ready to go. Click the button below to log in and start splitting!

@component('mail::button', ['url' => $loginUrl, 'color' => 'primary'])
Log In to SplitBill
@endcomponent

If you have any questions, feel free to reach out.

Thanks,<br>
**The SplitBill Team**

---
<small>If you did not create this account, you can safely ignore this email.</small>
@endcomponent
