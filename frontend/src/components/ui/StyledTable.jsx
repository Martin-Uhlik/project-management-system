import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Children } from 'react';
import { FormStack } from './Layout';
import { StyledSearchInput } from './StyledSearchInput';

// A data table on a white card. columns: [{ label, align }], the rows are StyledTableRow children.
// search: the object from useSearch(); with it a search field sits above the table and the children should be its results.
export const StyledTable = ({ columns, search, children }) => {
    const nothingFound = search?.query && Children.count(children) === 0;
    const table = (
        <TableContainer component={Paper}>
            <Table size='small'>
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column.label} align={column.align} sx={{ fontWeight: 'bold' }}>
                                {column.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {children}
                    {nothingFound ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} align='center' sx={{ color: 'text.secondary' }}>
                                Nic nenalezeno
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
        </TableContainer>
    );
    if (!search) return table;
    return (
        <FormStack>
            <StyledSearchInput value={search.query} onChange={search.setQuery} />
            {table}
        </FormStack>
    );
};

// A row; with onClick it highlights on hover and shows it can be clicked
export const StyledTableRow = ({ onClick, children }) => {
    return (
        <TableRow hover onClick={onClick} sx={onClick ? { cursor: 'pointer' } : undefined}>
            {children}
        </TableRow>
    );
};

export const StyledTableCell = TableCell;
