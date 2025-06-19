import React from 'react';
import { useRefinementList, useCurrentRefinements } from 'react-instantsearch';
import { Filter, X } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  attribute: string;
  limit?: number;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, attribute, limit = 10 }) => {
  const { items, refine, searchForItems } = useRefinementList({
    attribute,
    limit,
    sortBy: ['count:desc', 'name:asc']
  });

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <label key={item.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={item.isRefined}
              onChange={() => refine(item.value)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 flex-1 truncate">
              {item.label}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {item.count}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

const ActiveFilters: React.FC = () => {
  const { items, refine } = useCurrentRefinements();

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-900 text-sm">Active Filters</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) =>
          item.refinements.map((refinement) => (
            <button
              key={`${item.attribute}-${refinement.value}`}
              onClick={() => refine(refinement)}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              <span>{refinement.label}</span>
              <X className="w-3 h-3" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

interface SearchFiltersProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ isOpen, onToggle }) => {
  return (
    <>
      {/* Mobile Filter Toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
      </button>

      {/* Filter Panel */}
      <div className={`
        ${isOpen ? 'block' : 'hidden'} lg:block
        bg-white rounded-lg border border-gray-200 p-6 space-y-6
      `}>
        <div className="flex items-center justify-between lg:justify-start">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ActiveFilters />
        
        <div className="space-y-6">
          <FilterSection
            title="Status"
            attribute="is_open"
            limit={5}
          />
          
          <FilterSection
            title="Category"
            attribute="category"
            limit={15}
          />
          
          <FilterSection
            title="Buyer Organization"
            attribute="buyer"
            limit={20}
          />
          
          <FilterSection
            title="Department"
            attribute="department"
            limit={15}
          />
        </div>
      </div>
    </>
  );
};

export default SearchFilters;