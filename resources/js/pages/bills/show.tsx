import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, RefreshCw, Copy, Check, UserPlus, AlertCircle, Archive, Pencil } from 'lucide-react';
import { useState } from 'react';

interface Participant { id: number; user_id: number | null; name: string; is_guest: boolean; guest_firstname?: string; guest_lastname?: string; guest_nickname?: string; guest_email?: string; }
interface ExpenseSplit { participant_id: number; amount: string | number; }
interface Expense {
    id: number; expense_name: string; amount: number; split_type: string;
    expense_date: string; payer_name: string; split_with?: ExpenseSplit[];
    paid_by?: number; guest_paid_by?: number;
}
interface Bill {
    id: number; billname: string; invitation_code: string; hostid: number;
    status: string; total_amount: number; people_count: number;
    expenses: Expense[];
}
interface AvailableUser { id: number; name: string; email: string; }
interface Props {
    bill: Bill; participants: Participant[]; availableUsers: AvailableUser[];
    isHost: boolean; usertype: string;
    flash?: { success?: string; error?: string };
}

export default function ShowBill({ bill, participants, availableUsers, isHost, usertype, flash }: Props) {
    const { auth } = usePage().props;
    const [copiedCode, setCopiedCode] = useState(false);
    const [addExpenseOpen, setAddExpenseOpen] = useState(false);
    const [addParticipantOpen, setAddParticipantOpen] = useState(false);
    const [editNameOpen, setEditNameOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [viewExpense, setViewExpense] = useState<Expense | null>(null);
    const [editExpenseName, setEditExpenseName] = useState('');
    const [editingExpenseName, setEditingExpenseName] = useState(false);
    const expenseNameForm = useForm({ expense_name: '' });

    const currentUserParticipant = participants.find(p => p.user_id === (auth as any).user?.id);

    const expenseForm = useForm({
        expense_name: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        split_type: 'equal',
        split_with: [] as { participant_id: number; amount: string }[],
        paid_by_type: currentUserParticipant?.is_guest ? 'guest' : 'user',
        paid_by: currentUserParticipant?.is_guest ? '' : (currentUserParticipant?.user_id?.toString() ?? ''),
        guest_paid_by: currentUserParticipant?.is_guest ? currentUserParticipant.id.toString() : '',
        payer_key: currentUserParticipant
            ? (currentUserParticipant.is_guest ? `guest:${currentUserParticipant.id}` : `user:${currentUserParticipant.user_id}`)
            : '',
    });

    const participantForm = useForm({ type: 'user', user_id: '', guest_firstname: '', guest_lastname: '', guest_email: '' });
    const nameForm = useForm({ billname: bill.billname });

    const total = Number(bill.total_amount);
    const sharePerPerson = bill.people_count > 0 ? total / bill.people_count : 0;

    const copyCode = () => {
        navigator.clipboard.writeText(bill.invitation_code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (expenseForm.data.split_type === 'custom') {
            const total = parseFloat(expenseForm.data.amount) || 0;
            const entered = expenseForm.data.split_with.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
            if (Math.abs(total - entered) >= 0.01) return;
        }
        expenseForm.post(`/bills/${bill.id}/expenses`, {
            onSuccess: () => { setAddExpenseOpen(false); expenseForm.reset(); },
        });
    };

    const handleAddParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        participantForm.post(`/bills/${bill.id}/add-participant`, {
            onSuccess: () => { setAddParticipantOpen(false); participantForm.reset(); setUserSearch(''); },
        });
    };

    const handleUpdateName = (e: React.FormEvent) => {
        e.preventDefault();
        nameForm.patch(`/bills/${bill.id}`, {
            onSuccess: () => setEditNameOpen(false),
        });
    };

    const deleteExpense = (expenseId: number) => {
        if (confirm('Delete this expense?')) router.delete(`/bills/${bill.id}/expenses/${expenseId}`);
    };

    const saveExpenseName = (expenseId: number) => {
        expenseNameForm.patch(`/bills/${bill.id}/expenses/${expenseId}`, {
            onSuccess: () => {
                setEditingExpenseName(false);
                if (viewExpense) setViewExpense({ ...viewExpense, expense_name: expenseNameForm.data.expense_name });
            },
        });
    };

    const removeParticipant = (participantId: number) => {
        if (confirm('Remove this participant?')) router.delete(`/bills/${bill.id}/participants/${participantId}`);
    };

    const archiveBill = () => router.patch(`/bills/${bill.id}/archive`);
    const regenerateCode = () => router.post(`/bills/${bill.id}/regenerate-code`);

    const maxParticipants = usertype === 'premium' ? Infinity : 3;
    const canAddMore = bill.people_count < maxParticipants;

    return (
        <AppLayout>
            <Head title={bill.billname} />
            <div className="flex flex-col gap-4 p-4">
                {(flash?.success || flash?.error) && (
                    <Alert variant={flash.error ? 'destructive' : 'default'}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{flash.success || flash.error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.visit('/dashboard')}>
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back
                    </Button>
                </div>

                {/* Bill Header */}
                <div className="rounded-xl border border-sidebar-border/70 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{bill.billname}</h1>
                                {isHost && (
                                    <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <form onSubmit={handleUpdateName} noValidate>
                                                <DialogHeader><DialogTitle>Edit Bill Name</DialogTitle></DialogHeader>
                                                <div className="py-4">
                                                    {nameForm.errors.billname && <p className="mb-2 text-sm text-red-500">{nameForm.errors.billname}</p>}
                                                    <Input
                                                        value={nameForm.data.billname}
                                                        onChange={e => nameForm.setData('billname', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button type="submit" disabled={nameForm.processing}>Save</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${bill.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {bill.status}
                            </span>
                        </div>

                        {isHost && bill.status === 'active' && (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={archiveBill}>
                                    <Archive className="mr-1 h-4 w-4" /> Archive
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-xs text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold">₱{total.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-xs text-muted-foreground">Per Person ({bill.people_count} people)</p>
                            <p className="text-2xl font-bold">₱{sharePerPerson.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-xs text-muted-foreground">Invitation Code</p>
                            <div className="flex items-center gap-2">
                                <p className="font-mono text-lg font-bold">{bill.invitation_code}</p>
                                <button onClick={copyCode} title="Copy">
                                    {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </button>
                                {isHost && (
                                    <button onClick={regenerateCode} title="Regenerate">
                                        <RefreshCw className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Participants */}
                    <div className="rounded-xl border border-sidebar-border/70 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">Participants ({bill.people_count})</h2>
                            {isHost && canAddMore && bill.status === 'active' && (
                                <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs">
                                            <UserPlus className="mr-1 h-3 w-3" /> Add
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleAddParticipant} noValidate>
                                            <DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                {Object.values(participantForm.errors).filter(Boolean)[0] && (
                                                    <p className="text-sm text-red-500">{Object.values(participantForm.errors).filter(Boolean)[0]}</p>
                                                )}
                                                <div className="grid gap-2">
                                                    <Label>Type</Label>
                                                    <Select value={participantForm.data.type} onValueChange={v => participantForm.setData('type', v)}>
                                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">Registered User</SelectItem>
                                                            <SelectItem value="guest">Guest</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {participantForm.data.type === 'user' ? (
                                                    <div className="grid gap-2">
                                                        <Label>User</Label>
                                                        <input
                                                            type="text"
                                                            placeholder="Search by name..."
                                                            value={userSearch}
                                                            onChange={e => setUserSearch(e.target.value)}
                                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                        <div className="max-h-40 overflow-y-auto rounded-md border border-input">
                                                            {availableUsers
                                                                .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()))
                                                                .map(u => (
                                                                    <button
                                                                        key={u.id}
                                                                        type="button"
                                                                        onClick={() => participantForm.setData('user_id', u.id.toString())}
                                                                        className={`w-full px-3 py-2 text-left text-sm transition hover:bg-muted ${
                                                                            participantForm.data.user_id === u.id.toString() ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : ''
                                                                        }`}
                                                                    >
                                                                        {u.name}
                                                                    </button>
                                                                ))
                                                            }
                                                            {availableUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                                                                <p className="px-3 py-2 text-sm text-muted-foreground">No users found.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="grid gap-2">
                                                                <Label>First Name <span className="text-red-500">*</span></Label>
                                                                <Input placeholder="John"
                                                                    value={participantForm.data.guest_firstname}
                                                                    onChange={e => participantForm.setData('guest_firstname', e.target.value)} required />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label>Last Name <span className="text-red-500">*</span></Label>
                                                                <Input placeholder="Doe"
                                                                    value={participantForm.data.guest_lastname}
                                                                    onChange={e => participantForm.setData('guest_lastname', e.target.value)} required />
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label>Email Address <span className="text-red-500">*</span></Label>
                                                            <Input type="email" placeholder="email@example.com"
                                                                value={participantForm.data.guest_email}
                                                                onChange={e => participantForm.setData('guest_email', e.target.value)} required />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={participantForm.processing}>Add</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                        <div className="space-y-2">
                            {participants.map(p => (
                                <div key={p.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                                    <div>
                                        <span>{p.name}</span>
                                        {p.is_guest && (
                                            <>
                                                <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">Guest</span>
                                                {p.guest_nickname && <span className="ml-1 text-xs text-muted-foreground">({p.guest_nickname})</span>}
                                                {p.guest_email && <span className="ml-2 text-xs text-muted-foreground">{p.guest_email}</span>}
                                            </>
                                        )}
                                        {p.user_id === bill.hostid && <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Host</span>}
                                    </div>
                                    {isHost && p.user_id !== bill.hostid && bill.status === 'active' && (
                                        <button onClick={() => removeParticipant(p.id)} className="text-red-400 hover:text-red-600">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="rounded-xl border border-sidebar-border/70 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">Expenses</h2>
                            {bill.status === 'active' && (
                                <Dialog open={addExpenseOpen} onOpenChange={(open) => {
                                        setAddExpenseOpen(open);
                                        if (!open) expenseForm.reset();
                                    }}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs">
                                            <Plus className="mr-1 h-3 w-3" /> Add Expense
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleAddExpense} noValidate>
                                            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                {Object.values(expenseForm.errors).filter(Boolean)[0] && (
                                                    <p className="text-sm text-red-500">{Object.values(expenseForm.errors).filter(Boolean)[0]}</p>
                                                )}
                                                <div className="grid gap-2">
                                                    <Label>Expense Name <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        placeholder="e.g., Dinner, Hotel"
                                                        value={expenseForm.data.expense_name}
                                                        onChange={e => expenseForm.setData('expense_name', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Amount <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        type="number" step="0.01" min="0.01"
                                                        placeholder="0.00"
                                                        value={expenseForm.data.amount}
                                                        onChange={e => expenseForm.setData('amount', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label>Date <span className="text-red-500">*</span></Label>
                                                        <Input
                                                            type="date"
                                                            value={expenseForm.data.expense_date}
                                                            onChange={e => expenseForm.setData('expense_date', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Split With</Label>
                                                        <Select value={expenseForm.data.split_type} onValueChange={v => {
                                                            const splitWith = v === 'custom'
                                                                ? participants.map(p => ({ participant_id: p.id, amount: '' }))
                                                                : [];
                                                            expenseForm.setData({ ...expenseForm.data, split_type: v, split_with: splitWith });
                                                        }}>
                                                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="equal">Equally Divided</SelectItem>
                                                                {participants.length > 1 && (
                                                                    <SelectItem value="custom">Custom</SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {expenseForm.data.split_type === 'custom' && (() => {
                                                    const total = parseFloat(expenseForm.data.amount) || 0;
                                                    const entered = expenseForm.data.split_with.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
                                                    const remaining = total - entered;
                                                    const isValid = Math.abs(remaining) < 0.01;
                                                    return (
                                                        <div className="grid gap-2">
                                                            <div className="flex items-center justify-between">
                                                                <Label>How much did each person pay?</Label>
                                                                <span className={`text-xs font-medium ${ isValid ? 'text-green-600' : remaining < 0 ? 'text-red-500' : 'text-amber-500' }`}>
                                                                    {isValid ? 'Balanced ✓' : remaining < 0 ? `Over by ₱${Math.abs(remaining).toFixed(2)}` : `₱${remaining.toFixed(2)} remaining`}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">Enter ₱0 if a person didn't pay. Total must equal the expense amount.</p>
                                                            <div className="rounded-md border border-input divide-y">
                                                                {expenseForm.data.split_with.map((sw, i) => {
                                                                    const p = participants.find(x => x.id === sw.participant_id);
                                                                    return (
                                                                        <div key={sw.participant_id} className="flex items-center gap-3 px-3 py-2">
                                                                            <span className="flex-1 text-sm">{p?.name}{p?.is_guest ? ' (Guest)' : ''}</span>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.01"
                                                                                placeholder="0.00"
                                                                                value={sw.amount}
                                                                                onChange={e => {
                                                                                    const updated = expenseForm.data.split_with.map((x, j) =>
                                                                                        j === i ? { ...x, amount: e.target.value } : x
                                                                                    );
                                                                                    expenseForm.setData('split_with', updated);
                                                                                }}
                                                                                className="w-24 rounded-md border border-input bg-transparent px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                                <div className="grid gap-2">
                                                    <Label>Paid By</Label>
                                                    <Select
                                                        value={expenseForm.data.payer_key}
                                                        onValueChange={v => {
                                                            const [type, id] = v.split(':');
                                                            expenseForm.setData({
                                                                ...expenseForm.data,
                                                                payer_key: v,
                                                                paid_by_type: type,
                                                                paid_by: type === 'user' ? id : '',
                                                                guest_paid_by: type === 'guest' ? id : '',
                                                            });
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select payer" /></SelectTrigger>
                                                        <SelectContent>
                                                            {participants.map(p => (
                                                                <SelectItem
                                                                    key={p.id}
                                                                    value={p.is_guest ? `guest:${p.id}` : `user:${p.user_id}`}
                                                                >
                                                                    {p.name}{p.is_guest ? ' (Guest)' : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    </div>
                                                </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={expenseForm.processing}>Add Expense</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {bill.expenses?.length > 0 ? (
                            <div className="space-y-2">
                                {bill.expenses.map(expense => (
                                    <button
                                        key={expense.id}
                                        onClick={() => {
                                            setViewExpense(expense);
                                            setEditExpenseName(expense.expense_name);
                                            expenseNameForm.setData('expense_name', expense.expense_name);
                                            setEditingExpenseName(false);
                                        }}
                                        className="flex w-full items-center justify-between rounded-md border p-3 text-left transition hover:bg-muted"
                                    >
                                        <span className="font-medium text-sm">{expense.expense_name}</span>
                                        <span className="font-semibold text-sm">₱{Number(expense.amount).toFixed(2)}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground py-8">No details</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Expense View Dialog */}
            {viewExpense && (
                <Dialog open={!!viewExpense} onOpenChange={open => { if (!open) { setViewExpense(null); setEditingExpenseName(false); } }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 pr-6">
                                <span>{viewExpense.expense_name}</span>
                                {isHost && bill.status === 'active' && !editingExpenseName && (
                                    <button onClick={() => setEditingExpenseName(true)} className="text-muted-foreground hover:text-foreground">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        {editingExpenseName && (
                            <form onSubmit={e => { e.preventDefault(); saveExpenseName(viewExpense.id); }} className="flex items-center gap-2 px-6 pb-2" noValidate>
                                <Input
                                    value={expenseNameForm.data.expense_name}
                                    onChange={e => expenseNameForm.setData('expense_name', e.target.value)}
                                    className="h-8 text-sm"
                                    autoFocus
                                />
                                <Button type="submit" size="sm" disabled={expenseNameForm.processing}>Save</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingExpenseName(false)}>Cancel</Button>
                            </form>
                        )}

                        <div className="space-y-3 py-2">
                            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                                <span className="text-sm text-muted-foreground">Total</span>
                                <span className="text-lg font-bold">₱{Number(viewExpense.amount).toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Paid by</p>
                                    <p className="font-medium">{viewExpense.payer_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Date</p>
                                    <p className="font-medium">{new Date(viewExpense.expense_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Split type</p>
                                    <p className="font-medium capitalize">{viewExpense.split_type === 'equal' ? 'Equally Divided' : 'Custom'}</p>
                                </div>
                            </div>

                            {/* Breakdown per participant */}
                            {(() => {
                                const amount = Number(viewExpense.amount);
                                const nameMap: Record<number, string> = {};
                                participants.forEach(p => { nameMap[p.id] = p.name; });

                                let rows: { id: number; share: number }[];
                                if (viewExpense.split_type === 'custom' && Array.isArray(viewExpense.split_with) && viewExpense.split_with.length) {
                                    rows = viewExpense.split_with.map(sw => ({ id: sw.participant_id, share: parseFloat(String(sw.amount)) || 0 }));
                                } else {
                                    const share = amount / participants.length;
                                    rows = participants.map(p => ({ id: p.id, share }));
                                }

                                return (
                                    <div>
                                        <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Breakdown</p>
                                        <div className="rounded-md border border-input divide-y">
                                            {rows.map(r => (
                                                <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                                    <span className="font-medium">{nameMap[r.id] ?? 'Unknown'}</span>
                                                    <span>₱{r.share.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Settlement */}
                            {(() => {
                                const amount = Number(viewExpense.amount);
                                const expenseBalance: Record<number, number> = {};
                                participants.forEach(p => { expenseBalance[p.id] = 0; });

                                if (viewExpense.split_type === 'custom' && Array.isArray(viewExpense.split_with) && viewExpense.split_with.length) {
                                    const involved = viewExpense.split_with;
                                    const fairShare = amount / involved.length;
                                    involved.forEach(sw => {
                                        if (expenseBalance[sw.participant_id] !== undefined)
                                            expenseBalance[sw.participant_id] += (parseFloat(String(sw.amount)) || 0) - fairShare;
                                    });
                                } else {
                                    const payerParticipant = viewExpense.paid_by
                                        ? participants.find(p => p.user_id === viewExpense.paid_by)
                                        : participants.find(p => p.is_guest && p.id === viewExpense.guest_paid_by);
                                    const share = amount / participants.length;
                                    participants.forEach(p => { expenseBalance[p.id] -= share; });
                                    if (payerParticipant) expenseBalance[payerParticipant.id] += amount;
                                }

                                const creditors = Object.entries(expenseBalance).filter(([,v]) => v > 0.005).map(([id, v]) => ({ id: Number(id), amount: v }));
                                const debtors   = Object.entries(expenseBalance).filter(([,v]) => v < -0.005).map(([id, v]) => ({ id: Number(id), amount: -v }));
                                const settlements: { from: number; to: number; amount: number }[] = [];
                                const c = creditors.map(x => ({ ...x }));
                                const d = debtors.map(x => ({ ...x }));
                                let ci = 0, di = 0;
                                while (ci < c.length && di < d.length) {
                                    const settle = Math.min(c[ci].amount, d[di].amount);
                                    settlements.push({ from: d[di].id, to: c[ci].id, amount: settle });
                                    c[ci].amount -= settle; d[di].amount -= settle;
                                    if (c[ci].amount < 0.005) ci++;
                                    if (d[di].amount < 0.005) di++;
                                }
                                const nameMap: Record<number, string> = {};
                                participants.forEach(p => { nameMap[p.id] = p.name; });

                                if (!settlements.length) return <p className="text-sm text-muted-foreground">Everyone is settled for this expense.</p>;

                                return (
                                    <div>
                                        <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Settlement</p>
                                        <div className="rounded-md border border-input divide-y">
                                            {settlements.map((s, i) => (
                                                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                                                    <span><span className="font-medium">{nameMap[s.from]}</span>{' owes '}<span className="font-medium">{nameMap[s.to]}</span></span>
                                                    <span className="font-semibold">₱{s.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {isHost && bill.status === 'active' && (
                            <DialogFooter>
                                <Button variant="destructive" size="sm" onClick={() => { deleteExpense(viewExpense.id); setViewExpense(null); }}>
                                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                                </Button>
                            </DialogFooter>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
