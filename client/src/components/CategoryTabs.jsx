import React from 'react'

const DEFAULT_CATEGORIES = ['All', 'Beers', 'Sodas', 'Spirits', 'Wines', 'Unit sales']

export default function CategoryTabs({ categories = DEFAULT_CATEGORIES, active, onChange }) {
  return (
    <div className="category-tabs">
      {categories.map((c) => (
        <button
          key={c}
          className={`category-tab ${active === c ? 'active' : ''}`}
          type="button"
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
