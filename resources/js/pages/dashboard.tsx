import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/password-input';
import InputError from '@/components/input-error';
import { Plus, Users, Copy, Check, RefreshCw, Archive, Trash2, Eye, X, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

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
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        billname: '',
        participants: [] as Participant[],
    });

    const upgradeForm = useForm({
        password: '',
        password_confirmation: '',
    });

    const maxParticipants = usertype === 'premium' ? Infinity : 3;
    const isGuest = usertype === 'guest';

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
        post('/bills', { onSuccess: () => { setCreateOpen(false); reset(); setParticipants([]); } });
    };

    const handleUpgrade = (e: React.FormEvent) => {
        e.preventDefault();
        upgradeForm.post('/guest/upgrade', { onSuccess: () => setUpgradeOpen(false) });
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

                {/* Guest upgrade banner */}
                {isGuest && (
                    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-900/20">
                        <div className="flex items-center gap-3">
                            <UserCheck className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                            <div>
                                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">You're browsing as a guest</p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400">Register a full account to create and manage your own bills.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setUpgradeOpen(true)}
                            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Register Account
                        </button>
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
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" /> New Bill
                        </button>
                    )}
                </div>

                {/* Upgrade Dialog */}
                <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleUpgrade} noValidate>
                            <DialogHeader>
                                <DialogTitle>Register Your Account</DialogTitle>
                            </DialogHeader>
                            <p className="mt-1 text-sm text-muted-foreground">Your name and email are already saved. Just set a password to upgrade.</p>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                    <PasswordInput
                                        id="password"
                                        placeholder="Password"
                                        value={upgradeForm.data.password}
                                        onChange={e => upgradeForm.setData('password', e.target.value)}
                                        required
                                        inputClassName={inputClass}
                                    />
                                    <p className="text-xs text-muted-foreground">8–16 characters · uppercase · lowercase · number</p>
                                    <InputError message={upgradeForm.errors.password} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Confirm Password <span className="text-red-500">*</span></Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        placeholder="Confirm password"
                                        value={upgradeForm.data.password_confirmation}
                                        onChange={e => upgradeForm.setData('password_confirmation', e.target.value)}
                                        required
                                        inputClassName={inputClass}
                                    />
                                    <InputError message={upgradeForm.errors.password_confirmation} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setUpgradeOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={upgradeForm.processing}>
                                    {upgradeForm.processing ? 'Registering...' : 'Register'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Create Bill Dialog */}
                {canCreateBill && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                            <form onSubmit={handleCreate} noValidate>
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
                                                            <Input className="h-8 text-xs" placeholder="First name *"
                                                                value={p.guest_firstname}
                                                                onChange={e => updateGuestField(i, 'guest_firstname', e.target.value)} required />
                                                            <Input className="h-8 text-xs" placeholder="Last name *"
                                                                value={p.guest_lastname}
                                                                onChange={e => updateGuestField(i, 'guest_lastname', e.target.value)} required />
                                                        </div>
                                                        <Input className="h-8 text-xs" type="email" placeholder="Email address *"
                                                            value={p.guest_email}
                                                            onChange={e => updateGuestField(i, 'guest_email', e.target.value)} required />
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

                {/* Limit message */}
                {!canCreateBill && !isGuest && bills.length === 0 && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                        Monthly bill limit reached. Upgrade to Premium for unlimited bills.
                    </div>
                )}

                {/* Active Bills */}
                {bills.length === 0 && canCreateBill ? (
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/60 py-16 text-center transition hover:border-indigo-400 hover:bg-card"
                    >
                        <div className="pointer-events-none mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40">
                            <Plus className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="pointer-events-none font-semibold text-foreground">No bills yet</p>
                        <p className="pointer-events-none mt-1 text-sm text-muted-foreground">Click to create your first bill</p>
                    </button>
                ) : bills.length === 0 && isGuest ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/60 py-16 text-center">
                        <p className="font-semibold text-foreground">No bills yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">You'll see bills here once you've joined one.</p>
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
