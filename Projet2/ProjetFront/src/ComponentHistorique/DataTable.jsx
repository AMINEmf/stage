import React from 'react';
import TablePagination from '@mui/material/TablePagination';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Plus } from 'lucide-react';

const DataTable = ({
    data = [],
    columns = [],
    isLoading = false,
    emptyMessage = 'No data available',
    noSelectionMessage = 'Please select an item to view data',
    hasSelection = false,
    onEdit,
    onDelete,
    onAdd,
    showAddButton = true,
    rowsPerPage = 7,
    page = 0,
    onPageChange,
    onRowsPerPageChange,
    formatters = {},
    label
}) => {
    
    const renderTableHeader = () => {
        return (
            <tr>
                {columns.map((column, index) => (
                    <th key={index}>{column.header}</th>
                ))}
                {(onEdit || onDelete) && <th>Options</th>}
            </tr>
        );
    };

    // Generate cell content based on column config
    const getCellContent = (item, column) => {
        const value = column.accessor.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined ? obj[key] : column.defaultValue || '-';
        }, item);

        // Apply formatter if exists
        if (column.key && formatters[column.key]) {
            return formatters[column.key](value);
        }
        return value || column.defaultValue || '-';
    };

    // Render table content
    const renderTableContent = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center">
                        Chargement...
                    </td>
                </tr>
            );
        }

        if (!hasSelection) {
            return (
                <tr>
                    <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center">
                        {noSelectionMessage}
                    </td>
                </tr>
            );
        }

        if (data.length === 0) {
            return (
                <tr>
                    <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center">
                        {emptyMessage}
                    </td>
                </tr>
            );
        }

        return data.map((item, rowIndex) => (
            <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                    <td key={colIndex}>{getCellContent(item, column)}</td>
                ))}
                {(onEdit || onDelete) && (
                    <td>
                        {onEdit && (
                            <FontAwesomeIcon
                                onClick={() => onEdit(item)}
                                icon={faEdit}
                                style={{
                                    color: "#007bff",
                                    cursor: "pointer",
                                    marginRight: "10px"
                                }}
                            />
                        )}
                        {onDelete && (
                            <FontAwesomeIcon
                                onClick={() => onDelete(item.id)}
                                icon={faTrash}
                                style={{
                                    color: "#ff0000",
                                    cursor: "pointer"
                                }}
                            />
                        )}
                    </td>
                )}
            </tr>
        ));
    };

    return (
        <div
            style={{
                width: "57.5%",
                backgroundColor: "#ffffff",
                border: "1px solid #ccc",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                borderRadius: "5px",
                padding: "15px",
                height: "800px",
                overflowY: "auto",
                marginTop:'-2.5%'
            }}
        >
            {showAddButton && onAdd && (
                <button
                    onClick={onAdd}
                    style={{
                        cursor: "pointer",
                        color: "#3a8a90",
                        fontSize: "1.2rem",
                        backgroundColor: 'transparent',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '20px'
                    }}
                >
                    <Plus size={20} />
                    Ajouter {label}
                </button>
            )}

            <table className="table table-hover">
                <thead className="table-light">
                    {renderTableHeader()}
                </thead>
                <tbody>
                    {renderTableContent()}
                </tbody>
            </table>

            <TablePagination
                component="div"
                count={100}
                page={page}
                onPageChange={onPageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={onRowsPerPageChange}
                rowsPerPageOptions={[7]}
            />
        </div>
    );
};

export default DataTable;