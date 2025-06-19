import React from 'react';
import { Search, X } from 'lucide-react';
import { useSearchBox } from 'react-instantsearch';

interface SearchBoxProps {
  placeholder?: string;
  className?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  placeholder = "Search tenders by title, description, buyer, or category...",
  className = ""
}) => {
  const { query, refine, clear } = useSearchBox();

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => refine(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBox;