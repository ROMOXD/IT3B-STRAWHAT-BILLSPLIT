import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Clock, Users, DollarSign, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

interface Participant {
    id: number; user_id: number | null; name: string; is_guest: boolean;
    guest_firstname?: string; guest_lastname?: string; guest_email?: string;
}
interface Expense {
    id: number; expense_name: string; amount: number; split_type: string;
    expense_date: string;
    payer?: { firstname: string; lastname: string };
    guest_payer?: { guest_firstname?: string; guest_lastname?: string };
}
interface Bill {
    id: number; billname: string; invitation_code: string; hostid: number;
    status: string; total_amount: number; people_count: number;
    expenses: Expense[];
}
interface GuestParticipant {
    id: number; firstname: string; lastname: string; nickname: string; email: string; expires_at: string;
}

export default function GuestBill({
    bill, participants, guestParticipant,
}: {
    bill: Bill; participants: Participant[]; guestParticipant: GuestParticipant;
}) {
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    const upgradeForm = useForm({
        username:              '',
        nickname:              '',
        password:              '',
        password_confirmation: '',
    });

    // Countdown timer
    useEffect(() => {
        const tick = () => {
            const diff = new Date(guestParticipant.expires_at).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [guestParticipant.expires_at]);

    const handleUpgrade = (e: React.FormEvent) => {
        e.preventDefault();
        upgradeForm.post('/guest/upgrade');
    };

    const total = Number(bill.total_amount);
    const perPerson = bill.people_count > 0 ? total / bill.people_count : 0;

    return (
        <AuthLayout title={bill.billname} description="You are viewing this bill as a guest">
            <Head title={bill.billname} />

            {/* Guest session banner */}
            <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2.5 text-sm dark:bg-amber-900/20">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    Access expires in <strong>{timeLeft}</strong>
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-500">
                    {guestParticipant.firstname} {guestParticipant.lastname}
                </span>
            </div>

            {/* Bill summary */}
            <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted px-4 py-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-foreground">₱{total.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-muted px-4 py-3">
                    <p className="text-xs text-muted-foreground">Your share ({bill.people_count} people)</p>
                    <p className="text-lg font-bold text-foreground">₱{perPerson.toFixed(2)}</p>
                </div>
            </div>

            {/* Participants */}
            <div className="mb-4 rounded-lg border border-border p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Users className="h-4 w-4" /> Participants
                </h3>
                <div className="space-y-1.5">
                    {participants.map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-sm text-foreground">
                            <span>{p.name}</span>
                            {p.is_guest && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Guest
                                </span>
                            )}
                            {p.user_id === bill.hostid && (
                                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    Host
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Expenses */}
            <div className="mb-6 rounded-lg border border-border p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <DollarSign className="h-4 w-4" /> Expenses
                </h3>
                {bill.expenses?.length > 0 ? (
                    <div className="space-y-2">
                        {bill.expenses.map(expense => (
                            <div key={expense.id} className="flex items-start justify-between rounded-md bg-muted px-3 py-2 text-sm">
                                <div>
                                    <p className="font-medium text-foreground">{expense.expense_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Paid by {expense.payer
                                            ? `${expense.payer.firstname} ${expense.payer.lastname}`
                                            : `${expense.guest_payer?.guest_firstname ?? ''} ${expense.guest_payer?.guest_lastname ?? ''}`.trim() || 'Guest'}
                                        {' · '}{expense.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{expense.expense_date}</p>
                                </div>
                                <span className="font-semibold text-foreground">₱{Number(expense.amount).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">No details</p>
                )}
            </div>

            {/* Claim / Upgrade section */}
            {!showUpgrade ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
                    <div className="flex items-start gap-3">
                        <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                                Want to keep access?
                            </p>
                            <p className="mt-0.5 text-xs text-indigo-700 dark:text-indigo-400">
                                Register a full account using your existing details — only a password is needed.
                            </p>
                            <button
                                onClick={() => setShowUpgrade(true)}
                                className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Register / Claim Account
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20">
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300">Create Your Account</h3>
                    <p className="mt-0.5 text-sm text-indigo-700 dark:text-indigo-400">
                        Your details are already saved — just set a password.
                    </p>

                    {/* Read-only preview */}
                    <div className="mt-3 rounded-lg border border-indigo-100 bg-white/60 px-4 py-3 text-sm dark:border-indigo-700 dark:bg-indigo-950/30">
                        <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Name: </span>
                            {guestParticipant.firstname} {guestParticipant.lastname}
                        </p>
                        {guestParticipant.nickname && (
                            <p className="mt-1 text-muted-foreground">
                                <span className="font-medium text-foreground">Nickname: </span>
                                {guestParticipant.nickname}
                            </p>
                        )}
                        <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">Email: </span>
                            {guestParticipant.email}
                        </p>
                    </div>

                    <form onSubmit={handleUpgrade} className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Username <span className="text-red-500">*</span>
                                </Label>
                                <input
                                    id="username" type="text" placeholder="e.g., johndoe"
                                    value={upgradeForm.data.username}
                                    onChange={e => upgradeForm.setData('username', e.target.value)}
                                    required
                                    className={inputClass}
                                />
                                <InputError message={upgradeForm.errors.username} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nickname" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nickname <span className="text-red-500">*</span>
                                </Label>
                                <input
                                    id="nickname" type="text" placeholder="e.g., JohnD"
                                    value={upgradeForm.data.nickname}
                                    onChange={e => upgradeForm.setData('nickname', e.target.value)}
                                    required
                                    className={inputClass}
                                />
                                <InputError message={upgradeForm.errors.nickname} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password <span className="text-red-500">*</span>
                            </Label>
                            <PasswordInput
                                id="password" name="password"
                                placeholder="8–16 chars, upper/lower/number/special"
                                value={upgradeForm.data.password}
                                onChange={e => upgradeForm.setData('password', e.target.value)}
                                required inputClassName={inputClass}
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                8–16 characters · uppercase · lowercase · number · special character
                            </p>
                            <InputError message={upgradeForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confirm Password <span className="text-red-500">*</span>
                            </Label>
                            <PasswordInput
                                id="password_confirmation" name="password_confirmation"
                                placeholder="Confirm password"
                                value={upgradeForm.data.password_confirmation}
                                onChange={e => upgradeForm.setData('password_confirmation', e.target.value)}
                                required inputClassName={inputClass}
                            />
                            <InputError message={upgradeForm.errors.password_confirmation} />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={upgradeForm.processing}
                                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
                                {upgradeForm.processing && <Spinner />}
                                Create Account
                            </button>
                            <button type="button" onClick={() => setShowUpgrade(false)}
                                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
                                Cancel
                            </button>
                        </div>
                        {upgradeForm.errors.email && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                {upgradeForm.errors.email}{' '}
                                <a href="/login" className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-200">
                                    Log in here
                                </a>
                            </div>
                        )}
                    </form>
                </div>
            )}
        </AuthLayout>
    );
}
