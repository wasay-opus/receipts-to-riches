import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface CountryInfo {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  format: string;
  maxDigits: number;
}

export const COUNTRIES: CountryInfo[] = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', format: '### ### ####', maxDigits: 10 },
];

/**
 * Strips all spaces, dashes, and parentheses to produce clean E.164 phone format
 * e.g. "+1 415 555 2671" -> "+14155552671"
 * This guarantees 100% backend and Twilio SMS gateway compatibility.
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  // If phone already starts with +, preserve the +
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  // If 10 digits without +, default to US +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // If 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
};

export const formatNationalNumber = (rawDigits: string, formatPattern: string = '### ### ####'): string => {
  const digits = rawDigits.replace(/\D/g, '');
  if (!digits) return '';

  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < formatPattern.length && digitIndex < digits.length; i++) {
    if (formatPattern[i] === '#') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += formatPattern[i];
    }
  }

  // If there are more digits than format pattern, append them with a space
  if (digitIndex < digits.length) {
    formatted += ' ' + digits.substring(digitIndex);
  }

  return formatted.trim();
};

export interface PhoneInputProps {
  label?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  name = 'phone',
  value = '',
  onChange,
  onBlur,
  error,
  placeholder,
  className = '',
  disabled = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]);
  const [nationalNumber, setNationalNumber] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Sync with external value
  useEffect(() => {
    if (!value) {
      setNationalNumber('');
      return;
    }

    const trimmed = value.trim();

    // Check if current selectedCountry dialCode already matches
    let country = selectedCountry;
    if (!trimmed.startsWith(country.dialCode)) {
      // Prioritize longest dial code matches
      const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const matched = sorted.find((c) => trimmed.startsWith(c.dialCode));
      if (matched) {
        country = matched;
        setSelectedCountry(matched);
      }
    }

    const remainder = trimmed.startsWith(country.dialCode)
      ? trimmed.slice(country.dialCode.length).trim()
      : trimmed;
    let raw = remainder.replace(/\D/g, '');
    if (country.code === 'US' || country.dialCode === '+1') {
      if (raw.length === 11 && raw.startsWith('1')) {
        raw = raw.slice(1);
      }
    }
    raw = raw.slice(0, country.maxDigits);
    const newFormatted = formatNationalNumber(raw, country.format);
    setNationalNumber((prev) => (prev !== newFormatted ? newFormatted : prev));
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: CountryInfo) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setCountrySearch('');

    const raw = nationalNumber.replace(/\D/g, '').slice(0, country.maxDigits);
    const newFormatted = formatNationalNumber(raw, country.format);
    setNationalNumber(newFormatted);

    if (onChange) {
      onChange(newFormatted ? `${country.dialCode} ${newFormatted}` : '');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');

    // For US (+1): If user types/pastes a leading 1 (the country code), strip it
    // because the +1 country code is already selected in the UI.
    // Also US area codes (NANP) can never start with 0 or 1.
    if (selectedCountry.code === 'US' || selectedCountry.dialCode === '+1') {
      if (raw.startsWith('1')) {
        raw = raw.replace(/^1+/, '');
      } else if (raw.startsWith('0')) {
        raw = raw.replace(/^0+/, '');
      }
    }

    raw = raw.slice(0, selectedCountry.maxDigits);
    const formatted = formatNationalNumber(raw, selectedCountry.format);

    setNationalNumber(formatted);

    if (onChange) {
      onChange(formatted ? `${selectedCountry.dialCode} ${formatted}` : '');
    }
  };

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const q = countrySearch.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const isSingleCountry = COUNTRIES.length <= 1;

  const activeBorderColor = error
    ? 'var(--error)'
    : isFocused
    ? 'var(--green)'
    : 'var(--border-color)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
          {label}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          width: '100%',
          borderRadius: '14px',
          boxShadow: isFocused ? '0 0 0 3px rgba(0, 103, 77, 0.15)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Country Flag & Code Trigger */}
        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex' }}>
          <button
            type="button"
            disabled={disabled}
            onClick={isSingleCountry ? undefined : () => setDropdownOpen((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 12px',
              background: 'var(--bg-input)',
              border: `1px solid ${activeBorderColor}`,
              borderRight: 'none',
              borderRadius: '14px 0 0 14px',
              cursor: isSingleCountry || disabled ? 'default' : 'pointer',
              color: 'var(--text-main)',
              fontSize: '14px',
              fontWeight: 600,
              userSelect: 'none',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
              flexShrink: 0,
              minHeight: '48px',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{selectedCountry.flag}</span>
            <span style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>{selectedCountry.dialCode}</span>
            {!isSingleCountry && <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
          </button>

          {/* Country Selection Dropdown */}
          {!isSingleCountry && dropdownOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '280px',
                maxHeight: '300px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Search Box */}
              <div
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-input)',
                }}
              >
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country..."
                  autoFocus
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                    width: '100%',
                  }}
                />
                {countrySearch && (
                  <button
                    type="button"
                    onClick={() => setCountrySearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
              </div>

              {/* Countries List */}
              <div
                style={{
                  overflowY: 'auto',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  maxHeight: '230px',
                }}
              >
                {filteredCountries.map((c) => (
                  <div
                    key={`${c.code}-${c.dialCode}`}
                    onClick={() => handleCountrySelect(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedCountry.code === c.code ? 'rgba(0, 103, 77, 0.12)' : 'transparent',
                      color: selectedCountry.code === c.code ? 'var(--green)' : 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: selectedCountry.code === c.code ? 700 : 500,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCountry.code !== c.code) {
                        e.currentTarget.style.background = 'var(--bg-card-secondary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCountry.code !== c.code) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '17px' }}>{c.flag}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                        {c.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {c.dialCode}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formatted Phone Input Field */}
        <input
          type="tel"
          name={name}
          disabled={disabled}
          value={nationalNumber}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          placeholder={placeholder || (selectedCountry.code === 'US' ? '415 555 2671' : 'Phone number')}
          className={`form-input ${className}`}
          style={{
            borderRadius: '0 14px 14px 0',
            borderColor: activeBorderColor,
            boxShadow: 'none',
            paddingLeft: '14px',
            fontSize: '15px',
            letterSpacing: '0.4px',
            minHeight: '48px',
            flex: 1,
          }}
        />
      </div>

      {error && (
        <span style={{ fontSize: '12px', color: 'var(--error)', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
};
