import { useState } from 'react';

const PRESET_COLORS = [
  { name: 'Brand Pink', value: '#FF1B6D' },
  { name: 'Royal Blue', value: '#4169E1' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Sunset Orange', value: '#FF6B35' },
  { name: 'Deep Purple', value: '#8B5CF6' },
];

export default function ColorPicker({ label, value, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">{label}</label>
      
      {/* Preset Color Options */}
      <div className="grid grid-cols-5 gap-3 mb-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={`group relative aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
              value === color.value 
                ? 'border-white ring-2 ring-white ring-offset-2 ring-offset-black' 
                : 'border-gray-600 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color.value }}
          >
            {/* Checkmark when selected */}
            {value === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Tooltip on hover */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
              {color.name}
            </span>
          </button>
        ))}
      </div>

      {/* Advanced Color Picker Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-2 mb-3"
      >
        {showAdvanced ? '▼' : '▶'} Advanced Color Selector
      </button>

      {/* Advanced Color Picker */}
      {showAdvanced && (
        <div className="mt-3 p-4 bg-black/40 rounded-lg border border-gray-700">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-12 w-24 rounded cursor-pointer border-2 border-gray-600 bg-transparent"
            />
            <div className="flex-1">
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  // Validate hex color format
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value) || e.target.value === '#') {
                    onChange(e.target.value);
                  }
                }}
                placeholder="#000000"
                className="w-full px-3 py-2 bg-black/40 border border-gray-600 rounded text-white text-sm font-mono uppercase"
              />
            </div>
          </div>
        </div>
      )}

      {/* Current Color Preview */}
      <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
        <span>Current:</span>
        <div 
          className="w-8 h-8 rounded border-2 border-gray-600"
          style={{ backgroundColor: value }}
        />
        <span className="font-mono text-xs">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}