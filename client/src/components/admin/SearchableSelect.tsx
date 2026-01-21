import React, { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps {
    options: any[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    labelKey?: string;
    valueKey?: string;
    required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options, value, onChange, placeholder = 'Select...',
    labelKey = 'name', valueKey = '_id', required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt[valueKey] === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => {
        const label = opt[labelKey] || '';
        const secondary = opt.email ? opt.email : '';
        const subNo = opt.subscriberNo ? opt.subscriberNo : '';
        const search = searchTerm.toLowerCase();
        return label.toString().toLowerCase().includes(search) ||
            secondary.toString().toLowerCase().includes(search) ||
            subNo.toString().toLowerCase().includes(search);
    });

    return (
        <div className="searchable-select" ref={wrapperRef}>
            <div
                className={`select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    <span className="selected-value">
                        {selectedOption.subscriberNo ? `[${selectedOption.subscriberNo}] ` : ''}
                        {selectedOption[labelKey]}
                        {selectedOption.email ? ` (${selectedOption.email})` : ''}
                    </span>
                ) : (
                    <span className="placeholder">{placeholder}</span>
                )}
                <span className="arrow">▼</span>
            </div>

            {isOpen && (
                <div className="select-dropdown">
                    <input
                        type="text"
                        className="dropdown-search"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                    <div className="options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt[valueKey]}
                                    className={`option-item ${opt[valueKey] === value ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(opt[valueKey]);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    <div className="opt-main">
                                        {opt.subscriberNo ? <span style={{ fontWeight: 'bold', marginRight: '5px', color: '#0369a1' }}>[{opt.subscriberNo}]</span> : null}
                                        {opt[labelKey]}
                                    </div>
                                    {opt.email && <div className="opt-sub">{opt.email}</div>}
                                </div>
                            ))
                        ) : (
                            <div className="no-options">No matches found</div>
                        )}
                    </div>
                </div>
            )}
            {required && <input type="hidden" value={value} required />}
        </div>
    );
};

export default SearchableSelect;
