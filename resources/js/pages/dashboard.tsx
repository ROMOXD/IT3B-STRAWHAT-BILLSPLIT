import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

export default function Dashboard() {
    const [open, setOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Page Title */}
                <h1 className="text-2xl font-bold">My Bills</h1>

                {/* Bills Grid with Add Bill Card */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Add Bill Card - First in the grid */}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <div className="relative aspect-video cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-sidebar-border/70 transition-colors hover:border-primary/50 hover:bg-accent/50 dark:border-sidebar-border">
                                <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                                    <div className="rounded-full bg-primary/10 p-3">
                                        <Plus className="h-6 w-6 text-primary" />
                                    </div>
                                    <span className="font-medium">Create New Bill</span>
                                    <span className="text-xs text-muted-foreground">
                                        Start a new bill to split with friends
                                    </span>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Bill</DialogTitle>
                                <DialogDescription>
                                    Create a new bill to split with friends. You'll get an invitation code to share.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="billname">Bill Name</Label>
                                    <Input
                                        id="billname"
                                        placeholder="e.g., Weekend Trip, Dinner, Utilities"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="Brief description of the bill"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="event_date">Event Date (Optional)</Label>
                                    <Input
                                        id="event_date"
                                        type="date"
                                    />
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => setOpen(false)}>
                                    Create Bill
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Existing Bill Cards */}
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="absolute inset-0 flex flex-col p-4">
                            <h3 className="font-semibold">Weekend Trip</h3>
                            <p className="text-xs text-muted-foreground">5 people • $245.50</p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-xs text-green-600">Active</span>
                                <span className="text-xs text-muted-foreground">INV: TRIP23</span>
                            </div>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="absolute inset-0 flex flex-col p-4">
                            <h3 className="font-semibold">Dinner at Italian</h3>
                            <p className="text-xs text-muted-foreground">3 people • $89.75</p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-xs text-green-600">Active</span>
                                <span className="text-xs text-muted-foreground">INV: DINE45</span>
                            </div>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="absolute inset-0 flex flex-col p-4">
                            <h3 className="font-semibold">Utilities - April</h3>
                            <p className="text-xs text-muted-foreground">4 people • $120.00</p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-xs text-amber-600">Pending</span>
                                <span className="text-xs text-muted-foreground">INV: UTIL78</span>
                            </div>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="absolute inset-0 flex flex-col p-4">
                            <h3 className="font-semibold">Apartment Rent</h3>
                            <p className="text-xs text-muted-foreground">2 people • $800.00</p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-xs text-blue-600">Archived</span>
                                <span className="text-xs text-muted-foreground">INV: RENT12</span>
                            </div>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
                    <div className="relative min-h-[300px] overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="absolute inset-0 p-4">
                            {/* Activity list would go here */}
                            <p className="text-muted-foreground">No recent activity</p>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}