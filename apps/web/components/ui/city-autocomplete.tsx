import React, { useState, useRef, useEffect } from 'react'
import { Input, InputProps } from './input'
import { geoApi } from '@repo/shared'

interface CityAutocompleteProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
}

export const CityAutocomplete = React.forwardRef<HTMLInputElement, CityAutocompleteProps>(
  ({ value, onChange, ...props }, ref) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const searchCities = async () => {
        if (!value || value.length < 2) {
          setCities([]);
          return;
        }
        setLoading(true);
        try {
          const results = await geoApi.searchCities(value);
          setCities(results);
        } catch (error) {
          console.error("Failed to fetch cities", error);
        } finally {
          setLoading(false);
        }
      };

      const debounceId = setTimeout(searchCities, 300);
      return () => clearTimeout(debounceId);
    }, [value]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={wrapperRef}>
        <Input
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          {...props}
        />
        {showSuggestions && cities.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-auto">
            {cities.map((city) => (
              <li
                key={city}
                className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors font-medium border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                onClick={() => {
                  onChange(city);
                  setShowSuggestions(false);
                }}
              >
                {city}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

CityAutocomplete.displayName = 'CityAutocomplete';
