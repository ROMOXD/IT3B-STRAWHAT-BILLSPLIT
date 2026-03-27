import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { AlertCircle } from 'lucide-react';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

export default function GuestLookup({ errors: pageErrors }: { errors?: Record<string, string> }) {
    const { data, setData, post, processing, errors } = useForm({ code: '', email: '' });
    const [isReturning, setIsReturning] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/guest/lookup');
    };

    const accessError = pageErrors?.access || errors.access;

    return (
        <AuthLayout
            title="Access a Bill"
            description="Enter the invitation code shared with you"
        >
            <Head title="Guest Access" />

            {/* Session-level access expired error */}
            {accessError && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{accessError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Invitation Code <span className="text-red-500">*</span>
                    </Label>
                    <input
                        id="code"
                        type="text"
                        placeholder="e.g., ABCD1234"
                        value={data.code}
                        onChange={e => setData('code', e.target.value.toUpperCase())}
                        required
                        autoFocus
                        className={`${inputClass} font-mono tracking-widest uppercase`}
                    />
                    <InputError message={errors.code} />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                >
                    {processing && <Spinner />}
                    Access Bill
                </button>

                {/* Returning guest section */}
                <div className="relative flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">returning guest?</span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>

                {!isReturning ? (
                    <button
                        type="button"
                        onClick={() => setIsReturning(true)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                    >
                        Enter email to skip registration
                    </button>
                ) : (
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Your email address
                        </Label>
                        <input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            autoFocus
                            className={inputClass}
                        />
                        <InputError message={errors.email} />
                    </div>
                )}

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Have an account?{' '}
                    <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                        Log in
                    </a>
                </p>
            </form>
        </AuthLayout>
    );
}
