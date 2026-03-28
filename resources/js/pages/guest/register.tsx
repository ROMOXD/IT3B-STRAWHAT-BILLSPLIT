import { Head, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

interface Bill { id: number; billname: string; invitation_code: string; }

export default function GuestRegister({ bill, prefill_email = '' }: { bill: Bill; prefill_email?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        firstname:       '',
        lastname:        '',
        email:           prefill_email,
        invitation_code: bill.invitation_code,
    });

    const returningForm = useForm({
        email:           '',
        invitation_code: bill.invitation_code,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/guest/register');
    };

    const handleReturning = (e: React.FormEvent) => {
        e.preventDefault();
        returningForm.post('/guest/lookup');
    };

    return (
        <AuthLayout
            title="Join Bill"
            description={`You've been invited to join "${bill.billname}"`}
        >
            <Head title="Join Bill" />
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3 dark:bg-indigo-900/20">
                    <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">{bill.billname}</span>
                    <span className="font-mono text-xs text-indigo-500 dark:text-indigo-400">{bill.invitation_code}</span>
                </div>

                {Object.values(errors).filter(Boolean)[0] && (
                    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        {Object.values(errors).filter(Boolean)[0]}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstname" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            First Name <span className="text-red-500">*</span>
                        </Label>
                        <input id="firstname" type="text" placeholder="John" value={data.firstname}
                            onChange={e => setData('firstname', e.target.value)} required autoFocus title="Please enter your first name" className={inputClass} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastname" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Last Name <span className="text-red-500">*</span>
                        </Label>
                        <input id="lastname" type="text" placeholder="Doe" value={data.lastname}
                            onChange={e => setData('lastname', e.target.value)} required title="Please enter your last name" className={inputClass} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email address <span className="text-red-500">*</span>
                    </Label>
                    <input id="email" type="email" placeholder="email@example.com" value={data.email}
                        onChange={e => setData('email', e.target.value)} required title="Please enter your email address" className={inputClass} />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                >
                    {processing && <Spinner />}
                    Join Bill
                </button>
            </form>

            {/* Returning guest */}
            <div className="mt-4">
                <div className="relative flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">returning guest?</span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>
                <form onSubmit={handleReturning} noValidate className="mt-4 flex flex-col gap-3">
                    <input type="hidden" value={returningForm.data.invitation_code} />
                    {returningForm.errors.email && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {returningForm.errors.email}
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="returning_email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your email address
                        </Label>
                        <input
                            id="returning_email"
                            type="email"
                            placeholder="email@example.com"
                            value={returningForm.data.email}
                            onChange={e => returningForm.setData('email', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={returningForm.processing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-60 dark:border-gray-600 dark:text-gray-400"
                    >
                        {returningForm.processing && <Spinner />}
                        Access as returning guest
                    </button>
                </form>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    Log in
                </a>
            </p>
        </AuthLayout>
    );
}
