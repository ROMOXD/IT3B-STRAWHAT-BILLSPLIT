import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, DollarSign, Calendar } from 'lucide-react';

interface Props {
    bill: {
        id: number;
        billname: string;
        invitation_code: string;
        status: string;
        total_amount: number;
        people_count: number;
        host: {
            firstname: string;
            lastname: string;
        };
        participants: any[];
        expenses: any[];
        formatted_total?: string;
    };
}

export default function Show({ bill }: Props) {
    const sharePerPerson = bill.people_count > 0 
        ? bill.total_amount / bill.people_count 
        : 0;

    return (
        <AppLayout>
            <Head title={bill.billname} />
            
            <div className="p-4">
                <Button 
                    variant="ghost" 
                    onClick={() => router.visit('/dashboard')}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="rounded-xl border border-sidebar-border/70 p-6">
                    <h1 className="text-3xl font-bold">{bill.billname}</h1>
                    
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-sidebar-border/10 p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>Total</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {bill.formatted_total || `$${bill.total_amount}`}
                            </p>
                        </div>

                        <div className="rounded-lg bg-sidebar-border/10 p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>Per Person</span>
                            </div>
                            <p className="text-2xl font-bold">
                                ${sharePerPerson.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {bill.people_count} participants
                            </p>
                        </div>

                        <div className="rounded-lg bg-sidebar-border/10 p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Invitation Code</span>
                            </div>
                            <p className="font-mono text-lg font-bold">
                                {bill.invitation_code}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-semibold">Expenses</h2>
                        {bill.expenses?.length > 0 ? (
                            <div className="mt-4 space-y-2">
                                {bill.expenses.map((expense) => (
                                    <div key={expense.id} className="rounded-lg border p-4">
                                        <div className="flex justify-between">
                                            <span className="font-medium">
                                                ${expense.amount}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {expense.expense_date}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-4 text-muted-foreground">
                                No expenses yet
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}