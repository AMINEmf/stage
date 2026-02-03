import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCopy, faPrint } from '@fortawesome/free-solid-svg-icons';
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
import "../Style.css";


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
  handleDuplicate,
  handlePrint,
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
  getRowStyle,
  canEdit = true,
  canDelete = true,
  canBulkDelete = true,
}) => {

  const hasActions = handleEdit || handleDelete || handleDuplicate || handlePrint || renderCustomActions;
  const displayData = filteredData || data || [];
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [zoomedImages, setZoomedImages] = useState(new Set());


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

  const toggleImageZoom = (imageId) => {
    setZoomedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
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
    handleChangeRowsPerPage({ target: { value: parseInt(event.target.value, 10) } });
  };

  const renderImageCell = (item, column) => {
    if (column.key === 'image' || column.key === 'img' || column.key === 'photo' || column.key === 'url_img') {
      const imgSrc = item[column.key];
      const imageId = `${item.id}-${column.key}`;
      const isZoomed = zoomedImages.has(imageId);

      if (imgSrc) {
        const fullImgSrc = imgSrc.startsWith('http') ? imgSrc : `http://127.0.0.1:8000/storage/${imgSrc}`;

        return (
          <div className="employee-avatar">
            <img
              src={fullImgSrc}
              alt={item.designation || item.name || item.nom || 'Image'}
              className={`zoomable-image ${isZoomed ? 'zoomed' : ''}`}
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                border: "2px solid #eee",
                objectFit: "cover",
                cursor: "pointer",
                transition: "transform 0.3s ease, border 0.3s ease"
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleImageZoom(imageId);
              }}
            />
          </div>
        );
      } else {
        const initials = [];
        if (item.nom) initials.push(item.nom.charAt(0).toUpperCase());
        if (item.prenom) initials.push(item.prenom.charAt(0).toUpperCase());
        if (item.name) initials.push(item.name.charAt(0).toUpperCase());

        if (initials.length > 0) {
          return (
            <div className="employee-avatar">
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  border: "2px solid #eee",
                  backgroundColor: "#3a8a90",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold"
                }}
              >
                {initials.join('')}
              </div>
            </div>
          );
        }
      }
      return null;
    }

    return column.render
      ? column.render(item, searchTerm, toggleRowExpansion)
      : (highlightText ? highlightText(item[column.key], searchTerm) : item[column.key]) || '';
  };

  const filteredItems = displayData.filter(item => filterData(item, searchTerm));

  const tableStyles = {
    boxShadow: 'none',
    borderCollapse: 'separate',
    borderSpacing: 0,
  };

  const tableRowStyles = (item) => ({
    backgroundColor: 'white',
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
    cursor: toggleRowExpansion ? 'pointer' : 'default',
  });

  const headerCellStyles = {
    gap: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    whiteSpace: 'nowrap',
    padding: '0.75rem 1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tableCellStyles = {
    padding: '0.75rem 1rem',
    borderBottom: 'none',
    paddingTop: '0.5rem',
    paddingBottom: '0.75rem',
    alignItems: 'center',
    color: '#111827',
    position: 'relative',
    fontSize: '0.875rem',
    borderBottom: "1px solid #e5e7eb",
  };

  const tableContainerStyles = {
    boxShadow: 'none',
    borderRadius: 2,
    overflowX: 'auto',
    overflowY: 'auto',
    border: '1px solid #e5e7eb',
    width: '100%',
    maxWidth: '100%',
  };

  return (
    <>
      <style>{`
        .zoomable-image {
          transition: transform 0.3s ease, border 0.3s ease;
        }

        .zoomable-image:hover {
          transform: scale(3.5); 
          z-index: 1000; 
          cursor: pointer; 
          position: relative;
        }

        // .zoomable-image.zoomed {
        //   transform: scale(2.5) !important; 
        //   z-index: 1000 !important; 
        //   position: relative !important;
        //   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        // }

      `}</style>



      <div className="table-wrapper" style={{ width: '100%', overflow: 'hidden' }}>
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
                    onChange={canDelete ? handleSelectAllChange : undefined}
                    disabled={!canDelete}
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
                  <TableCell align="right" sx={{
                    ...headerCellStyles,
                    position: 'sticky',
                    right: 0,
                    zIndex: 3,
                  }}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
              <TableRow>
                <TableCell colSpan={columns.length + (hasActions ? 1 : 0) + 1} sx={{ borderBottom: 'none', backgroundColor: 'transparent', padding: 0 }}>
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: '#e5e7eb',
                      margin: '0 1rem',
                      width: 'calc(100% - 2rem)',
                      borderRadius: '2px',
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredItems
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => {
                  return (
                    <React.Fragment key={item.id || `row-${Math.random()}`}>
                      <TableRow
                        onClick={() => toggleRowExpansion && toggleRowExpansion(item.id)}
                        sx={{
                          ...(getRowStyle ? getRowStyle(item) : tableRowStyles(item)),
                          ...(index !== filteredItems.length - 1 && {
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: '1rem',
                              right: '1rem',
                              height: '1px',
                              backgroundColor: '#e5e7eb',
                              width: 'calc(100% - 2rem)',
                            }
                          })
                        }}
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

                        {columns.map((column, colIndex) => {
                          return (
                            <TableCell
                              key={`${item.id}-${column.key}`}
                              align={column.key === 'prix' || column.key === 'price' ? 'right' : 'left'}
                              sx={tableCellStyles}
                            >
                              {renderImageCell(item, column)}
                            </TableCell>
                          );
                        })}

                        {hasActions && (
                          <TableCell
                            align="right"
                            sx={{
                              ...tableCellStyles,
                              verticalAlign: "middle",
                              position: 'sticky',
                              right: 0,
                              zIndex: 2,
                              backgroundColor: "#fff",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: '10px',
                                height: '100%',
                              }}
                            >
                              {supportPDF && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("PDF action for item:", item.id);
                                  }}
                                  aria-label="PDF"
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <FontAwesomeIcon icon={faEdit} style={{ color: '#007bff', fontSize: '14px' }} />
                                </button>
                              )}

                              {/* Bouton Imprimer */}
                              {handlePrint && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(item);
                                  }}
                                  aria-label="Print"
                                  title="Imprimer"
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPrint} style={{ color: '#28a745', fontSize: '14px' }} />
                                </button>
                              )}

                              {/* Bouton Modifier */}
                              {handleEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canEdit) return;
                                    handleEdit(item);
                                  }}
                                  aria-label="Edit"
                                  title="Modifier"
                                  className={!canEdit ? 'disabled-btn' : ''}
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: canEdit ? 'pointer' : 'not-allowed',
                                    opacity: canEdit ? 1 : 0.5,
                                  }}
                                  disabled={!canEdit}
                                >
                                  <FontAwesomeIcon icon={faEdit} style={{ color: '#007bff', fontSize: '14px' }} />
                                </button>
                              )}

                              {/* Bouton Dupliquer - Affiché seulement si handleDuplicate est fourni */}
                              {handleDuplicate && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(item);
                                  }}
                                  aria-label="Duplicate"
                                  title="Dupliquer"
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCopy} style={{ color: '#17a2b8', fontSize: '14px' }} />
                                </button>
                              )}

                              {/* Bouton Supprimer */}
                              {handleDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canDelete) return;
                                    handleDelete(item.id);
                                  }}
                                  aria-label="Delete"
                                  title="Supprimer"
                                  className={!canDelete ? 'disabled-btn' : ''}
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: canDelete ? 'pointer' : 'not-allowed',
                                    opacity: canDelete ? 1 : 0.5,
                                  }}
                                  disabled={!canDelete}
                                >
                                  <FontAwesomeIcon icon={faTrash} style={{ color: '#ff0000', fontSize: '14px' }} />
                                </button>
                              )}

                              {renderCustomActions && renderCustomActions(item)}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>

                      {isRowExpanded(item.id) && (
                        <TableRow
                          sx={{
                            ...(index !== filteredItems.length - 1 && {
                              position: 'relative',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: '1rem',
                                right: '1rem',
                                height: '1px',
                                backgroundColor: '#e5e7eb',
                                width: 'calc(100% - 2rem)',
                              }
                            })
                          }}
                        >
                          <TableCell
                            colSpan={columns.length + (hasActions ? 1 : 0) + 1}
                            sx={{
                              padding: '16px',
                              backgroundColor: '#f9fafb',
                            }}
                          >
                            {renderExpandedRow(item)}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}

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
              disabled={!canBulkDelete || !selectedItems || selectedItems.length === 0}
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

            <Pagination
              count={Math.ceil(filteredItems.length / rowsPerPage)}
              page={page + 1}
              onChange={(event, newPage) => handleChangePage(newPage - 1)}
              color="primary"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpandRTable;