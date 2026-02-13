import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Optional secondary line (e.g. username) */
  subLabel?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Label for the control */
  label?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Search or select...',
  emptyMessage = 'No matches',
  disabled = false,
  id,
  className = '',
  label,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? (selectedOption.subLabel ? `${selectedOption.label} (${selectedOption.subLabel})` : selectedOption.label) : '';

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.subLabel?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : options;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery('');
    setHighlightIndex(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    const item = el.children[highlightIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [highlightIndex, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      if (e.key === 'Escape') {
        closeDropdown();
        return;
      }
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => (i < filtered.length ? i + 1 : i));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightIndex === 0) {
          onChange('');
        } else {
          const opt = filtered[highlightIndex - 1];
          if (opt) onChange(opt.value);
        }
        closeDropdown();
        return;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, filtered, highlightIndex, onChange, closeDropdown]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setHighlightIndex(0);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        id={id}
        aria-label={label ?? placeholder}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`
          min-h-[40px] w-full flex items-center gap-2 rounded-xl border bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-100 text-sm
          transition-all duration-200
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          ${open ? 'ring-2 ring-primary/30 border-primary shadow-lg' : 'border-slate-200 dark:border-slate-600'}
        `}
      >
        {open ? (
          <span className="flex-1 flex items-center gap-2 pl-3.5 py-2.5">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') e.preventDefault();
              }}
              placeholder={placeholder}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-inherit placeholder:text-slate-400"
              autoFocus
              aria-autocomplete="list"
              aria-expanded={open}
            />
          </span>
        ) : (
          <span className="flex-1 pl-3.5 py-2.5 truncate text-left">
            {displayLabel || <span className="text-slate-400">{placeholder}</span>}
          </span>
        )}
        <ChevronDownIcon
          className={`w-5 h-5 text-slate-400 shrink-0 mr-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl py-1 scroll-smooth"
        >
          <li
            role="option"
            aria-selected={value === ''}
            onClick={() => {
              onChange('');
              closeDropdown();
            }}
            onMouseEnter={() => setHighlightIndex(0)}
            className={`
              px-3.5 py-2.5 cursor-pointer text-sm transition-colors
              ${highlightIndex === 0 ? 'bg-slate-100 dark:bg-slate-700' : ''}
              hover:bg-slate-100 dark:hover:bg-slate-700
              ${value === '' ? 'text-primary font-medium' : 'text-slate-500 dark:text-slate-400'}
            `}
          >
            — None —
          </li>
          {filtered.length === 0 ? (
            <li className="px-3.5 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
                onClick={() => {
                  onChange(opt.value);
                  closeDropdown();
                }}
                onMouseEnter={() => setHighlightIndex(i + 1)}
                className={`
                  px-3.5 py-2.5 cursor-pointer text-sm transition-colors
                  ${value === opt.value ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium' : ''}
                  ${highlightIndex === i + 1 ? 'bg-slate-100 dark:bg-slate-700' : ''}
                  hover:bg-slate-100 dark:hover:bg-slate-700
                `}
              >
                <span className="block font-medium text-slate-900 dark:text-slate-100">{opt.label}</span>
                {opt.subLabel && (
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.subLabel}</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
