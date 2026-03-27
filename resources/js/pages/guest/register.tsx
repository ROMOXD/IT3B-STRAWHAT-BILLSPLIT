import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/guest/register');
    };

    return (
        <AuthLayout
            title="Join Bill"
            description={`You've been invited to join "${bill.billname}"`}
        >
            <Head title="Join Bill" />
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3 dark:bg-indigo-900/20">
                    <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">{bill.billname}</span>
                    <span className="font-mono text-xs text-indigo-500 dark:text-indigo-400">{bill.invitation_code}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstname" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            First Name <span className="text-red-500">*</span>
                        </Label>
                        <input id="firstname" type="text" placeholder="John" value={data.firstname}
                            onChange={e => setData('firstname', e.target.value)} required autoFocus className={inputClass} />
                        <InputError message={errors.firstname} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastname" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Last Name <span className="text-red-500">*</span>
                        </Label>
                        <input id="lastname" type="text" placeholder="Doe" value={data.lastname}
                            onChange={e => setData('lastname', e.target.value)} required className={inputClass} />
                        <InputError message={errors.lastname} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email address <span className="text-red-500">*</span>
                    </Label>
                    <input id="email" type="email" placeholder="email@example.com" value={data.email}
                        onChange={e => setData('email', e.target.value)} required className={inputClass} />
                    <InputError message={errors.email} />
                </div>

                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    Guest access is valid for 6 hours. You can register a full account anytime from the bill view.
                </p>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                >
                    {processing && <Spinner />}
                    Join Bill
                </button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{' '}
                    <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                        Log in
                    </a>
                </p>
            </form>
        </AuthLayout>
    );
}
