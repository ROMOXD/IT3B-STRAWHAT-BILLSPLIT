import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

type Props = { step: 'email' | 'otp' | 'password'; email?: string };

export default function ForgotPassword({ step, email }: Props) {
    const sendForm   = useForm({ email: email ?? '' });
    const verifyForm = useForm({ email: email ?? '', code: '' });
    const resetForm  = useForm({ email: email ?? '', password: '', password_confirmation: '' });
    const [currentStep, setCurrentStep] = useState(step);

    useEffect(() => {
        setCurrentStep(step);
    }, [step]);

    useEffect(() => {
        sendForm.setData('email', email ?? '');
        verifyForm.setData('email', email ?? '');
        resetForm.setData('email', email ?? '');
    }, [email]);

    const titles = {
        email:    { title: 'Forgot your password?',  description: "Enter your email and we'll send you a reset code" },
        otp:      { title: 'Check your email',        description: 'Enter the 6-digit code we sent to your email' },
        password: { title: 'Set a new password',      description: 'Choose a strong password for your account' },
    };

    function submitSendCode(e: React.FormEvent) {
        e.preventDefault();

        sendForm.post('/password/code/send', {
            onSuccess: () => {
                setCurrentStep('otp');
                verifyForm.setData('email', sendForm.data.email);
            },
        });
    }

    function submitVerifyCode(e: React.FormEvent) {
        e.preventDefault();

        verifyForm.post('/password/code/verify', {
            onSuccess: () => {
                setCurrentStep('password');
                resetForm.setData('email', verifyForm.data.email);
            },
        });
    }

    function cancelOtp() {
        verifyForm.post('/password/code/cancel', {
            onSuccess: () => {
                setCurrentStep('email');
                sendForm.reset();
                verifyForm.reset();
                resetForm.reset();
            },
        });
    }

    return (
        <AuthLayout title={titles[currentStep].title} description={titles[currentStep].description}>
            <Head title="Forgot password" />

            {currentStep === 'email' && (
                <form onSubmit={submitSendCode} noValidate className="flex flex-col gap-5">
                    {sendForm.errors.email && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{sendForm.errors.email}</div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email address
                        </Label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="off"
                            autoFocus
                            required
                            placeholder="email@example.com"
                            value={sendForm.data.email}
                            onChange={(e) => sendForm.setData('email', e.target.value)}
                            title="Please enter your email address"
                            className={inputClass}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={sendForm.processing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                    >
                        {sendForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Send reset code
                    </button>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Remember your password?{' '}
                        <a href={login.url()} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                            Log in
                        </a>
                    </p>
                </form>
            )}

            {currentStep === 'otp' && (
                <form onSubmit={submitVerifyCode} noValidate className="flex flex-col items-center gap-5">
                    <p className="text-sm text-muted-foreground">
                        Code sent to <span className="font-medium text-foreground">{email}</span>
                    </p>

                    <InputOTP
                        maxLength={6}
                        value={verifyForm.data.code}
                        onChange={(value) => verifyForm.setData('code', value)}
                    >
                        <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                    <InputError message={verifyForm.errors.code} />

                    <button
                        type="submit"
                        disabled={verifyForm.processing || verifyForm.data.code.length < 6}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                    >
                        {verifyForm.processing && <Spinner />}
                        Verify email
                    </button>

                    <button
                        type="button"
                        disabled={sendForm.processing}
                        onClick={() => sendForm.post('/password/code/send')}
                        className="text-sm font-medium text-muted-foreground hover:text-indigo-600 disabled:opacity-60"
                    >
                        {sendForm.processing ? 'Sending…' : 'Resend code'}
                    </button>

                    <button
                        type="button"
                        onClick={cancelOtp}
                        className="text-sm font-medium text-muted-foreground hover:text-red-500 disabled:opacity-60"
                    >
                        Use a different email
                    </button>
                </form>
            )}

            {currentStep === 'password' && (
                <form onSubmit={(e) => { e.preventDefault(); resetForm.post('/password/code/reset'); }} noValidate className="flex flex-col gap-5">
                    {Object.values(resetForm.errors).filter(Boolean)[0] && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {Object.values(resetForm.errors).filter(Boolean)[0]}
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="new-password"
                            autoFocus
                            required
                            placeholder="Password"
                            value={resetForm.data.password}
                            onChange={(e) => resetForm.setData('password', e.target.value)}
                            title="Please enter a new password"
                            inputClassName={inputClass}
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            8–16 characters · uppercase · lowercase · number
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm new password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            autoComplete="new-password"
                            required
                            placeholder="Confirm password"
                            value={resetForm.data.password_confirmation}
                            onChange={(e) => resetForm.setData('password_confirmation', e.target.value)}
                            title="Please confirm your new password"
                            inputClassName={inputClass}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={resetForm.processing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                    >
                        {resetForm.processing && <Spinner />}
                        Reset password
                    </button>
                </form>
            )}
        </AuthLayout>
    );
}
