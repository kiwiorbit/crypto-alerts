
import React from 'react';

interface GridCellSkeletonProps {
    animationDelay: string;
}

const GridCellSkeleton: React.FC<GridCellSkeletonProps> = ({ animationDelay }) => {
    return (
        <div
            className="relative p-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border overflow-hidden h-40"
            style={{ 
                animation: 'skeleton-fade-in 0.5s ease-out forwards',
                animationDelay,
                opacity: 0, // Start hidden for animation
             }}
            aria-busy="true"
            aria-label="Loading data..."
        >
            <div className="relative w-full h-full flex flex-col animate-pulse">
                {/* Header placeholder */}
                <div className="flex justify-between items-center px-2 pt-1 mb-2">
                    <div className="h-4 bg-light-border dark:bg-dark-border rounded-md w-1/3"></div>
                    <div className="h-4 bg-light-border dark:bg-dark-border rounded-md w-1/4"></div>
                </div>
                {/* Chart placeholder */}
                <div className="flex-grow w-full h-full bg-light-border dark:bg-dark-border rounded-md"></div>
            </div>
             {/* Shimmer effect */}
            <div 
                className="absolute top-0 left-0 w-full h-full"
                style={{
                    background: `linear-gradient(90deg, transparent 25%, rgba(255, 255, 255, 0.04) 50%, transparent 75%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                }}
            />
        </div>
    );
};

export default GridCellSkeleton;
