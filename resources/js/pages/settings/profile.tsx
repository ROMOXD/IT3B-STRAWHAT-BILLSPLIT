import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Profile settings', href: edit() }];

const inputClass = 'w-full rounded-lg border border-input bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60';

export default function Profile({
    mustVerifyEmail,
    status,
    usertype,
    username,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    usertype: 'standard' | 'premium';
    username?: string;
}) {
    const { auth } = usePage<SharedData>().props;

    const profileForm = useForm({
        firstname: auth.user.firstname,
        lastname:  auth.user.lastname,
        nickname:  auth.user.nickname,
        email:     auth.user.email,
    });

    // Guest upgrade is handled on the guest bill page — not here

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch('/settings/profile', { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />
            <SettingsLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Profile information</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">Update your account details</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            usertype === 'premium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        }`}>
                            {usertype.charAt(0).toUpperCase() + usertype.slice(1)}
                        </span>
                    </div>

                    {/* Profile form */}
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstname" className="text-sm font-medium text-foreground">First Name</Label>
                                <input id="firstname" className={inputClass}
                                    value={profileForm.data.firstname}
                                    onChange={e => profileForm.setData('firstname', e.target.value)} required />
                                <InputError message={profileForm.errors.firstname} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastname" className="text-sm font-medium text-foreground">Last Name</Label>
                                <input id="lastname" className={inputClass}
                                    value={profileForm.data.lastname}
                                    onChange={e => profileForm.setData('lastname', e.target.value)} required />
                                <InputError message={profileForm.errors.lastname} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nickname" className="text-sm font-medium text-foreground">Nickname</Label>
                            <input id="nickname" className={inputClass}
                                value={profileForm.data.nickname}
                                onChange={e => profileForm.setData('nickname', e.target.value)} required />
                            <InputError message={profileForm.errors.nickname} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username_display" className="text-sm font-medium text-foreground">Username</Label>
                            <input id="username_display" className={`${inputClass} cursor-not-allowed`}
                                value={username ?? ''} disabled />
                            <p className="text-xs text-muted-foreground">Username cannot be changed.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                            <input id="email" type="email" className={inputClass}
                                value={profileForm.data.email}
                                onChange={e => profileForm.setData('email', e.target.value)} required />
                            <InputError message={profileForm.errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                Your email is unverified.{' '}
                                <Link href={send()} as="button" className="font-medium underline">
                                    Resend verification email.
                                </Link>
                                {status === 'verification-link-sent' && (
                                    <p className="mt-1 font-medium text-green-600">Verification link sent.</p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-2">
                            <button type="submit" disabled={profileForm.processing}
                                data-test="update-profile-button"
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60">
                                Save changes
                            </button>
                            <Transition show={profileForm.recentlySuccessful}
                                enter="transition ease-in-out" enterFrom="opacity-0"
                                leave="transition ease-in-out" leaveTo="opacity-0">
                                <p className="text-sm text-green-600 dark:text-green-400">Saved!</p>
                            </Transition>
                        </div>
                    </form>

                    {/* Upgrade to Premium */}
                    {usertype === 'standard' && (
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-800 dark:bg-yellow-900/20">
                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Upgrade to Premium</h3>
                            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">Get unlimited bills and unlimited participants per bill.</p>
                            <button type="button" onClick={() => window.location.href = '/boost'}
                                className="mt-4 rounded-lg bg-yellow-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600">
                                Upgrade Now
                            </button>
                        </div>
                    )}

                    {/* Guest upgrade section removed — guests upgrade from the bill view page */}

                    <div className="border-t border-border pt-6">
                        <DeleteUser />
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
