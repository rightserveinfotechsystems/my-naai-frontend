import React, { useState, useEffect } from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  
  const safeTotalPages = Math.max(1, totalPages);
  
  const [inputPage, setInputPage] = useState(currentPage);

  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= safeTotalPages;

  const getButtonClass = (disabled) => 
    `page-link border-warning text-warning shadow-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const handleInputChange = (e) => {
    setInputPage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      let newPage = parseInt(inputPage);

      if (!isNaN(newPage) && newPage >= 1 && newPage <= safeTotalPages) {
        onPageChange(newPage);
      } else {
        setInputPage(currentPage);
      }
    }
  };

  const handleBlur = () => {
    setInputPage(currentPage);
  };

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination mb-0 align-items-center gap-1 flex-wrap">

        {/* Prev Text Button */}
        <li className={`page-item ${isFirstPage ? "disabled" : ""}`}>
          <button
            className={getButtonClass(isFirstPage)}
            onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
            disabled={isFirstPage}
          >
            <span className="d-none d-sm-inline">Prev</span>
            <span className="d-sm-none">P</span>
          </button>
        </li>

        {/* Arrow < */}
        <li className={`page-item ${isFirstPage ? "disabled" : ""}`}>
          <button
            className={getButtonClass(isFirstPage)}
            onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
            disabled={isFirstPage}
          >
            &lt;
          </button>
        </li>

        {/* --- INPUT FIELD FOR PAGE NUMBER --- */}
        <li className="page-item active">
          <div 
            className="page-link bg d-flex align-items-center px-2"
            style={{ cursor: 'text' }}
          >
            <input
              type="number"
              className="form-control p-0 text-center fw-bold text-white bg-transparent border-0 shadow-none"
              value={inputPage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              style={{ 
                width: '40px', 
                height: 'auto',
                fontSize: 'inherit',
                color: 'white' 
              }}
              min="1"
              max={safeTotalPages}
            />
         
          </div>
        </li>

        {/* Arrow > */}
        <li className={`page-item ${isLastPage ? "disabled" : ""}`}>
          <button
            className={getButtonClass(isLastPage)}
            onClick={() => !isLastPage && onPageChange(currentPage + 1)}
            disabled={isLastPage}
          >
            &gt;
          </button>
        </li>

        {/* Next Text Button */}
        <li className={`page-item ${isLastPage ? "disabled" : ""}`}>
          <button
            className={getButtonClass(isLastPage)}
            onClick={() => !isLastPage && onPageChange(currentPage + 1)}
            disabled={isLastPage}
          >
            <span className="d-none d-sm-inline">Last</span>
            <span className="d-sm-none">N</span>
          </button>
        </li>

      </ul>
    </nav>
  );
};

export default Pagination;