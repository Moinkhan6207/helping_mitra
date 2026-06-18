import React from 'react';
import { CategoryData } from '../types';

interface ServiceFilterProps {
  categories: CategoryData[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const ServiceFilter: React.FC<ServiceFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex space-x-2.5 min-w-max px-1">
        {/* 'All' option */}
        <button
          onClick={() => onSelectCategory('')}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
            selectedCategory === ''
              ? 'bg-primary-blue text-white border-primary-blue shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          All Services
        </button>

        {/* Categories list */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.slug)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
              selectedCategory === category.slug
                ? 'bg-primary-blue text-white border-primary-blue shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};
