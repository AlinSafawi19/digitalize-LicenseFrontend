import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import { ReactNode, memo, useCallback } from 'react';

export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}

function DataTableComponent<T extends { id: number | string }>({
  columns,
  rows,
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  // Memoize event handlers to prevent unnecessary re-renders
  const handleChangePage = useCallback(
    (_event: unknown, newPage: number) => {
      onPageChange(newPage);
    },
    [onPageChange]
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    },
    [onRowsPerPageChange]
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer 
        sx={{ 
          maxHeight: 'calc(100vh - 300px)',
          '& .MuiTable-root': {
            minWidth: 650,
          },
        }}
      >
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  role="columnheader"
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 2 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 2 }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow 
                  hover 
                  role="row" 
                  tabIndex={-1} 
                  key={row.id}
                  aria-label={`Row ${row.id}`}
                >
                  {columns.map((column) => {
                    const value = (row as Record<string, unknown>)[column.id];
                    return (
                      <TableCell 
                        key={column.id} 
                        align={column.align}
                        role="cell"
                      >
                        {column.format ? column.format(value, row) : String(value ?? '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Paper>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since DataTable is used with frequently changing data
export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;