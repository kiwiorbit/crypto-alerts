import React, { useState, useEffect, memo, useRef } from 'react';

interface FavoriteButtonProps {
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
    symbol: string;
    className?: string;
    iconClassName?: string;
}

const PARTICLE_COUNT = 7;

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ isFavorite, onToggleFavorite, symbol, className = '', iconClassName = '' }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    // Use a key to force re-render of particles and restart their animation
    const animationKey = useRef(0);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite(symbol);

        // Only trigger the animation when adding a favorite
        if (!isFavorite) {
            setIsAnimating(true);
            animationKey.current += 1;
        }
    };
    
    // Timer to clean up the animation state, so it can be re-triggered
    useEffect(() => {
        if (isAnimating) {
            const timer = setTimeout(() => setIsAnimating(false), 600); // Match particle animation duration
            return () => clearTimeout(timer);
        }
    }, [isAnimating]);

    return (
        <button
            onClick={handleToggle}
            className={className}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <span className="relative flex items-center justify-center w-6 h-6">
                <i
                    className={`${isFavorite ? 'fa-solid text-yellow-400' : 'fa-regular'} fa-star ${iconClassName} ${isAnimating ? 'animate-star-pop' : ''}`}
                ></i>
                {isAnimating && (
                     <div key={animationKey.current} className="particle-burst">
                        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
                            const angle = (360 / PARTICLE_COUNT) * i - 90; // Start burst pointing upwards
                            const distance = 25 + Math.random() * 10;
                            const tx = `${Math.cos(angle * Math.PI / 180) * distance}px`;
                            const ty = `${Math.sin(angle * Math.PI / 180) * distance}px`;
                            return (
                                <i
                                    key={i}
                                    className="fa-solid fa-star particle animate"
                                    style={{
                                        // CSS custom properties for animation
                                        '--tx': tx,
                                        '--ty': ty,
                                        animationDelay: `${Math.random() * 0.1}s`,
                                        fontSize: `${6 + Math.random() * 4}px`
                                    } as React.CSSProperties}
                                ></i>
                            );
                        })}
                    </div>
                )}
            </span>
        </button>
    );
};

export default memo(FavoriteButton);