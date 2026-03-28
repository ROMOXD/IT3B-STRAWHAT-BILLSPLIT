import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from '@/hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const guestOnlyPages = ['/login', '/register', '/forgot-password', '/reset-password', '/guest/lookup', '/guest/register'];
const authRequiredPages = ['/dashboard', '/bills', '/settings', '/boost'];

router.on('navigate', (event) => {
    const page = event.detail.page;
    const user = (page.props as any)?.auth?.user;
    const url = new URL(page.url, window.location.origin).pathname;

    if (!user && authRequiredPages.some(p => url.startsWith(p))) {
        router.visit('/login', { replace: true });
        return;
    }

    if (user && guestOnlyPages.some(p => url.startsWith(p))) {
        router.visit('/dashboard', { replace: true });
    }
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
