import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon />
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate font-bold leading-tight text-indigo-600 dark:text-indigo-400">
                    SplitBill
                </span>
            </div>
        </>
    );
}
