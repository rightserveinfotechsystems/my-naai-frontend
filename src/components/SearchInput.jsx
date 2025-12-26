const SearchInput = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="input-group position-relative">
      {/* Search Icon - INSIDE INPUT FIELD */}
      <span className="input-group-text bg-white border-end-0 pe-0 position-relative">
        <label htmlFor="searchInput" className="labelforsearch mb-0 p-0">
          <svg 
            className="searchIcon" 
            viewBox="0 0 512 512" 
            width="18" 
            height="18"
            fill="currentColor"
          >
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
          </svg>
        </label>
      </span>
      
      {/* Main Input Field */}
      <input
        id="searchInput"
        type="text"
        className="form-control border-start-0 ps-2 border border-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: '38px' }}
      />
      
      {/* Clear Button - Jab text ho tab dikhe */}
      {value && (
        <button
          type="button"
          className="btn btn-outline-secondary border-start-0 px-2"
          onClick={() => onChange("")}
          style={{ zIndex: 10 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchInput;
