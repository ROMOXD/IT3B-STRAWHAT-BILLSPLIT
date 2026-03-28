import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { AlertCircle } from 'lucide-react';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

export default function GuestLookup({ errors: pageErrors }: { errors?: Record<string, string> }) {
    const [tab, setTab] = useState<'new' | 'returning'>('new');

    const newForm = useForm({ code: '' });
    const returningForm = useForm({ email: '' });

    const handleNew = (e: React.FormEvent) => {
        e.preventDefault();
        newForm.post('/guest/lookup');
    };

    const handleReturning = (e: React.FormEvent) => {
        e.preventDefault();
        returningForm.post('/guest/login');
    };

    const accessError = pageErrors?.access;

    return (
        <AuthLayout
            title="Access a Bill"
            description={tab === 'new' ? 'Enter the invitation code shared with you' : 'Log in with your guest email'}
        >
            <Head title="Guest Access" />

            {accessError && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{accessError}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-5 flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                {(['new', 'returning'] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                            tab === t
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        {t === 'new' ? 'New Guest' : 'Returning Guest'}
                    </button>
                ))}
            </div>

            {tab === 'new' ? (
                <form onSubmit={handleNew} noValidate className="flex flex-col gap-5">
                    {Object.values(newForm.errors).filter(Boolean)[0] && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {Object.values(newForm.errors).filter(Boolean)[0]}
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Invitation Code <span className="text-red-500">*</span>
                        </Label>
                        <input
                            id="code"
                            type="text"
                            placeholder="e.g., ABCD1234"
                            value={newForm.data.code}
                            onChange={e => newForm.setData('code', e.target.value.toUpperCase())}
                            required
                            autoFocus
                            className={`${inputClass} font-mono tracking-widest uppercase`}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={newForm.processing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                    >
                        {newForm.processing && <Spinner />}
                        Access Bill
                    </button>
                </form>
            ) : (
                <form onSubmit={handleReturning} noValidate className="flex flex-col gap-5">
                    {Object.values(returningForm.errors).filter(Boolean)[0] && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {Object.values(returningForm.errors).filter(Boolean)[0]}
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address <span className="text-red-500">*</span>
                        </Label>
                        <input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={returningForm.data.email}
                            onChange={e => returningForm.setData('email', e.target.value)}
                            required
                            autoFocus
                            className={inputClass}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={returningForm.processing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                    >
                        {returningForm.processing && <Spinner />}
                        Log In as Guest
                    </button>
                </form>
            )}

            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Have an account?{' '}
                <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    Log in
                </a>
            </p>
        </AuthLayout>
    );
}
