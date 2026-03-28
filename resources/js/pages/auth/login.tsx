import { Form, Head } from '@inertiajs/react';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    return (
        <AuthLayout
            title="Welcome back"
            description="Log in to your SplitBill account"
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {status}
                </div>
            )}

            <Form {...store.form()} resetOnSuccess={['password']} noValidate className="flex flex-col gap-5">
                {({ processing, errors }) => (
                    <>
                        {(errors.email || errors.password) && (
                            <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                {errors.email?.toLowerCase().includes('too many')
                                    ? errors.email
                                    : 'Invalid email or password.'}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </Label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                title="Please enter your email address"
                                className={inputClass}
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </Label>
                                {canResetPassword && (
                                    <a href={request.url()} tabIndex={5} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        Forgot password?
                                    </a>
                                )}
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                title="Please enter your password"
                                inputClassName={inputClass}
                            />
                        </div>

                        <button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                        >
                            {processing && <Spinner />}
                            Log in
                        </button>

                        {canRegister && (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                Don't have an account?{' '}
                                <a href={register.url()} tabIndex={5} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                    Sign up
                                </a>
                            </p>
                        )}
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
