import { Head, useForm } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function GuestOtp({ errors }: { errors?: Record<string, string> }) {
    const { data, setData, post, processing, errors: formErrors } = useForm({ code: '' });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/guest/otp');
    }

    return (
        <AuthLayout
            title="Check your email"
            description="Enter the 6-digit code we sent to your email address"
        >
            <Head title="Guest Verification" />

            <div className="flex flex-col items-center gap-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <MailCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full">
                    <InputOTP
                        maxLength={6}
                        value={data.code}
                        onChange={(value) => setData('code', value)}
                    >
                        <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>

                    {(formErrors.code || errors?.code) && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {formErrors.code || errors?.code}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={processing || data.code.length < 6}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                    >
                        {processing && <Spinner />}
                        Verify & Log In
                    </button>
                </form>

                <a
                    href="/guest/lookup"
                    className="text-sm font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                    Back to lookup
                </a>
            </div>
        </AuthLayout>
    );
}
