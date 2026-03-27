import { Form, Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Check your email"
            description="Please verify your email address to continue"
        >
            <Head title="Email verification" />

            <div className="flex flex-col items-center gap-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <MailCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <p className="text-sm text-muted-foreground">
                    We sent a verification link to your email address. Click the link to activate your account.
                </p>

                {status === 'verification-link-sent' && (
                    <div className="w-full rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        A new verification link has been sent to your email address.
                    </div>
                )}

                <Form {...send.form()} className="w-full">
                    {({ processing }) => (
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 dark:focus:ring-indigo-800"
                        >
                            {processing && <Spinner />}
                            Resend verification email
                        </button>
                    )}
                </Form>

                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="text-sm font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                    Log out
                </button>
            </div>
        </AuthLayout>
    );
}
