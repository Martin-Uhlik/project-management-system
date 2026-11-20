import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// A data table on a white card. columns: [{ label, align }], the rows are StyledTableRow children
export const StyledTable = ({ columns, children }) => {
    return (
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
                <TableBody>{children}</TableBody>
            </Table>
        </TableContainer>
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
