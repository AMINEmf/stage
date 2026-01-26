import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import { Pagination } from '@mui/material';

const ExpandRTable = ({
  columns,
  data,
  filteredData,
  searchTerm,
  highlightText,
  selectAll,
  selectedItems,
  handleSelectAllChange,
  handleCheckboxChange,
  handleEdit,
  handleDelete,
  handleDeleteSelected,
  rowsPerPage,
  page,
  handleChangePage,
  handleChangeRowsPerPage,
  expandedRows,
  expandedChambre,
  toggleRowExpansion,
  renderExpandedRow,
  renderCustomActions,
  expansionType = 'default',
  supportPDF = false,
}) => {
  const hasActions = handleEdit || handleDelete || renderCustomActions;
  const displayData = filteredData || data || [];
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const isRowExpanded = (itemId) => {
    switch (expansionType) {
      case 'default':
        return expandedRows && expandedRows[itemId];
      case 'chambre':
        return expandedChambre && expandedChambre[itemId];
      case 'both':
        return (expandedRows && expandedRows[itemId]) || (expandedChambre && expandedChambre[itemId]);
      default:
        return expandedRows && expandedRows[itemId];
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const filterData = (item, searchTerm) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    return columns.some(column => {
      const value = item[column.key];
      if (!value) return false;
      return String(value).toLowerCase().includes(term);
    });
  };

  const handleMuiChangePage = (event, newPage) => {
    handleChangePage(newPage);
  };

  const handleMuiChangeRowsPerPage = (event) => {
    handleChangeRowsPerPage({ target: { value: parseInt(event.target.value, 10) }});
  };

  const renderImageCell = (item, column) => {
    if (column.key === 'image' || column.key === 'img' || column.key === 'photo') {
      const imgSrc = item[column.key];
      if (imgSrc) {
        return (
          <img 
            src={imgSrc} 
            alt={item.designation || item.name || 'Image'} 
            className="w-16 h-16 object-cover rounded"
          />
        );
      }
      return null;
    }
    
    const cellContent = item[column.key] || '';
    
    return column.render 
      ? column.render(item, searchTerm, toggleRowExpansion) 
      : (highlightText 
          ? <span dangerouslySetInnerHTML={{ __html: highlightText(cellContent, searchTerm) }} /> 
          : cellContent
        );
  };

  const filteredItems = displayData.filter(item => filterData(item, searchTerm));

  // Styles pour la table
  const tableStyles = {
    boxShadow: 'none',
    borderCollapse: 'collapse',
  };

  const tableRowStyles = (item) => ({
    backgroundColor: 'white',
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
    cursor: toggleRowExpansion ? 'pointer' : 'default',
  });

  const headerCellStyles = {
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: '1rem',                         
    paddingBottom: '0.5rem',             
    borderBottom: 'none',
    fontSize: '0.875rem',      
    fontWeight: 600,
    color: '#4b5563 ',
    backgroundColor: '#f9fafc',
    whiteSpace: 'nowrap',
    padding: '0.75rem 1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };
  
  const tableCellStyles = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e5e7eb',    
    paddingTop: '0.5rem',                 
    paddingBottom: '0.75rem',             
    alignItems: 'center',
    color: '#111827',
  };

  const tableContainerStyles = {
    boxShadow: 'none',
    borderRadius: 2,
    overflow: 'auto',
    border: '1px solid #e5e7eb',
    maxWidth: '100%',
  };

  return (
    <div className="overflow-hidden">
      <TableContainer 
        component={Paper} 
        sx={tableContainerStyles}
      >
        <Table sx={tableStyles} aria-label="table de données" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={headerCellStyles}>
                <Checkbox
                  indeterminate={selectedItems.length > 0 && selectedItems.length < displayData.length}
                  checked={selectAll}
                  onChange={handleSelectAllChange}
                  inputProps={{ 'aria-label': 'select all' }}
                  sx={{ padding: '0', borderBottom: 'none' }}
                />
              </TableCell>
              
              {columns.map((column) => (
                <TableCell 
                  key={column.key} 
                  sx={headerCellStyles}
                  align={column.key === 'prix' || column.key === 'price' ? 'right' : 'left'}
                >
                  {column.label}
                </TableCell>
              ))}
              
              {hasActions && (
                <TableCell align="right" sx={headerCellStyles}>
                  Actions
                </TableCell>
              )}
            </TableRow>
            {/* Ligne de séparation sous le header */}
            <TableRow>
              <TableCell colSpan={columns.length + (hasActions ? 1 : 0) + 1} sx={{ borderBottom: 'none', backgroundColor: 'transparent', padding: 0 }}>
                <div
                  style={{
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    margin: '0 auto',
                    width: '100%',
                    borderRadius: '2px',
                  }}
                />
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredItems
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item) => (
                <React.Fragment key={item.id || `row-${Math.random()}`}>
                  <TableRow
                    onClick={() => toggleRowExpansion && toggleRowExpansion(item.id)}
                    sx={tableRowStyles(item)}
                  >
                    <TableCell padding="checkbox" sx={tableCellStyles}>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleCheckboxChange(item.id)}
                        inputProps={{ 'aria-label': `select row ${item.id}` }}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ padding: '0', borderBottom: 'none' }}
                      />
                    </TableCell>
                    
                    {columns.map((column) => (
                      <TableCell 
                        key={`${item.id}-${column.key}`}
                        align={column.key === 'prix' || column.key === 'price' ? 'right' : 'left'}
                        sx={tableCellStyles}
                      >
                        {renderImageCell(item, column)}
                      </TableCell>
                    ))}
                    
                    {hasActions && (
                      <TableCell align="right" sx={tableCellStyles}>
                        <div className="flex justify-end space-x-3">
                          {supportPDF && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("PDF action for item:", item.id);
                              }}
                              className="text-gray-500 hover:text-gray-700"
                              aria-label="PDF"
                            >
                              <FontAwesomeIcon icon={faEdit} className="h-4 w-4 text-blue-600" />
                            </button>
                          )}
                          {handleEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item);
                              }}
                              aria-label="Edit"
                              style={{ border: "none", backgroundColor: "transparent", marginRight: "8px" }}
                            >
                              <FontAwesomeIcon
                                icon={faEdit}
                                style={{ color: "#007bff", cursor: "pointer" }}
                              />
                            </button>
                          )}
                          {handleDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id);
                              }}
                              style={{ border: "none", backgroundColor: "transparent", marginRight: "8px" }}
                              aria-label="Delete"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                style={{ color: "#ff0000", cursor: "pointer" }}
                              />
                            </button>
                          )}
                          {renderCustomActions && renderCustomActions(item)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  
                  {/* Expanded row */}
                  {isRowExpanded(item.id) && (
                    <TableRow>
                      <TableCell 
                        colSpan={columns.length + (hasActions ? 1 : 0) + 1}
                        sx={{ padding: '16px', backgroundColor: '#f9fafb' }}
                      >
                        {renderExpandedRow(item)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (hasActions ? 1 : 0) + 1}
                  align="center" 
                  sx={{ padding: '24px', color: '#6b7280' }}
                >
                  Aucune donnée disponible
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Updated pagination section matching TableContainer's style */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: '10px' }}>
        <div className="pagination-container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          margin: '20px 0'
        }}>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteSelected}
          disabled={!selectedItems || selectedItems.length === 0}
          startIcon={<FontAwesomeIcon icon={faTrash} />}
          sx={{
            backgroundColor: '#ef4444',
            '&:hover': {
              backgroundColor: '#dc2626',
            },
            '&.Mui-disabled': {
              backgroundColor: '#f1f5f9',
              color: '#94a3b8'
            }
          }}
        >
          SUPPRIMER SELECTION
        </Button>
          


        </div>
        
        <div className="pagination-container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          margin: '20px 0'
        }}>
          {/* Sélecteur d'entrées par page */}
          <div className="entries-per-page-container" style={{ display: 'flex', alignItems: 'center' }}>
            <select
              value={rowsPerPage}
              onChange={handleMuiChangeRowsPerPage}
              style={{
                width: "60px",
                padding: "5px 8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "#f8f8f8",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"%23555\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 5px center",
                paddingRight: "25px"
              }}
            >
              {[5, 10, 15, 20, 25].map((row) => (
                <option value={row} key={row}>{row}</option>
              ))}
            </select>
            <span style={{ marginLeft: "8px", fontSize: "14px", color: "#666" }}>lignes par page</span>
          </div>

          {/* Pagination component */}
          <Pagination
            count={Math.ceil(filteredItems.length / rowsPerPage)}
            page={page + 1}
            onChange={(event, newPage) => handleChangePage(newPage - 1)}
            color="primary"
          />
        </div>
      </div>
    </div>
  );
};

export default ExpandRTable;