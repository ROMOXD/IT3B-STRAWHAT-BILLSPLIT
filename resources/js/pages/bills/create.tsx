import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';

// Define props interface
interface Props {
    users: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}

interface Participant {
    id: number;
    type: 'user' | 'guest';
    userId?: number;
    guestName?: string;
}

interface CreateBillForm {
    billname: string;
    hostid: number;
    status: 'active' | 'archived';
    total_amount: number;
    participants: Participant[];
}

export default function CreateBill({ users }: Props) {
    const [participants, setParticipants] = useState<Participant[]>([
        { id: Date.now(), type: 'user' }
    ]);

    const { data, setData, post, processing, errors } = useForm<CreateBillForm>({
        billname: '',
        hostid: 1, // This will be overridden by the authenticated user on the server
        status: 'active',
        total_amount: 0,
        participants: [{ id: Date.now(), type: 'user' }]
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Bills',
            href: route('bills.index'), // Use Laravel route helper
        },
        {
            title: 'Create Bill',
            href: route('bills.create'), // Use Laravel route helper
        },
    ];

    const addParticipant = () => {
        const newParticipant = {
            id: Date.now() + Math.random(),
            type: 'user' as const
        };
        setParticipants([...participants, newParticipant]);
        setData('participants', [...data.participants, newParticipant]);
    };

    const addGuestParticipant = () => {
        const newGuest = {
            id: Date.now() + Math.random(),
            type: 'guest' as const,
            guestName: ''
        };
        setParticipants([...participants, newGuest]);
        setData('participants', [...data.participants, newGuest]);
    };

    const removeParticipant = (id: number) => {
        if (participants.length > 1) {
            const updatedParticipants = participants.filter(p => p.id !== id);
            setParticipants(updatedParticipants);
            setData('participants', updatedParticipants);
        }
    };

    const updateParticipant = (id: number, field: string, value: string | number) => {
        const updatedParticipants = participants.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        );
        setParticipants(updatedParticipants);
        setData('participants', updatedParticipants);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('bills.store')); // Use Laravel route helper
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Bill" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Create New Bill</h1>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Bill Information */}
                    <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="mb-4 text-lg font-semibold">Bill Details</h2>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="billname" className="text-sm font-medium">
                                    Bill Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="billname"
                                    type="text"
                                    value={data.billname}
                                    onChange={e => setData('billname', e.target.value)}
                                    className="w-full rounded-md border border-sidebar-border/70 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="e.g., Weekend Trip, Dinner at Restaurant"
                                    required
                                />
                                {errors.billname && (
                                    <p className="text-xs text-red-500">{errors.billname}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value as 'active' | 'archived')}
                                    className="w-full rounded-md border border-sidebar-border/70 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Participants Section */}
                    <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Participants</h2>
                                <p className="text-xs text-muted-foreground">
                                    Add people who will share this bill
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={addParticipant}
                                    className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                                >
                                    Add User
                                </button>
                                <button
                                    type="button"
                                    onClick={addGuestParticipant}
                                    className="rounded-md border border-sidebar-border/70 px-3 py-1.5 text-xs hover:bg-sidebar-border/10"
                                >
                                    Add Guest
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {participants.map((participant, index) => (
                                <div 
                                    key={participant.id}
                                    className="flex items-start gap-3 rounded-lg border border-sidebar-border/50 p-3"
                                >
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                {participant.type === 'user' ? 'Registered User' : 'Guest'}
                                            </span>
                                            {index === 0 && (
                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    Host
                                                </span>
                                            )}
                                        </div>

                                        {participant.type === 'user' ? (
                                            <div className="space-y-2">
                                                <select
                                                    value={participant.userId || ''}
                                                    onChange={(e) => updateParticipant(
                                                        participant.id, 
                                                        'userId', 
                                                        parseInt(e.target.value)
                                                    )}
                                                    className="w-full rounded-md border border-sidebar-border/70 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    disabled={index === 0}
                                                >
                                                    <option value="">Select user...</option>
                                                    {users.map(user => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.name} ({user.email})
                                                        </option>
                                                    ))}
                                                </select>
                                                {index === 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        You are the host of this bill
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={participant.guestName || ''}
                                                    onChange={(e) => updateParticipant(
                                                        participant.id,
                                                        'guestName',
                                                        e.target.value
                                                    )}
                                                    className="w-full rounded-md border border-sidebar-border/70 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    placeholder="Guest name"
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Guest will need the invitation code to join
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {participants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(participant.id)}
                                            className="rounded-md p-1 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 4V2h8v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* User Type Limit Warning */}
                        <div className="mt-4 rounded-md bg-amber-50 p-3 dark:bg-amber-950/30">
                            <div className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-amber-600">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <div className="text-xs text-amber-800 dark:text-amber-200">
                                    <p className="font-medium">Note for Standard Users:</p>
                                    <p>Standard accounts are limited to 3 people per bill. Premium accounts can add unlimited participants.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill Preview Card */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-sidebar-border/5 to-sidebar-border/10 p-4 dark:border-sidebar-border">
                        <h2 className="mb-3 text-sm font-medium">Bill Preview</h2>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-sidebar-border/30 pb-2">
                                <span className="text-xs text-muted-foreground">Bill Name</span>
                                <span className="text-sm font-medium">{data.billname || 'Not set'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between border-b border-sidebar-border/30 pb-2">
                                <span className="text-xs text-muted-foreground">Participants</span>
                                <span className="text-sm font-medium">{participants.length} people</span>
                            </div>
                            
                            <div className="flex items-center justify-between border-b border-sidebar-border/30 pb-2">
                                <span className="text-xs text-muted-foreground">Invitation Code</span>
                                <span className="font-mono text-sm font-medium">
                                    {data.billname ? '••••••••' : 'Will be generated'}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    data.status === 'active' 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                    {data.status === 'active' ? 'Active' : 'Archived'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-dashed border-sidebar-border/50 p-3">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Invitation Link:</span>{' '}
                                {data.billname 
                                    ? `${window.location.origin}/bills/join/CODE`
                                    : 'Save bill to generate invitation link'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3">
                        <a
                            href={route('bills.index')}
                            className="rounded-md border border-sidebar-border/70 px-4 py-2 text-sm hover:bg-sidebar-border/10"
                        >
                            Cancel
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}