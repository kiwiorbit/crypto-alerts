import React, { memo } from 'react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-12 py-6 bg-light-card/50 dark:bg-dark-card/50 border-t border-light-border dark:border-dark-border">
            <div className="container mx-auto px-4 text-center text-medium-text-light dark:text-medium-text text-sm">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
                     <p>&copy; {currentYear} Crypto RSI Scanner</p>
                    <span className="hidden sm:inline">|</span>
                    <p>
                        Developed by{' '}
                        <a
                            href="https://kiwiorbit.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-light dark:text-primary hover:underline"
                        >
                            Kiwi Orbit
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default memo(Footer);