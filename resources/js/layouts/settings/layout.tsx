import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    { title: 'Profile',         href: edit(),            icon: null },
    { title: 'Password',        href: editPassword(),    icon: null },
    { title: 'Two-factor auth', href: show(),            icon: null },
    { title: 'Appearance',      href: editAppearance(),  icon: null },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="min-h-full bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                {/* Page header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Manage your profile and account settings</p>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                    {/* Side nav */}
                    <aside className="w-full lg:w-48 shrink-0">
                        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col" aria-label="Settings">
                            {sidebarNavItems.map((item, index) => (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={cn(
                                        'rounded-lg px-3 py-2 text-sm font-medium transition',
                                        isCurrentOrParentUrl(item.href)
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    {item.title}
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    <Separator className="lg:hidden" />

                    {/* Content */}
                    <div className="flex-1">
                        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
