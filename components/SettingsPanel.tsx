
import React, { useMemo } from 'react';
import type { Theme, Settings, Timeframe } from '../types';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenAssetModal: () => void;
    onOpenAlertsModal: () => void;
    onReset: () => void;
    theme: Theme;
    onThemeToggle: () => void;
    settings: Settings;
    onSettingChange: (key: keyof Settings, value: any) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    onClose,
    onOpenAssetModal,
    onOpenAlertsModal,
    onReset,
    theme,
    onThemeToggle,
    settings,
    onSettingChange,
}) => {
    
    if (!isOpen) {
        return null;
    }

    const handleResetClick = () => {
        if (window.confirm("Are you sure you want to clear all data? This will reset all favorites, custom assets, and settings to their defaults. The application will then refresh.")) {
            onReset();
        }
    };

    const handleCandleDisplayChange = () => {
        const current = settings.candlesDisplayed;
        if (current === 80) {
            onSettingChange('candlesDisplayed', 100);
        } else if (current === 100) {
            onSettingChange('candlesDisplayed', 120);
        } else { // Includes 120 and falls back to 80
            onSettingChange('candlesDisplayed', 80);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300" onClick={onClose}></div>
            <div
                className={`fixed top-0 right-0 h-full bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur-lg border-l border-light-border/50 dark:border-dark-border/50 text-dark-text dark:text-light-text shadow-2xl z-50 w-72 max-w-[90vw] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-light-border dark:border-dark-border">
                    <h3 className="text-xl font-bold">Settings</h3>
                    <button onClick={onClose} className="text-xl text-medium-text-light dark:text-medium-text hover:text-dark-text dark:hover:text-light-text transition-colors" aria-label="Close settings">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                {/* Main Content (menu) */}
                <div className="flex-grow p-3 space-y-4 overflow-y-auto">
                    {/* Customization Section */}
                    <div>
                        <h4 className="px-2 pb-1 font-semibold text-medium-text-light dark:text-medium-text uppercase tracking-wider text-xs">Customization</h4>
                        <ul className="space-y-1">
                            <li>
                                <button
                                    onClick={() => { onOpenAssetModal(); onClose(); }}
                                    className="w-full text-left p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 hover:bg-light-border dark:hover:bg-dark-border transition-colors flex items-center gap-3"
                                >
                                    <i className="fa-solid fa-list-check w-5 text-center text-base text-primary-light dark:text-primary"></i>
                                    <span className="font-medium text-sm">Asset List</span>
                                </button>
                            </li>
                             <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label htmlFor="theme-toggle" className="font-medium text-sm cursor-pointer pr-4 text-dark-text dark:text-light-text flex-grow flex items-center gap-3">
                                         <i className={`fa-solid ${theme === 'dark' ? 'fa-moon' : 'fa-sun'} w-5 text-center text-base text-primary-light dark:text-primary`}></i>
                                        <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            id="theme-toggle"
                                            className="sr-only peer"
                                            checked={theme === 'dark'}
                                            onChange={onThemeToggle}
                                        />
                                        <div className="w-10 h-5 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-light dark:peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Notifications Section */}
                    <div>
                        <h4 className="px-2 pb-1 font-semibold text-medium-text-light dark:text-medium-text uppercase tracking-wider text-xs">Notifications</h4>
                         <ul className="space-y-1">
                            <li>
                                <button
                                    onClick={() => { onOpenAlertsModal(); onClose(); }}
                                    className="w-full text-left p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 hover:bg-light-border dark:hover:bg-dark-border transition-colors flex items-center gap-3"
                                >
                                    <i className="fa-solid fa-bell w-5 text-center text-base text-primary-light dark:text-primary"></i>
                                    <span className="font-medium text-sm">Configure Alerts</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                    
                    {/* View Options Section */}
                    <div>
                        <h4 className="px-2 pb-1 font-semibold text-medium-text-light dark:text-medium-text uppercase tracking-wider text-xs">View Options</h4>
                        <ul className="space-y-1">
                            <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label className="font-medium text-sm pr-4 text-dark-text dark:text-light-text flex-grow">Candles Displayed</label>
                                    <button
                                        onClick={handleCandleDisplayChange}
                                        className="w-16 h-8 text-center font-semibold rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary-light dark:focus:ring-primary outline-none transition-colors hover:bg-light-border dark:hover:bg-dark-border"
                                        aria-label={`Change number of candles displayed. Current value: ${settings.candlesDisplayed}`}
                                    >
                                        {settings.candlesDisplayed}
                                    </button>
                                </div>
                            </li>
                            <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label htmlFor="stoch-view-toggle" className="font-medium text-sm cursor-pointer pr-4 text-dark-text dark:text-light-text flex-grow">Stochastic View</label>
                                    <div className="relative">
                                        <input type="checkbox" id="stoch-view-toggle" className="sr-only peer" checked={settings.showStochView} onChange={(e) => onSettingChange('showStochView', e.target.checked)} />
                                        <div className="w-10 h-5 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-light dark:peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            </li>
                             <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label htmlFor="wavetrend-view-toggle" className="font-medium text-sm cursor-pointer pr-4 text-dark-text dark:text-light-text flex-grow">WaveTrend View</label>
                                    <div className="relative">
                                        <input type="checkbox" id="wavetrend-view-toggle" className="sr-only peer" checked={settings.showWaveTrendView} onChange={(e) => onSettingChange('showWaveTrendView', e.target.checked)} />
                                        <div className="w-10 h-5 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-light dark:peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            </li>
                             <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label htmlFor="kiwihunt-view-toggle" className="font-medium text-sm cursor-pointer pr-4 text-dark-text dark:text-light-text flex-grow">KiwiHunt View</label>
                                    <div className="relative">
                                        <input type="checkbox" id="kiwihunt-view-toggle" className="sr-only peer" checked={settings.showKiwiHuntView} onChange={(e) => onSettingChange('showKiwiHuntView', e.target.checked)} />
                                        <div className="w-10 h-5 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-light dark:peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            </li>
                            <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label htmlFor="heatmap-view-toggle" className="font-medium text-sm cursor-pointer pr-4 text-dark-text dark:text-light-text flex-grow">Heatmap View</label>
                                    <div className="relative">
                                        <input type="checkbox" id="heatmap-view-toggle" className="sr-only peer" checked={settings.showHeatmapView} onChange={(e) => onSettingChange('showHeatmapView', e.target.checked)} />
                                        <div className="w-10 h-5 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-light dark:peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            </li>
                            <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label htmlFor="price-view-toggle" className="font-medium text-sm cursor-pointer pr-4 text-dark-text dark:text-light-text flex-grow">Price View</label>
                                    <div className="relative">
                                        <input type="checkbox" id="price-view-toggle" className="sr-only peer" checked={settings.showPriceView} onChange={(e) => onSettingChange('showPriceView', e.target.checked)} />
                                        <div className="w-10 h-5 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-light dark:peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            </li>
                             <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label htmlFor="volume-view-toggle" className="font-medium text-sm cursor-pointer pr-4 text-dark-text dark:text-light-text flex-grow">Volume Delta View</label>
                                    <div className="relative">
                                        <input type="checkbox" id="volume-view-toggle" className="sr-only peer" checked={settings.showVolumeView} onChange={(e) => onSettingChange('showVolumeView', e.target.checked)} />
                                        <div className="w-10 h-5 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-light dark:peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            </li>
                             <li>
                                <div className="p-2.5 rounded-lg bg-light-card/80 dark:bg-dark-card/80 flex items-center justify-between">
                                    <label htmlFor="volume-bar-view-toggle" className="font-medium text-sm cursor-pointer pr-4 text-dark-text dark:text-light-text flex-grow">Volume Bar View</label>
                                    <div className="relative">
                                        <input type="checkbox" id="volume-bar-view-toggle" className="sr-only peer" checked={settings.showVolumeBarView} onChange={(e) => onSettingChange('showVolumeBarView', e.target.checked)} />
                                        <div className="w-10 h-5 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-light dark:peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>


                {/* Footer (Reset button) */}
                <div className="p-3 mt-auto border-t border-light-border dark:border-dark-border">
                    <button
                        onClick={handleResetClick}
                        className="w-full p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors flex items-center justify-center gap-3"
                    >
                         <i className="fa-solid fa-broom w-5 text-center text-base"></i>
                         <span className="font-medium text-sm">Reset App</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SettingsPanel;