import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import readXlsxFile from 'read-excel-file/browser';
import dayjs from '../../../../../dayjs';
import { StyledSelect } from '../../../../ui';
import { PreviewMessage } from '../PreviewMessage';

// at most this many rows of a sheet are shown
const rowLimit = 500;

const cellText = (value) => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return dayjs(value).format('L');
    if (typeof value === 'number') return value.toLocaleString('cs-CZ', { maximumFractionDigits: 6 });
    return String(value);
};

const columnName = (index) => {
    let name = '';
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
    return name;
};

// A sheet as a compact grid with Excel's column letters and row numbers
const SheetTable = ({ rows }) => {
    const shown = rows.slice(0, rowLimit);
    const columns = shown.reduce((max, row) => Math.max(max, row.length), 0);
    const headSx = {
        fontWeight: 600,
        color: 'text.secondary',
        backgroundColor: 'action.hover',
        textAlign: 'center',
    };
    return (
        <>
            <TableContainer sx={{ maxHeight: '65vh', border: '1px solid', borderColor: 'divider' }}>
                <Table
                    size='small'
                    stickyHeader
                    sx={{
                        '& td, & th': {
                            whiteSpace: 'nowrap',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            py: 0.5,
                        },
                    }}
                >
                    <TableBody>
                        <TableRow>
                            <TableCell component='th' sx={headSx} />
                            {Array.from({ length: columns }, (_, index) => (
                                <TableCell key={index} component='th' sx={headSx}>
                                    {columnName(index)}
                                </TableCell>
                            ))}
                        </TableRow>
                        {shown.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                <TableCell component='th' sx={headSx}>
                                    {rowIndex + 1}
                                </TableCell>
                                {Array.from({ length: columns }, (_, index) => (
                                    <TableCell key={index} align={typeof row[index] === 'number' ? 'right' : 'left'}>
                                        {cellText(row[index])}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {rows.length > rowLimit ? (
                <Typography variant='body2' sx={{ color: 'text.secondary', mt: 1 }}>
                    Zobrazeno prvních {rowLimit} z {rows.length} řádků.
                </Typography>
            ) : null}
        </>
    );
};

export const ExcelPreview = ({ blob }) => {
    const [sheets, setSheets] = useState(null);
    const [failed, setFailed] = useState(false);
    const [selected, setSelected] = useState(0);

    useEffect(() => {
        readXlsxFile(blob)
            .then(setSheets)
            .catch(() => setFailed(true));
    }, [blob]);

    if (failed) return <PreviewMessage>Tabulku se nepodařilo zobrazit.</PreviewMessage>;
    if (!sheets) return null;
    if (sheets.length === 0) return <PreviewMessage>Tabulka je prázdná.</PreviewMessage>;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {sheets.length > 1 ? (
                <StyledSelect
                    id='sheet'
                    label='List'
                    value={selected}
                    onChange={(event) => setSelected(event.target.value)}
                    options={sheets.map((sheet, index) => ({
                        value: index,
                        label: sheet.sheet,
                    }))}
                />
            ) : null}
            <SheetTable rows={sheets[selected].data} />
        </Box>
    );
};

// Splits CSV text into rows (quotes, "" inside quotes, ; or , as the separator - Czech Excel writes ;)
const parseCsv = (text) => {
    const firstLine = text.slice(0, text.indexOf('\n') === -1 ? undefined : text.indexOf('\n'));
    const separator = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                cell += '"';
                i += 1;
            } else if (char === '"') quoted = false;
            else cell += char;
        } else if (char === '"') quoted = true;
        else if (char === separator) {
            row.push(cell);
            cell = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i += 1;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
            if (rows.length > rowLimit) break;
        } else cell += char;
    }
    if (cell || row.length) rows.push([...row, cell]);
    return rows;
};

export const CsvPreview = ({ blob }) => {
    const [rows, setRows] = useState(null);
    useEffect(() => {
        blob.slice(0, 2 * 1024 * 1024)
            .text()
            .then((text) => setRows(parseCsv(text)));
    }, [blob]);
    if (!rows) return null;
    return <SheetTable rows={rows} />;
};
