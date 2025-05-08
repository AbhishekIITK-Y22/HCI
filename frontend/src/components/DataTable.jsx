// src/components/DataTable.jsx
import React from 'react';
import { DataGrid, GridToolbarContainer, GridToolbarDensitySelector, GridToolbarExport, GridOverlay } from '@mui/x-data-grid';
import { styled } from '@mui/system';
import { CircularProgress, Typography } from '@mui/material';

// Custom styled wrapper
const TableWrapper = styled('div')(({ theme }) => ({
  height: '100%', // Make it responsive
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  '& .MuiDataGrid-root': {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    border: 'none', // Remove potential border if causing issues
  },
  '& .MuiDataGrid-columnHeaders': {
    // Darker grey for light mode header background
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
    color: theme.palette.text.primary,
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  '& .MuiDataGrid-cell': {
    fontSize: '0.875rem',
  },
  '& .MuiDataGrid-footerContainer': {
    backgroundColor: theme.palette.background.default,
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

// Custom loading overlay
function CustomLoadingOverlay() {
  return (
    <GridOverlay>
      <CircularProgress />
      <Typography variant="body2" sx={{ mt: 1 }}>
        Loading data...
      </Typography>
    </GridOverlay>
  );
}

// Custom error overlay
function CustomErrorOverlay() {
  return (
    <GridOverlay>
      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
        Error loading data. Please try again.
      </Typography>
    </GridOverlay>
  );
}

// Custom toolbar with density and export
function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

export default function DataTable({ rows, columns, loading, error }) {
  return (
    <TableWrapper>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        loading={loading}
        components={{
          Toolbar: CustomToolbar,
          LoadingOverlay: CustomLoadingOverlay,
          ErrorOverlay: error ? CustomErrorOverlay : null,
        }}
        disableSelectionOnClick
        autoHeight
        density="standard"
        sx={{
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
          '& .MuiDataGrid-cell': {
            wordBreak: 'break-word',
          },
        }}
        localeText={{
          noRowsLabel: 'No records found',
          footerRowSelected: (count) =>
            count > 1 ? `${count.toLocaleString()} rows selected` :
            `${count.toLocaleString()} row selected`,
        }}
      />
    </TableWrapper>
  );
}
