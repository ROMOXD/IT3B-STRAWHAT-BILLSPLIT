import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Appearance settings', href: editAppearance() }];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Appearance</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">Customize how SplitBill looks for you</p>
                    </div>
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
