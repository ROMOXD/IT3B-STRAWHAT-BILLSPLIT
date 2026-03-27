import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot your password?"
            description="Enter your email and we'll send you a reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {status}
                </div>
            )}

            <Form {...email.form()} className="flex flex-col gap-5">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </Label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="off"
                                autoFocus
                                placeholder="email@example.com"
                                className={inputClass}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                        >
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Send reset link
                        </button>

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            Remember your password?{' '}
                            <a href={login.url()} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                Log in
                            </a>
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
