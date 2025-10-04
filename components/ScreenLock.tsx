import React, { useState, useRef, useEffect } from 'react';

interface ScreenLockProps {
    onUnlock: () => void;
}

const ScreenLock: React.FC<ScreenLockProps> = ({ onUnlock }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'plugin') {
            setError('');
            onUnlock();
        } else {
            setError('Incorrect Password');
            setPassword('');
            if (containerRef.current) {
                containerRef.current.classList.add('animate-shake');
                setTimeout(() => {
                    containerRef.current?.classList.remove('animate-shake');
                }, 500);
            }
        }
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="fixed inset-0 bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-[9999]">
            <style>
                {`
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                    .animate-shake {
                        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                    }
                `}
            </style>
            <div ref={containerRef} className="w-full max-w-xs p-6 backdrop-blur-md rounded-2xl shadow-2xl border border-light-border/50 dark:border-dark-border/50">
                <div className="text-center">
                    <svg width="64" height="26" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" className="text-primary mb-3 inline-block" aria-hidden="true">
                        <path d="M 10 70 L 40 20 L 60 60 L 90 10 L 120 70 L 150 30 L 190 60" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h2 className="text-xl font-bold text-dark-text dark:text-light-text">Ready to Send</h2>
                    <p className="text-xs text-medium-text-light dark:text-medium-text mt-1">Enter password to confirm.</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-4">
                    <div>
                        <input
                            ref={inputRef}
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Password"
                            className={`w-full h-10 rounded-lg bg-light-bg dark:bg-dark-bg px-4 text-dark-text dark:text-light-text outline-none border ${error ? 'border-red-500' : 'border-light-border dark:border-dark-border'} focus:ring-2 focus:ring-primary-light dark:focus:ring-primary text-center`}
                            aria-label="Password"
                            aria-invalid={!!error}
                            aria-describedby="password-error"
                        />
                         {error && <p id="password-error" className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                    </div>
                    <div className="mt-4">
                        <button
                            type="submit"
                            className="w-full h-10 px-6 font-bold text-white dark:text-dark-bg bg-primary-light dark:bg-primary rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            Send <i className="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScreenLock;