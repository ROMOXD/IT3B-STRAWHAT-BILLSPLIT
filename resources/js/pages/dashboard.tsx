import { Head, router, useForm, usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Users, Copy, Check, AlertCircle, X, UserPlus, RefreshCw } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Define the Bill interface based on your model
interface Bill {
    id: number;
    billname: string;
    invitation_code: string;
    hostid: number;
    status: 'active' | 'archived';
    total_amount: number;
    people_count: number;
    formatted_total?: string;
    status_label?: string;
    invitation_url?: string;
    host?: {
        id: number;
        firstname: string;
        lastname: string;
    };
}

interface User {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
}

interface Props {
    bills: Bill[];
    archivedBills?: Bill[];
    users: User[];
    flash?: {
        success?: string;
        error?: string;
    };
}

// Define form data interface
interface FormData {
    billname: string;
    amount: string;
    participants: number[];
}

export default function Dashboard({ bills = [], archivedBills = [], users = [], flash }: Props) {
    const [open, setOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [showGeneratedCode, setShowGeneratedCode] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        billname: '',
        amount: '',
        participants: [],
    });

    const handleCreateBill = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Include participants in the form data
        const formData = {
            ...data,
            participants: selectedParticipants,
        };
        
        post('/bills', {
    preserveScroll: true,
    onSuccess: (page) => {
        setOpen(false);
        reset();
        setSelectedParticipants([]);
        setGeneratedCode('');
        setShowGeneratedCode(false);
        console.log('Bill created successfully');
    },
    onError: (errors) => {
        console.log('Creation failed:', errors);
        if (errors.message) {
            setError(errors.message);
        }
    },
});
    };

    const handleGenerateCode = () => {
        // Generate a random 8-character code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        setGeneratedCode(code);
        setShowGeneratedCode(true);
    };

    const copyInvitationCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const addParticipant = (userId: number) => {
        if (!selectedParticipants.includes(userId)) {
            setSelectedParticipants([...selectedParticipants, userId]);
            setData('participants', [...selectedParticipants, userId]);
        }
    };

    const removeParticipant = (userId: number) => {
        setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
        setData('participants', selectedParticipants.filter(id => id !== userId));
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
            case 'archived': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const viewBill = (billId: number) => {
        router.visit(`/bills/${billId}`);
    };

    // Calculate split amount per person
    const totalAmount = parseFloat(data.amount) || 0;
    const participantCount = selectedParticipants.length + 1; // +1 for the host
    const amountPerPerson = participantCount > 0 ? totalAmount / participantCount : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Flash Messages */}
                {(flash?.success || flash?.error) && (
                    <Alert variant={flash.error ? "destructive" : "default"} className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {flash.success || flash.error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Page Title */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">My Bills</h1>
                    <div className="text-sm text-muted-foreground">
                        Total: {bills.length + archivedBills.length} {bills.length + archivedBills.length === 1 ? 'bill' : 'bills'}
                    </div>
                </div>

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
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleCreateBill}>
                                <DialogHeader>
                                    <DialogTitle>Create New Bill</DialogTitle>
                                    <DialogDescription>
                                        Create a new bill to split expenses with friends. Add participants and set the total amount.
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid gap-4 py-4">
                                    {/* Bill Name */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="billname">
                                            Bill Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="billname"
                                            placeholder="e.g., Weekend Trip, Dinner at Restaurant"
                                            value={data.billname}
                                            onChange={e => setData('billname', e.target.value)}
                                            required
                                            autoFocus
                                        />
                                        {errors.billname && (
                                            <p className="text-xs text-red-500">{errors.billname}</p>
                                        )}
                                    </div>

                                    {/* Total Amount */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount">
                                            Total Amount <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={data.amount}
                                                onChange={e => setData('amount', e.target.value)}
                                                className="pl-7"
                                                required
                                            />
                                        </div>
                                        {errors.amount && (
                                            <p className="text-xs text-red-500">{errors.amount}</p>
                                        )}
                                    </div>

                                    {/* Generate Code Button */}
                                    <div className="grid gap-2">
                                        <Label>Invitation Code</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleGenerateCode}
                                                className="flex-1"
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Generate Code
                                            </Button>
                                            {showGeneratedCode && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => copyInvitationCode(generatedCode)}
                                                    className="flex-none"
                                                >
                                                    {copiedCode === generatedCode ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        {showGeneratedCode && (
                                            <p className="text-sm font-mono bg-muted p-2 rounded text-center">
                                                {generatedCode}
                                            </p>
                                        )}
                                    </div>

                                    {/* Add Participants */}
                                    <div className="grid gap-2">
                                        <Label>Add Participants</Label>
                                        <div className="flex gap-2">
                                            <Select onValueChange={(value) => addParticipant(parseInt(value))}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select a user to add" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users.map((user) => (
                                                        <SelectItem 
                                                            key={user.id} 
                                                            value={user.id.toString()}
                                                            disabled={selectedParticipants.includes(user.id)}
                                                        >
                                                            {user.firstname} {user.lastname} ({user.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Selected Participants List */}
                                        {selectedParticipants.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                <Label>Selected Participants:</Label>
                                                <div className="space-y-2">
                                                    {selectedParticipants.map((userId) => {
                                                        const user = users.find(u => u.id === userId);
                                                        return (
                                                            <div key={userId} className="flex items-center justify-between bg-muted p-2 rounded">
                                                                <span>
                                                                    {user?.firstname} {user?.lastname}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeParticipant(userId)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Split Preview */}
                                    {totalAmount > 0 && (
                                        <div className="mt-2 rounded-lg border border-sidebar-border/50 bg-sidebar-border/5 p-3">
                                            <p className="mb-2 text-xs font-medium text-muted-foreground">Split Preview</p>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Amount:</span>
                                                    <span className="font-medium">${totalAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Participants:</span>
                                                    <span className="font-medium">{participantCount} (including you)</span>
                                                </div>
                                                <div className="flex justify-between border-t pt-1 mt-1">
                                                    <span className="text-muted-foreground">Each Pays:</span>
                                                    <span className="font-bold text-primary">${amountPerPerson.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <DialogFooter className="sm:justify-between">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Bill'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Active Bills */}
                    {bills.length > 0 ? (
                        bills.map((bill) => (
                            <div 
                                key={bill.id}
                                className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 transition-all hover:shadow-md cursor-pointer dark:border-sidebar-border"
                                onClick={() => viewBill(bill.id)}
                            >
                                <div className="absolute inset-0 flex flex-col p-4">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-semibold line-clamp-1">{bill.billname}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(bill.status)}`}>
                                            {bill.status_label || bill.status}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users className="h-3 w-3" />
                                        <span>{bill.people_count} {bill.people_count === 1 ? 'person' : 'people'}</span>
                                    </div>
                                    
                                    <div className="mt-auto">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                {bill.formatted_total || `$${Number(bill.total_amount).toFixed(2)}`}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between border-t border-sidebar-border/30 pt-2">
                                            <div className="flex items-center gap-1">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {bill.invitation_code}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyInvitationCode(bill.invitation_code);
                                                    }}
                                                    className="rounded p-1 hover:bg-sidebar-border/10"
                                                    title="Copy invitation code"
                                                >
                                                    {copiedCode === bill.invitation_code ? (
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    viewBill(bill.id);
                                                }}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            </div>
                        ))
                    ) : (
                        // Show empty state if no active bills
                        <div className="col-span-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-sidebar-border/70 p-8 text-center">
                            <Users className="mb-2 h-8 w-8 text-muted-foreground" />
                            <h3 className="font-medium">No active bills yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Create your first bill to start splitting expenses
                            </p>
                        </div>
                    )}
                </div>

                {/* Archived Bills Section (if any) */}
                {archivedBills.length > 0 && (
                    <div className="mt-8">
                        <h2 className="mb-4 text-xl font-semibold">Archived Bills</h2>
                        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                            {archivedBills.map((bill) => (
                                <div 
                                    key={bill.id}
                                    className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 opacity-75 transition-all hover:shadow-md cursor-pointer dark:border-sidebar-border"
                                    onClick={() => viewBill(bill.id)}
                                >
                                    <div className="absolute inset-0 flex flex-col p-4">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-semibold line-clamp-1">{bill.billname}</h3>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(bill.status)}`}>
                                                {bill.status_label || bill.status}
                                            </span>
                                        </div>
                                        
                                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                            <Users className="h-3 w-3" />
                                            <span>{bill.people_count} {bill.people_count === 1 ? 'person' : 'people'}</span>
                                        </div>
                                        
                                        <div className="mt-auto">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium">
                                                    {bill.formatted_total || `$${Number(bill.total_amount).toFixed(2)}`}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between border-t border-sidebar-border/30 pt-2">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {bill.invitation_code}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        viewBill(bill.id);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <PlaceholderPattern className="absolute inset-0 -z-10 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}