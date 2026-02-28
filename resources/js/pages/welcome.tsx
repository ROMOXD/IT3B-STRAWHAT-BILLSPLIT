import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
    const timer = setTimeout(() => {
        setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title="Welcome - SplitBill">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700|poppins:500,600,700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
                {/* Navigation */}
                <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center">
                                <Link href="/" className="flex items-center space-x-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">SplitBill</span>
                                </Link>
                            </div>
                            <div className="flex items-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                                        >
                                            Log in
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register()}
                                                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
                                            >
                                                Register
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <main className="relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute left-1/2 top-0 -translate-x-1/2 transform">
                            <div className="h-[600px] w-[600px] rounded-full bg-indigo-200 opacity-20 blur-3xl dark:bg-indigo-900"></div>
                        </div>
                        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-purple-200 opacity-20 blur-3xl dark:bg-purple-900"></div>
                        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-pink-200 opacity-20 blur-3xl dark:bg-pink-900"></div>
                    </div>

                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                            {/* Left Column - Text Content */}
                            <div className={`flex flex-col justify-center transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                <div className="inline-flex w-fit items-center rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    <span className="mr-2"></span> Fair Splitting Made Easy
                                </div>
                                
                                <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
                                    Split Bills
                                    <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        Fairly & Easily
                                    </span>
                                </h1>
                                
                                <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                                    Never argue over who paid what again. SplitBill makes it simple to divide expenses 
                                    with friends, track payments, and settle up all in one place.
                                </p>

                                {/* Feature Pills */}
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                                        Free for guests
                                    </span>
                                    <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                                        Secure & Private
                                    </span>
                                    <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                                     Real-time updates
                                    </span>
                                    <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">
                                        Works on all devices
                                    </span>
                                </div>

                                {/* CTA Buttons */}
                                <div className="mt-10 flex flex-wrap gap-4">
                                    {!auth.user && (
                                        <>
                                            <Link
                                                href={register()}
                                                className="rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
                                            >
                                                Get Started Free
                                            </Link>
                                            <Link
                                                href="#welcome"
                                                className="rounded-lg border-2 border-gray-300 bg-transparent px-8 py-4 text-base font-semibold text-gray-700 transition-all hover:border-indigo-600 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
                                            >
                                                Learn More
                                            </Link>
                                        </>
                                    )}
                                </div>


                            </div>

                            {/* Right Column - App Preview/Illustration */}
                            <div className={`relative transition-all delay-300 duration-1000 lg:block ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                <div className="relative rounded-2xl bg-white p-2 shadow-2xl dark:bg-gray-800">
                                    <div className="overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900">
                                        {/* Mock App Interface */}
                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                                </div>
                                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">SplitBill</div>
                                            </div>
                                            
                                            {/* Bill List */}
                                            <div className="mt-4 space-y-3">
                                                <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">Guest</div>
                                                        
                                                    </div>
                                                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Free</div>
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">Standard</div>
                                                        
                                                    </div>
                                                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">₱ 500</div>
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">Premium</div>
                                                        
                                                    </div>
                                                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">₱ 1,000</div>
                                                </div>
                                            </div>

                                            
                                            
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements */}

                            </div>
                        </div>

                        {/* How It Works Section */}
                        <div id="how-it-works" className="mt-32">
                            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                                How It Works
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600 dark:text-gray-400">
                                Split bills with friends in three simple steps
                            </p>    

                            <div className="mt-16 grid gap-8 md:grid-cols-3">
                                <div className="text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        1
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Create a Bill</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Start a new bill, add a name, and generate an invitation code
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        2
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Invite Friends</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Share the code or invite registered users to join
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        3
                                    </div>
                                    <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Split & Settle</h3>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Add expenses and let SplitBill calculate who owes what
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Preview */}
                        <div className="mt-32 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white lg:p-12">
                            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                                <div>
                                    <h2 className="text-3xl font-bold sm:text-4xl">
                                        Simple, Transparent Pricing
                                    </h2>
                                    <p className="mt-4 text-indigo-100">
                                        Start for free, upgrade when you need more
                                    </p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                                        <h3 className="text-lg font-semibold">Free</h3>
                                        <p className="mt-2 text-3xl font-bold">₱ 0</p>
                                        <ul className="mt-4 space-y-2 text-sm text-indigo-100">
                                            <li>✓ 5 bills per month</li>
                                            <li>✓ Up to 3 people per bill</li>
                                            <li>✓ Guest access</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                                        <h3 className="text-lg font-semibold">Premium</h3>
                                        <p className="mt-2 text-3xl font-bold">₱ 1,000</p>
                                        <ul className="mt-4 space-y-2 text-sm text-indigo-100">
                                            <li>✓ Unlimited bills</li>
                                            <li>✓ Unlimited people</li>
                                            <li>✓ Priority support</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            © 2026 SplitBill. Made with for fair splitting.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}