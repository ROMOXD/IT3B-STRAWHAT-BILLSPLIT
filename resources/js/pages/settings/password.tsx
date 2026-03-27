import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/user-password';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Password settings', href: edit() }];

const inputClass = 'w-full rounded-lg border border-input bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export default function Password() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Update password</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">Use a long, random password to keep your account secure</p>
                    </div>

                    <Form
                        {...PasswordController.update.form()}
                        options={{ preserveScroll: true }}
                        resetOnError={['password', 'password_confirmation', 'current_password']}
                        resetOnSuccess
                        onError={() => {}}
                        className="space-y-4"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password" className="text-sm font-medium text-foreground">
                                        Current password
                                    </Label>
                                    <PasswordInput id="current_password" name="current_password"
                                        autoComplete="current-password" placeholder="Current password"
                                        inputClassName={inputClass} />
                                    <InputError message={errors.current_password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                        New password
                                    </Label>
                                    <PasswordInput id="password" name="password"
                                        autoComplete="new-password" placeholder="New password"
                                        inputClassName={inputClass} />
                                    <p className="text-xs text-muted-foreground">8–16 characters · uppercase · lowercase · number · special character</p>
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation" className="text-sm font-medium text-foreground">
                                        Confirm password
                                    </Label>
                                    <PasswordInput id="password_confirmation" name="password_confirmation"
                                        autoComplete="new-password" placeholder="Confirm password"
                                        inputClassName={inputClass} />
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <button type="submit" disabled={processing}
                                        data-test="update-password-button"
                                        className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60">
                                        Save password
                                    </button>
                                    <Transition show={recentlySuccessful}
                                        enter="transition ease-in-out" enterFrom="opacity-0"
                                        leave="transition ease-in-out" leaveTo="opacity-0">
                                        <p className="text-sm text-green-600 dark:text-green-400">Saved!</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
