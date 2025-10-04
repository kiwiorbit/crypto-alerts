


import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import CryptoHeader from './components/CryptoHeader';
import Grid from './components/Grid';
import Heatmap from './components/Heatmap';
import PriceGrid from './components/PriceGrid';
import StochGrid from './components/StochGrid';
import WaveTrendGrid from './components/WaveTrendGrid';
import KiwiHuntGrid from './components/KiwiHuntGrid';
import VolumeGrid from './components/VolumeGrid';
import VolumeBarGrid from './components/VolumeBarGrid';
import Modal from './components/Modal';
import PriceDetailModal from './components/PriceDetailModal';
import StochDetailModal from './components/StochDetailModal';
import WaveTrendDetailModal from './components/WaveTrendDetailModal';
import KiwiHuntDetailModal from './components/KiwiHuntDetailModal';
import VolumeDetailModal from './components/VolumeDetailModal';
import SettingsPanel from './components/SettingsPanel';
import Footer from './components/Footer';
import AssetListModal from './components/AssetListModal';
import FullViewPage from './components/FullViewPage';
import AlertsModal from './components/AlertsModal';
import { TIMEFRAMES } from './constants';
import type { ViewMode } from './types';
import ScreenLock from './components/ScreenLock';

// === Splash Screen Component ===
const SplashScreen: React.FC = () => {
  return (
    <div className="splash-screen" aria-live="polite" aria-label="Loading Crypto RSI Scanner">
      <div className="splash-content">
        <svg className="splash-logo" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M 10 70 L 40 20 L 60 60 L 90 10 L 120 70 L 150 30 L 190 60" />
        </svg>
        <h1 className="splash-title">Crypto RSI Scanner</h1>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
    const {
        isInitializing,
        // User Settings
        settings,
        theme,
        favorites,
        userSymbols,
        allSymbols,
        showFavoritesOnly,
        sortOrder,
        viewMode,
        page,
        handleThemeToggle,
        handleSettingChange,
        handleAlertConditionChange,
        // FIX: Destructure handleTrailingStopSettingChange from useAppContext.
        handleTrailingStopSettingChange,
        toggleFavorite,
        handleShowFavoritesOnlyToggle,
        handleSortChange,
        handleViewModeChange,
        handleSaveAssetList,
        handleNavigateToFullView,
        handleNavigateBack,
        handleResetSettings,
        // Symbol Data
        symbolsData,
        loading,
        timeframe,
        lastDataFetch,
        handleTimeframeChange,
        // Notifications
        activeToast,
        notifications,
        handleToastFinished,
        markNotificationsAsRead,
        clearNotifications,
        ToastContainer,
        handleNotificationClick,
        // UI State
        activeSymbol,
        activeModal,
        modalInitialState,
        isSettingsOpen,
        isAssetModalOpen,
        isAlertsModalOpen,
        handleSelectRsiSymbol,
        handleSelectStochSymbol,
        handleSelectPriceSymbol,
        handleSelectWaveTrendSymbol,
        handleSelectKiwiHuntSymbol,
        handleSelectVolumeSymbol,
        handleCloseModal,
        handleSettingsToggle,
        setIsSettingsOpen,
        setIsAssetModalOpen,
        setIsAlertsModalOpen,
        searchTerm,
        handleSearchChange,
        handleSwitchToPriceChart,
        handleSwitchToRsiChart,
        handleSwitchToStochChart,
        handleSwitchToWaveTrendChart,
        handleSwitchToKiwiHuntChart,
        displayedSymbols,
        // Lock State
        isLocked,
        unlockApp,
    } = useAppContext();

    const allowedWaveTrendTimeframes = ['15m', '1h', '4h', '1d'];
    const isWaveTrendAllowed = allowedWaveTrendTimeframes.includes(timeframe);
    
    const allowedKiwiHuntTimeframes = ['15m', '1h', '4h', '1d'];
    const isKiwiHuntAllowed = allowedWaveTrendTimeframes.includes(timeframe);

    useEffect(() => {
        if (viewMode === 'waveTrend' && !isWaveTrendAllowed) {
            handleViewModeChange('chart');
        }
        if (viewMode === 'kiwiHunt' && !isKiwiHuntAllowed) {
            handleViewModeChange('chart');
        }
    }, [timeframe, viewMode, isWaveTrendAllowed, isKiwiHuntAllowed, handleViewModeChange]);

    if (isInitializing) return <SplashScreen />;
    
    if (page === 'full-view' && activeSymbol && symbolsData[activeSymbol]) {
        return <FullViewPage symbol={activeSymbol} data={symbolsData[activeSymbol]} onBack={handleNavigateBack} settings={settings} timeframe={timeframe} />;
    }
    
    const getSortButtonContent = () => {
        if (viewMode === 'price') {
            switch (sortOrder) {
                case 'chg-asc': return <>Chg % <i className="fa-solid fa-arrow-up text-xs"></i></>;
                case 'chg-desc': return <>Chg % <i className="fa-solid fa-arrow-down text-xs"></i></>;
                default: return <>Chg %</>;
            }
        }
        if (viewMode === 'stoch') {
            switch (sortOrder) {
                case 'stoch-asc': return <>%K <i className="fa-solid fa-arrow-up text-xs"></i></>;
                case 'stoch-desc': return <>%K <i className="fa-solid fa-arrow-down text-xs"></i></>;
                default: return <>Sort by %K</>;
            }
        }
        if (viewMode === 'waveTrend') {
            switch (sortOrder) {
                case 'waveTrend-asc': return <>WT <i className="fa-solid fa-arrow-up text-xs"></i></>;
                case 'waveTrend-desc': return <>WT <i className="fa-solid fa-arrow-down text-xs"></i></>;
                default: return <>Sort by WT</>;
            }
        }
        if (viewMode === 'kiwiHunt') {
            switch (sortOrder) {
                case 'kiwiHunt-asc': return <>Q1 <i className="fa-solid fa-arrow-up text-xs"></i></>;
                case 'kiwiHunt-desc': return <>Q1 <i className="fa-solid fa-arrow-down text-xs"></i></>;
                default: return <>Sort by Q1</>;
            }
        }
        if (viewMode === 'volume') {
            switch (sortOrder) {
                case 'buy-count-desc': return <>Buys <i className="fa-solid fa-arrow-down text-xs"></i></>;
                case 'sell-count-desc': return <>Sells <i className="fa-solid fa-arrow-down text-xs"></i></>;
                case 'net-volume-desc': return <>Net Vol <i className="fa-solid fa-arrow-down text-xs"></i></>;
                case 'net-volume-asc': return <>Net Vol <i className="fa-solid fa-arrow-up text-xs"></i></>;
                default: return <>Sort by Volume</>;
            }
        }
        if (viewMode === 'volume-bar') {
             switch (sortOrder) {
                case 'green-volume-desc': return <>Buy Vol <i className="fa-solid fa-arrow-down text-xs"></i></>;
                case 'red-volume-desc': return <>Sell Vol <i className="fa-solid fa-arrow-down text-xs"></i></>;
                case 'total-volume-desc': return <>Total Vol <i className="fa-solid fa-arrow-down text-xs"></i></>;
                case 'total-volume-asc': return <>Total Vol <i className="fa-solid fa-arrow-up text-xs"></i></>;
                default: return <>Sort by Volume</>;
            }
        }
        switch (sortOrder) {
            case 'rsi-asc': return <>RSI <i className="fa-solid fa-arrow-up text-xs"></i></>;
            case 'rsi-desc': return <>RSI <i className="fa-solid fa-arrow-down text-xs"></i></>;
            default: return <>Sort by RSI</>;
        }
    };
    const isSortActive = sortOrder !== 'default';

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-dark-text dark:text-light-text font-sans flex flex-col">
            {isLocked && <ScreenLock onUnlock={unlockApp} />}
            <ToastContainer toast={activeToast} onFinish={handleToastFinished} onClick={handleNotificationClick} />
            <div className="container mx-auto p-4 flex-grow">
                <CryptoHeader
                    onTimeframeChange={handleTimeframeChange}
                    onSettingsToggle={handleSettingsToggle}
                    timeframe={timeframe}
                    timeframes={TIMEFRAMES}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    notifications={notifications}
                    onClearNotifications={clearNotifications}
                    onMarkNotificationsRead={markNotificationsAsRead}
                    settings={settings}
                    onNotificationClick={handleNotificationClick}
                />
                <main className="pt-40 md:pt-24">
                    <div className="flex flex-wrap justify-end items-center gap-4 mb-4">
                        <div className="flex items-center gap-1 bg-light-card dark:bg-dark-card p-1 rounded-lg border border-light-border dark:border-dark-border">
                            <button onClick={() => handleViewModeChange('chart')} className={`px-3 py-2 text-sm rounded-md transition ${viewMode === 'chart' ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'}`} aria-label="RSI Chart View" title="RSI Chart View"><i className="fa-solid fa-chart-line"></i></button>
                            {settings.showStochView && <button onClick={() => handleViewModeChange('stoch')} className={`px-3 py-2 text-sm rounded-md transition ${viewMode === 'stoch' ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'}`} aria-label="Stochastic RSI View" title="Stochastic RSI View"><i className="fa-solid fa-tornado"></i></button>}
                            {settings.showKiwiHuntView && (
                                <button 
                                    onClick={() => handleViewModeChange('kiwiHunt')} 
                                    disabled={!isKiwiHuntAllowed}
                                    className={`px-3 py-2 text-sm rounded-md transition ${viewMode === 'kiwiHunt' ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'} disabled:opacity-50 disabled:cursor-not-allowed`} 
                                    aria-label="KiwiHunt View" 
                                    title={isKiwiHuntAllowed ? "KiwiHunt View" : "Available on 15m, 1h, 4h, 1d"}
                                >
                                    <i className="fa-solid fa-rocket"></i>
                                </button>
                            )}
                            {settings.showWaveTrendView && (
                                <button
                                    onClick={() => handleViewModeChange('waveTrend')}
                                    disabled={!isWaveTrendAllowed}
                                    className={`px-3 py-2 text-sm rounded-md transition ${viewMode === 'waveTrend' ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    aria-label="WaveTrend View"
                                    title={isWaveTrendAllowed ? "WaveTrend View" : "Available on 15m, 1h, 4h, 1d"}
                                >
                                    <i className="fa-solid fa-water"></i>
                                </button>
                            )}
                            {settings.showHeatmapView && <button onClick={() => handleViewModeChange('heatmap')} className={`px-3 py-2 text-sm rounded-md transition ${viewMode === 'heatmap' ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'}`} aria-label="Heatmap View" title="Heatmap View"><i className="fa-solid fa-table-cells"></i></button>}
                            {settings.showPriceView && <button onClick={() => handleViewModeChange('price')} className={`px-3 py-2 text-sm rounded-md transition ${viewMode === 'price' ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'}`} aria-label="Price Chart View" title="Price Chart View"><i className="fa-solid fa-chart-area"></i></button>}
                            {settings.showVolumeView && <button onClick={() => handleViewModeChange('volume')} className={`px-3 py-2 text-sm rounded-md transition ${viewMode === 'volume' ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'}`} aria-label="Volume Delta View" title="Volume Delta View"><i className="fa-solid fa-bars-staggered"></i></button>}
                            {settings.showVolumeBarView && <button onClick={() => handleViewModeChange('volume-bar')} className={`px-3 py-2 text-sm rounded-md transition ${viewMode === 'volume-bar' ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg' : 'text-medium-text-light dark:text-medium-text hover:bg-light-border dark:hover:bg-dark-border'}`} aria-label="Volume Bar View" title="Volume Bar View"><i className="fa-solid fa-chart-simple"></i></button>}
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleShowFavoritesOnlyToggle} className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 border ${showFavoritesOnly ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg border-transparent' : 'bg-light-card dark:bg-dark-card text-medium-text-light dark:text-medium-text border-light-border dark:border-dark-border hover:bg-light-border dark:hover:bg-dark-border'}`} aria-pressed={showFavoritesOnly} aria-label="Toggle favorites filter">
                                <i className={`fa-star ${showFavoritesOnly ? 'fa-solid' : 'fa-regular'}`}></i>
                            </button>
                            <button onClick={handleSortChange} className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 border ${isSortActive ? 'bg-primary-light dark:bg-primary text-white dark:text-dark-bg border-transparent' : 'bg-light-card dark:bg-dark-card text-medium-text-light dark:text-medium-text border-light-border dark:border-dark-border hover:bg-light-border dark:hover:bg-dark-border'}`} aria-label="Cycle sort order">
                                {getSortButtonContent()}
                            </button>
                        </div>
                    </div>
                    {viewMode === 'chart' && <Grid loading={loading} symbols={displayedSymbols} symbolsData={symbolsData} onSelectSymbol={handleSelectRsiSymbol} settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} />}
                    {viewMode === 'stoch' && <StochGrid loading={loading} symbols={displayedSymbols} symbolsData={symbolsData} onSelectSymbol={handleSelectStochSymbol} settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} />}
                    {viewMode === 'waveTrend' && isWaveTrendAllowed && <WaveTrendGrid loading={loading} symbols={displayedSymbols} symbolsData={symbolsData} onSelectSymbol={handleSelectWaveTrendSymbol} settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} timeframe={timeframe} />}
                    {viewMode === 'kiwiHunt' && isKiwiHuntAllowed && <KiwiHuntGrid loading={loading} symbols={displayedSymbols} symbolsData={symbolsData} onSelectSymbol={handleSelectKiwiHuntSymbol} settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} />}
                    {viewMode === 'heatmap' && <Heatmap loading={loading} symbols={displayedSymbols} symbolsData={symbolsData} onSelectSymbol={handleSelectRsiSymbol} favorites={favorites} onToggleFavorite={toggleFavorite} />}
                    {viewMode === 'price' && <PriceGrid loading={loading} symbols={displayedSymbols} symbolsData={symbolsData} onSelectSymbol={handleSelectPriceSymbol} settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} />}
                    {viewMode === 'volume' && <VolumeGrid loading={loading} symbols={displayedSymbols} symbolsData={symbolsData} onSelectSymbol={handleSelectVolumeSymbol} settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} />}
                    {viewMode === 'volume-bar' && <VolumeBarGrid loading={loading} symbols={displayedSymbols} symbolsData={symbolsData} onSelectSymbol={handleSelectVolumeSymbol} settings={settings} favorites={favorites} onToggleFavorite={toggleFavorite} sortOrder={sortOrder} />}
                </main>
            </div>
            {activeModal === 'rsi' && activeSymbol && symbolsData[activeSymbol] && <Modal symbol={activeSymbol} data={symbolsData[activeSymbol]} onClose={handleCloseModal} settings={settings} timeframe={timeframe} onSwitchToPriceChart={handleSwitchToPriceChart} onNavigateToFullView={handleNavigateToFullView} onSwitchToStochChart={handleSwitchToStochChart} />}
            {activeModal === 'price' && activeSymbol && symbolsData[activeSymbol] && <PriceDetailModal symbol={activeSymbol} data={symbolsData[activeSymbol]} onClose={handleCloseModal} settings={settings} timeframe={timeframe} onSwitchToRsiChart={handleSwitchToRsiChart} onSwitchToStochChart={handleSwitchToStochChart} onSwitchToKiwiHuntChart={handleSwitchToKiwiHuntChart} initialState={modalInitialState} />}
            {activeModal === 'stoch' && activeSymbol && symbolsData[activeSymbol] && <StochDetailModal symbol={activeSymbol} data={symbolsData[activeSymbol]} onClose={handleCloseModal} settings={settings} timeframe={timeframe} onSwitchToRsiChart={handleSwitchToRsiChart} onSwitchToPriceChart={handleSwitchToPriceChart} onSwitchToWaveTrendChart={handleSwitchToWaveTrendChart} />}
            {activeModal === 'waveTrend' && activeSymbol && symbolsData[activeSymbol] && <WaveTrendDetailModal symbol={activeSymbol} data={symbolsData[activeSymbol]} onClose={handleCloseModal} settings={settings} timeframe={timeframe} onSwitchToRsiChart={handleSwitchToRsiChart} onSwitchToPriceChart={handleSwitchToPriceChart} onSwitchToStochChart={handleSwitchToStochChart} />}
            {activeModal === 'kiwiHunt' && activeSymbol && symbolsData[activeSymbol] && <KiwiHuntDetailModal symbol={activeSymbol} data={symbolsData[activeSymbol]} onClose={handleCloseModal} settings={settings} timeframe={timeframe} onSwitchToPriceChart={handleSwitchToPriceChart} />}
            {activeModal === 'volume' && activeSymbol && symbolsData[activeSymbol] && <VolumeDetailModal symbol={activeSymbol} data={symbolsData[activeSymbol]} onClose={handleCloseModal} settings={settings} timeframe={timeframe} onSwitchToPriceChart={handleSwitchToPriceChart} onSwitchToRsiChart={handleSwitchToRsiChart} onSwitchToStochChart={handleSwitchToStochChart} />}

            <SettingsPanel 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                onOpenAssetModal={() => setIsAssetModalOpen(true)}
                onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
                onReset={handleResetSettings}
                theme={theme}
                onThemeToggle={handleThemeToggle}
                settings={settings}
                onSettingChange={handleSettingChange}
            />
            <AlertsModal
                isOpen={isAlertsModalOpen}
                onClose={() => setIsAlertsModalOpen(false)}
                settings={settings}
                onAlertConditionChange={handleAlertConditionChange}
                onTrailingStopSettingChange={handleTrailingStopSettingChange}
                timeframe={timeframe}
            />
            <AssetListModal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} onSave={handleSaveAssetList} allSymbols={allSymbols} currentSymbols={userSymbols} />
            <Footer />
        </div>
    );
}

const App: React.FC = () => (
    <AppProvider>
        <AppContent />
    </AppProvider>
);

export default App;