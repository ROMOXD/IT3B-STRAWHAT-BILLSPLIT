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
interface Expense {
    id: number; expense_name: string; amount: number; split_type: string;
    expense_date: string; payer_name: string;
    payer?: { firstname: string; lastname: string };
    guest_payer?: { guest_name: string };
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

    const currentUserParticipant = participants.find(p => p.user_id === (auth as any).user?.id);

    const expenseForm = useForm({
        expense_name: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        split_type: 'equal',
        paid_by_type: 'user',
        paid_by: currentUserParticipant?.user_id?.toString() ?? '',
        guest_paid_by: '',
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
        expenseForm.post(`/bills/${bill.id}/expenses`, {
            onSuccess: () => { setAddExpenseOpen(false); expenseForm.reset(); },
        });
    };

    const handleAddParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        participantForm.post(`/bills/${bill.id}/add-participant`, {
            onSuccess: () => { setAddParticipantOpen(false); participantForm.reset(); },
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
                                            <form onSubmit={handleUpdateName}>
                                                <DialogHeader><DialogTitle>Edit Bill Name</DialogTitle></DialogHeader>
                                                <div className="py-4">
                                                    <Input
                                                        value={nameForm.data.billname}
                                                        onChange={e => nameForm.setData('billname', e.target.value)}
                                                        required
                                                    />
                                                    {nameForm.errors.billname && <p className="text-xs text-red-500">{nameForm.errors.billname}</p>}
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
                                        <form onSubmit={handleAddParticipant}>
                                            <DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Type</Label>
                                                    <Select value={participantForm.data.type} onValueChange={v => participantForm.setData('type', v)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">Registered User</SelectItem>
                                                            <SelectItem value="guest">Guest</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {participantForm.data.type === 'user' ? (
                                                    <div className="grid gap-2">
                                                        <Label>User</Label>
                                                        <Select value={participantForm.data.user_id} onValueChange={v => participantForm.setData('user_id', v)}>
                                                            <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                                                            <SelectContent>
                                                                {availableUsers.map(u => (
                                                                    <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.email})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="grid gap-2">
                                                                <Label>First Name <span className="text-red-500">*</span></Label>
                                                                <Input
                                                                    placeholder="John"
                                                                    value={participantForm.data.guest_firstname}
                                                                    onChange={e => participantForm.setData('guest_firstname', e.target.value)}
                                                                    required
                                                                />
                                                                {participantForm.errors.guest_firstname && <p className="text-xs text-red-500">{participantForm.errors.guest_firstname}</p>}
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label>Last Name <span className="text-red-500">*</span></Label>
                                                                <Input
                                                                    placeholder="Doe"
                                                                    value={participantForm.data.guest_lastname}
                                                                    onChange={e => participantForm.setData('guest_lastname', e.target.value)}
                                                                    required
                                                                />
                                                                {participantForm.errors.guest_lastname && <p className="text-xs text-red-500">{participantForm.errors.guest_lastname}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label>Email Address <span className="text-red-500">*</span></Label>
                                                            <Input
                                                                type="email"
                                                                placeholder="email@example.com"
                                                                value={participantForm.data.guest_email}
                                                                onChange={e => participantForm.setData('guest_email', e.target.value)}
                                                                required
                                                            />
                                                            {participantForm.errors.guest_email && <p className="text-xs text-red-500">{participantForm.errors.guest_email}</p>}
                                                        </div>
                                                    </>
                                                )}
                                                {participantForm.errors.participant && (
                                                    <p className="text-xs text-red-500">{participantForm.errors.participant}</p>
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
                                <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs">
                                            <Plus className="mr-1 h-3 w-3" /> Add Expense
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleAddExpense}>
                                            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label>Expense Name <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        placeholder="e.g., Dinner, Hotel"
                                                        value={expenseForm.data.expense_name}
                                                        onChange={e => expenseForm.setData('expense_name', e.target.value)}
                                                        required
                                                    />
                                                    {expenseForm.errors.expense_name && <p className="text-xs text-red-500">{expenseForm.errors.expense_name}</p>}
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
                                                    {expenseForm.errors.amount && <p className="text-xs text-red-500">{expenseForm.errors.amount}</p>}
                                                </div>
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
                                                    <Select value={expenseForm.data.split_type} onValueChange={v => expenseForm.setData('split_type', v)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="equal">Equally Divided</SelectItem>
                                                            <SelectItem value="custom">Custom</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Paid By</Label>
                                                    <Select value={expenseForm.data.paid_by_type} onValueChange={v => expenseForm.setData('paid_by_type', v)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">Registered Participant</SelectItem>
                                                            <SelectItem value="guest">Guest Participant</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {expenseForm.data.paid_by_type === 'user' ? (
                                                    <>
                                                        <Select value={expenseForm.data.paid_by} onValueChange={v => expenseForm.setData('paid_by', v)}>
                                                            <SelectTrigger><SelectValue placeholder="Select payer" /></SelectTrigger>
                                                            <SelectContent>
                                                                {participants.filter(p => !p.is_guest).map(p => (
                                                                    <SelectItem key={p.id} value={p.user_id!.toString()}>{p.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {expenseForm.errors.paid_by && <p className="text-xs text-red-500">{expenseForm.errors.paid_by}</p>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Select value={expenseForm.data.guest_paid_by} onValueChange={v => expenseForm.setData('guest_paid_by', v)}>
                                                            <SelectTrigger><SelectValue placeholder="Select guest payer" /></SelectTrigger>
                                                            <SelectContent>
                                                                {participants.filter(p => p.is_guest).map(p => (
                                                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {expenseForm.errors.guest_paid_by && <p className="text-xs text-red-500">{expenseForm.errors.guest_paid_by}</p>}
                                                    </>
                                                )}
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
                                    <div key={expense.id} className="flex items-start justify-between rounded-md border p-3">
                                        <div>
                                            <p className="font-medium text-sm">{expense.expense_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Paid by {expense.payer ? `${expense.payer.firstname} ${expense.payer.lastname}` : expense.guest_payer?.guest_name ?? 'Unknown'}
                                                {' · '}{expense.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{expense.expense_date}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">₱{Number(expense.amount).toFixed(2)}</span>
                                            {isHost && bill.status === 'active' && (
                                                <button onClick={() => deleteExpense(expense.id)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground py-8">No details</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
