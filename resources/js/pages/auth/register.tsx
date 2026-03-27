import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

export default function Register() {
    return (
        <AuthLayout
            title="Create an account"
            description="Join SplitBill and start splitting expenses fairly"
        >
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstname" className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</Label>
                                <input id="firstname" type="text" name="firstname" required autoFocus tabIndex={1}
                                    autoComplete="given-name" placeholder="John" className={inputClass} />
                                <InputError message={errors.firstname} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastname" className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</Label>
                                <input id="lastname" type="text" name="lastname" required tabIndex={2}
                                    autoComplete="family-name" placeholder="Doe" className={inputClass} />
                                <InputError message={errors.lastname} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nickname" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nickname <span className="text-red-500">*</span>
                            </Label>
                            <input id="nickname" type="text" name="nickname" required tabIndex={3}
                                placeholder="Must be unique" className={inputClass} />
                            <InputError message={errors.nickname} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Username <span className="text-red-500">*</span>
                            </Label>
                            <input id="username" type="text" name="username" required tabIndex={4}
                                autoComplete="username" placeholder="johndoe123" className={inputClass} />
                            <InputError message={errors.username} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address <span className="text-red-500">*</span>
                            </Label>
                            <input id="email" type="email" name="email" required tabIndex={5}
                                autoComplete="email" placeholder="email@example.com" className={inputClass} />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password <span className="text-red-500">*</span>
                            </Label>
                            <PasswordInput id="password" name="password" required tabIndex={6}
                                autoComplete="new-password" placeholder="Password" inputClassName={inputClass} />
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                8–16 characters · uppercase · lowercase · number · special character
                            </p>
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confirm password <span className="text-red-500">*</span>
                            </Label>
                            <PasswordInput id="password_confirmation" name="password_confirmation" required tabIndex={7}
                                autoComplete="new-password" placeholder="Confirm password" inputClassName={inputClass} />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <button
                            type="submit"
                            tabIndex={8}
                            data-test="register-user-button"
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                        >
                            {processing && <Spinner />}
                            Create account
                        </button>

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            Already have an account?{' '}
                            <a href={login.url()} tabIndex={9} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                Log in
                            </a>
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
