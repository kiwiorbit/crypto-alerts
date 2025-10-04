import React, { useState, useMemo, useEffect } from 'react';

interface AssetListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { allSymbols: string[], selectedSymbols: string[] }) => void;
    allSymbols: string[];
    currentSymbols: string[];
}

const AssetListModal: React.FC<AssetListModalProps> = ({ isOpen, onClose, onSave, allSymbols, currentSymbols }) => {
    const [editableSymbols, setEditableSymbols] = useState<string[]>(allSymbols);
    const [selectedSymbols, setSelectedSymbols] = useState(new Set(currentSymbols));
    const [searchTerm, setSearchTerm] = useState('');
    const [newSymbol, setNewSymbol] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setEditableSymbols(allSymbols);
            setSelectedSymbols(new Set(currentSymbols));
            setSearchTerm('');
            setNewSymbol('');
            setError('');
        }
    }, [isOpen, allSymbols, currentSymbols]);

    const filteredSymbols = useMemo(() => {
        return editableSymbols.filter(symbol => symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [editableSymbols, searchTerm]);

    const handleToggleSymbol = (symbol: string) => {
        const newSelection = new Set(selectedSymbols);
        if (newSelection.has(symbol)) {
            newSelection.delete(symbol);
        } else {
            newSelection.add(symbol);
        }
        setSelectedSymbols(newSelection);
    };

    const handleAddNewSymbol = () => {
        const symbolToAdd = newSymbol.trim().toUpperCase();
        if (!symbolToAdd) return;

        if (!/^[A-Z0-9]{2,12}(\.P)?$/.test(symbolToAdd)) {
            setError('Invalid symbol format (e.g., BTCUSDT or BTCUSDT.P).');
            return;
        }

        if (!editableSymbols.includes(symbolToAdd)) {
            const newEditableSymbols = [...editableSymbols, symbolToAdd];
            setEditableSymbols(newEditableSymbols);
            
            const newSelection = new Set(selectedSymbols);
            newSelection.add(symbolToAdd);
            setSelectedSymbols(newSelection);

            setNewSymbol('');
            setError('');
        } else {
            setError('Symbol already exists in the master list.');
        }
    };

    const handleRemoveSymbol = (symbolToRemove: string) => {
        setEditableSymbols(editableSymbols.filter(s => s !== symbolToRemove));
        
        const newSelection = new Set(selectedSymbols);
        newSelection.delete(symbolToRemove);
        setSelectedSymbols(newSelection);
    };
    
    const handleSelectAll = () => setSelectedSymbols(new Set(editableSymbols));
    const handleDeselectAll = () => setSelectedSymbols(new Set());

    const handleSave = () => {
        onSave({ allSymbols: editableSymbols, selectedSymbols: Array.from(selectedSymbols) });
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-dark-bg/80 dark:bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] max-h-[700px] flex flex-col border border-light-border/50 dark:border-dark-border/50">
                <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                    <h2 className="text-xl font-bold text-dark-text dark:text-light-text">Manage & Customize Assets</h2>
                    <button onClick={onClose} className="text-2xl text-medium-text-light dark:text-medium-text hover:text-dark-text dark:hover:text-light-text transition-colors" aria-label="Close asset editor">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div className="p-4 border-b border-light-border dark:border-dark-border">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. BTCUSDT"
                            value={newSymbol}
                            onChange={(e) => { setNewSymbol(e.target.value); setError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNewSymbol()}
                            className={`flex-grow h-10 rounded-lg bg-light-bg/80 dark:bg-dark-bg/80 px-4 text-dark-text dark:text-light-text outline-none border ${error ? 'border-red-500' : 'border-light-border dark:border-dark-border'} focus:ring-2 focus:ring-primary-light dark:focus:ring-primary`}
                        />
                        <button onClick={handleAddNewSymbol} className="px-4 h-10 font-semibold text-white dark:text-dark-bg bg-primary-light dark:bg-primary rounded-lg hover:opacity-90 transition-opacity">Add</button>
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <div className="p-4 border-b border-light-border dark:border-dark-border flex flex-wrap gap-4 items-center">
                    <div className="relative flex-grow">
                        <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-medium-text-light dark:text-medium-text"></i>
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 rounded-lg bg-light-bg/80 dark:bg-dark-bg/80 pl-10 pr-4 text-dark-text dark:text-light-text outline-none border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary"
                        />
                    </div>
                    <button onClick={handleSelectAll} className="px-3 py-2 text-sm font-semibold rounded-md bg-light-bg/80 dark:bg-dark-bg/80 hover:bg-light-border dark:hover:bg-dark-border transition">Select All</button>
                    <button onClick={handleDeselectAll} className="px-3 py-2 text-sm font-semibold rounded-md bg-light-bg/80 dark:bg-dark-bg/80 hover:bg-light-border dark:hover:bg-dark-border transition">Deselect All</button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto overflow-x-hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredSymbols.map(symbol => (
                        <div key={symbol} className="group flex items-center p-2 rounded-lg bg-light-bg/80 dark:bg-dark-bg/80">
                            <input
                                type="checkbox"
                                id={`symbol-checkbox-${symbol}`}
                                checked={selectedSymbols.has(symbol)}
                                onChange={() => handleToggleSymbol(symbol)}
                                className="h-5 w-5 rounded border-gray-300 text-primary-light dark:text-primary bg-light-card dark:bg-dark-card focus:ring-primary-light dark:focus:ring-primary"
                            />
                            <label htmlFor={`symbol-checkbox-${symbol}`} className="ml-3 font-medium text-dark-text dark:text-light-text flex-grow cursor-pointer truncate" title={symbol}>{symbol}</label>
                             <button 
                                onClick={() => handleRemoveSymbol(symbol)} 
                                className="ml-2 text-medium-text-light dark:text-medium-text hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Remove ${symbol} from list`}
                            >
                                <i className="fas fa-times-circle"></i>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center p-4 border-t border-light-border dark:border-dark-border">
                    <span className="text-sm font-semibold text-medium-text-light dark:text-medium-text">
                        {selectedSymbols.size} / {editableSymbols.length} selected
                    </span>
                    <button onClick={handleSave} className="px-6 py-2 font-bold text-white dark:text-dark-bg bg-primary-light dark:bg-primary rounded-lg hover:opacity-90 transition-opacity">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssetListModal;