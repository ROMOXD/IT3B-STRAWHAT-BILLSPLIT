import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    inputClassName?: string;
}

export default function PasswordInput({ inputClassName, className, ...props }: PasswordInputProps) {
    const [show, setShow] = useState(false);

    return (
        <div className={`relative ${className ?? ''}`}>
            <input
                {...props}
                type={show ? 'text' : 'password'}
                className={`${inputClassName ?? ''} pr-10`}
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setShow(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={show ? 'Hide password' : 'Show password'}
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}
