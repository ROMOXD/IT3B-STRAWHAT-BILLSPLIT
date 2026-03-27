import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Users, Copy, Check, RefreshCw, Archive, Trash2, Eye, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface Participant { type: 'user' | 'guest'; user_id?: number; guest_firstname?: string; guest_lastname?: string; guest_email?: string; }
interface Bill {
    id: number; billname: string; invitation_code: string; hostid: number;
    status: 'active' | 'archived'; total_amount: number; people_count: number;
    is_host: boolean;
}
interface User { id: number; name: string; email: string; }
interface Props {
    bills: Bill[]; archivedBills: Bill[]; users: User[];
    usertype: string; canCreateBill: boolean; hostedCount: number;
    flash?: { success?: string; error?: string };
}

export default function Dashboard({ bills = [], archivedBills = [], users = [], usertype, canCreateBill, hostedCount, flash }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        billname: '',
        participants: [] as Participant[],
    });

    const maxParticipants = usertype === 'premium' ? Infinity : 3;

    const addUserParticipant = (userId: number) => {
        if (participants.length + 1 >= maxParticipants) return;
        if (participants.some(p => p.type === 'user' && p.user_id === userId)) return;
        const updated = [...participants, { type: 'user' as const, user_id: userId }];
        setParticipants(updated);
        setData('participants', updated);
    };

    const addGuestParticipant = () => {
        if (participants.length + 1 >= maxParticipants) return;
        const updated = [...participants, { type: 'guest' as const, guest_firstname: '', guest_lastname: '', guest_email: '' }];
        setParticipants(updated);
        setData('participants', updated);
    };

    const updateGuestField = (index: number, field: 'guest_firstname' | 'guest_lastname' | 'guest_email', value: string) => {
        const updated = participants.map((p, i) => i === index ? { ...p, [field]: value } : p);
        setParticipants(updated);
        setData('participants', updated);
    };

    const removeParticipant = (index: number) => {
        const updated = participants.filter((_, i) => i !== index);
        setParticipants(updated);
        setData('participants', updated);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/bills', {
            onSuccess: () => { setCreateOpen(false); reset(); setParticipants([]); },
        });
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const archiveBill = (id: number) => router.patch(`/bills/${id}/archive`);
    const unarchiveBill = (id: number) => router.patch(`/bills/${id}/unarchive`);
    const deleteBill = (id: number) => { if (confirm('Delete this bill?')) router.delete(`/bills/${id}`); };
    const regenerateCode = (id: number) => router.post(`/bills/${id}/regenerate-code`);

    const availableUsers = users.filter(u => !participants.some(p => p.type === 'user' && p.user_id === u.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="min-h-full bg-background p-6">

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">My Bills</h1>
                        {usertype === 'standard' && (
                            <p className="mt-0.5 text-xs text-muted-foreground">Standard plan · {hostedCount}/5 bills this month · max 3 people/bill</p>
                        )}
                    </div>
                    {canCreateBill && (
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4" /> New Bill
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                                <form onSubmit={handleCreate}>
                                    <DialogHeader>
                                        <DialogTitle>Create New Bill</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="billname">Bill Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="billname"
                                                placeholder="e.g., Weekend Trip"
                                                value={data.billname}
                                                onChange={e => setData('billname', e.target.value)}
                                                required
                                            />
                                            {errors.billname && <p className="text-xs text-red-500">{errors.billname}</p>}
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between">
                                                <Label>
                                                    Participants ({participants.length + 1}/{maxParticipants === Infinity ? '∞' : maxParticipants})
                                                </Label>
                                                <div className="flex gap-2">
                                                    {availableUsers.length > 0 && participants.length + 1 < maxParticipants && (
                                                        <Select onValueChange={v => addUserParticipant(parseInt(v))}>
                                                            <SelectTrigger className="h-7 w-36 text-xs">
                                                                <SelectValue placeholder="Add user" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableUsers.map(u => (
                                                                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                    {participants.length + 1 < maxParticipants && (
                                                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addGuestParticipant}>
                                                            + Guest
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                                                You (host)
                                            </div>

                                            {participants.map((p, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    {p.type === 'user' ? (
                                                        <div className="flex-1 rounded-md bg-muted p-2 text-xs">
                                                            {users.find(u => u.id === p.user_id)?.name}
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 grid gap-1.5">
                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                <Input
                                                                    className="h-8 text-xs"
                                                                    placeholder="First name *"
                                                                    value={p.guest_firstname}
                                                                    onChange={e => updateGuestField(i, 'guest_firstname', e.target.value)}
                                                                    required
                                                                />
                                                                <Input
                                                                    className="h-8 text-xs"
                                                                    placeholder="Last name *"
                                                                    value={p.guest_lastname}
                                                                    onChange={e => updateGuestField(i, 'guest_lastname', e.target.value)}
                                                                    required
                                                                />
                                                            </div>
                                                            <Input
                                                                className="h-8 text-xs"
                                                                type="email"
                                                                placeholder="Email address *"
                                                                value={p.guest_email}
                                                                onChange={e => updateGuestField(i, 'guest_email', e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    )}
                                                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 mt-0.5" onClick={() => removeParticipant(i)}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {errors.participants && <p className="text-xs text-red-500">{errors.participants}</p>}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Creating...' : 'Create Bill'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Limit message */}
                {!canCreateBill && bills.length === 0 && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                        Monthly bill limit reached. Upgrade to Premium for unlimited bills.
                    </div>
                )}

                {/* Active Bills */}
                {bills.length === 0 && canCreateBill ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/60 py-16 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40">
                            <Plus className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="font-semibold text-foreground">No bills yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">Click "New Bill" to get started</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bills.map(bill => (
                            <BillCard
                                key={bill.id}
                                bill={bill}
                                copiedCode={copiedCode}
                                onCopy={copyCode}
                                onView={() => router.visit(`/bills/${bill.id}`)}
                                onArchive={bill.is_host ? () => archiveBill(bill.id) : undefined}
                                onDelete={bill.is_host ? () => deleteBill(bill.id) : undefined}
                                onRegenerate={bill.is_host ? () => regenerateCode(bill.id) : undefined}
                            />
                        ))}
                    </div>
                )}

                {/* Archived Bills */}
                {archivedBills.length > 0 && (
                    <div className="mt-10">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">Archived Bills</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {archivedBills.map(bill => (
                                <BillCard
                                    key={bill.id}
                                    bill={bill}
                                    archived
                                    copiedCode={copiedCode}
                                    onCopy={copyCode}
                                    onView={() => router.visit(`/bills/${bill.id}`)}
                                    onUnarchive={bill.is_host ? () => unarchiveBill(bill.id) : undefined}
                                    onDelete={bill.is_host ? () => deleteBill(bill.id) : undefined}
                                    onRegenerate={bill.is_host ? () => regenerateCode(bill.id) : undefined}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function BillCard({ bill, archived = false, copiedCode, onCopy, onView, onArchive, onUnarchive, onDelete, onRegenerate }: {
    bill: Bill; archived?: boolean; copiedCode: string | null;
    onCopy: (c: string) => void; onView: () => void;
    onArchive?: () => void; onUnarchive?: () => void;
    onDelete?: () => void; onRegenerate?: () => void;
}) {
    return (
        <div className={`flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border transition hover:shadow-md ${archived ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-card-foreground leading-tight">{bill.billname}</h3>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    archived ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                }`}>
                    {archived ? 'Archived' : 'Active'}
                </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {bill.people_count} {bill.people_count === 1 ? 'person' : 'people'}
                </span>
                <span className="font-semibold text-foreground">₱{Number(bill.total_amount).toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 dark:bg-indigo-950/40">
                <span className="flex-1 font-mono text-xs text-indigo-700 dark:text-indigo-300">{bill.invitation_code}</span>
                <button onClick={() => onCopy(bill.invitation_code)} title="Copy code"
                    className="rounded p-0.5 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
                    {copiedCode === bill.invitation_code ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {onRegenerate && (
                    <button onClick={onRegenerate} title="Regenerate code"
                        className="rounded p-0.5 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <div className="flex gap-2 pt-1">
                <button onClick={onView}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700">
                    <Eye className="h-3.5 w-3.5" /> View
                </button>
                {!archived && onArchive && (
                    <button onClick={onArchive} title="Archive"
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                        <Archive className="h-3.5 w-3.5" />
                    </button>
                )}
                {archived && onUnarchive && (
                    <button onClick={onUnarchive}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                        Restore
                    </button>
                )}
                {onDelete && (
                    <button onClick={onDelete} title="Delete"
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
