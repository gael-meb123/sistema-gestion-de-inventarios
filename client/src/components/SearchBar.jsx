import React from 'react'

export default function SearchBar({ value, onChange, placeholder = 'Search products...' }) {
  return (
    <div className="searchbar">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar productos"
      />
    </div>
  )
}
