
import React from 'react';

interface HeatmapCellSkeletonProps {
    animationDelay: string;
}

const HeatmapCellSkeleton: React.FC<HeatmapCellSkeletonProps> = ({ animationDelay }) => {
    return (
        <div
            className="relative rounded-lg bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border overflow-hidden"
            style={{ 
                height: `70px`, // Fixed height for heatmap cells
                animation: 'skeleton-fade-in 0.5s ease-out forwards',
                animationDelay,
                opacity: 0, // Start hidden for animation
             }}
            aria-busy="true"
            aria-label="Loading data..."
        >
            <div className="w-full h-full bg-light-border dark:bg-dark-border animate-pulse"></div>
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

export default HeatmapCellSkeleton;
