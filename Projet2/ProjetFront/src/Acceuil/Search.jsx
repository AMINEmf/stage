// Search.jsx
import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const Search = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <Form inline>
      <div className="position-relative">
        <Form.Control
          type="text"
          placeholder="Chercher"
          className="mr-sm-2 pr-4" // Add padding for the search icon
          value={searchTerm}
          onChange={handleSearch}
          style={{ borderRadius: '20px' }}
        />
       <FaSearch
          className="position-absolute top-50 translate-middle-y"
          style={{ right: '10px' }}
        />
      </div>
    </Form>
  );
};

export default Search;
