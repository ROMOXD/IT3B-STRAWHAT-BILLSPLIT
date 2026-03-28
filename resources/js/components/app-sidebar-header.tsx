import { Menu, X } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useSidebar } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { toggleSidebar, open, isMobile, openMobile } = useSidebar();
    const isOpen = isMobile ? openMobile : open;

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleSidebar}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Toggle sidebar"
                >
                    {isOpen ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </button>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
