import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
        const { isCurrentUrl } = useCurrentUrl();

        return (
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">Navigation</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className="
                                    hover:bg-indigo-50 hover:text-indigo-700
                                    dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300
                                    data-[active=true]:bg-indigo-600 data-[active=true]:text-white
                                    data-[active=true]:hover:bg-indigo-700
                                    transition-colors duration-150
                                "
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        );
    }
