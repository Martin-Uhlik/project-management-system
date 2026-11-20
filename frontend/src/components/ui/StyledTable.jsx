import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Children } from 'react';
import { FormStack } from './Layout';
import { StyledSearchInput } from './StyledSearchInput';
import { ChevronRightIcon } from './icons';
import { useStatusColors } from './taskStatus';

// every row ends with a narrow cell for the arrow that marks rows you can click through
const arrowCellSx = { width: '2.5rem', pr: 1 };

// The app's one table: transparent (it sits on the page's box), sharp corners, a bold header and roomy rows (the same height in every table). columns: [{ label, align }], the rows are StyledTableRow children.
// search: the object from useSearch(); with it a search field sits above the table and the children should be its results.
export const StyledTable = ({ columns, search, children }) => {
    const nothingFound = search?.query && Children.count(children) === 0;
    const table = (
        <TableContainer component={Paper} square elevation={0} sx={{ backgroundColor: 'transparent' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column.label} align={column.align} sx={{ fontWeight: 'bold' }}>
                                {column.label}
                            </TableCell>
                        ))}
                        <TableCell padding='none' sx={arrowCellSx} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {children}
                    {nothingFound ? (
                        <TableRow>
                            <TableCell colSpan={columns.length + 1} align='center' sx={{ color: 'text.secondary' }}>
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

// A row of StyledTable.
// onClick: the row highlights on hover, can be reached with Tab and opened with Enter, and shows an arrow on the right
//   (showArrow={false} for rows whose click does something in place instead of opening a detail, like ticking off a task)
// status: a status (of a task - see taskStatus, or of a worker - see userStatus) as a coloured stripe on the left;
//   rows with a status other than todo are also tinted in its colour (finished green, in progress orange,
//   working green, disabled grey); hover keeps the usual highlight
// disabled: greyed out and struck through, e.g. a disabled worker
// selected: the row whose detail is open next to the table (highlighted, with a red line on the right)
// actions: icon buttons on the right instead of the arrow, shown on hover: [{ label, icon, onClick, color }]
//   (e.g. edit, finish, delete); clicking one doesn't also click the row
export const StyledTableRow = ({ onClick, status, disabled, selected, showArrow = true, actions, children }) => {
    const statusColors = useStatusColors();
    const statusColor = status && statusColors[status];
    const clickable = Boolean(onClick);

    const handleKeyDown = (event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick(event);
        }
    };

    return (
        <TableRow
            hover={clickable}
            onClick={onClick}
            onKeyDown={clickable ? handleKeyDown : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-selected={selected === undefined ? undefined : selected}
            sx={{
                // one row height everywhere (rem, so it grows with the font size setting), whatever the cells hold
                height: '3.625rem',
                ...(clickable && {
                    cursor: 'pointer',
                    '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '-2px',
                    },
                }),
                ...(statusColor && {
                    '& > td:first-of-type': { boxShadow: `inset 4px 0 0 ${statusColor}` },
                }),
                ...(statusColor &&
                    status !== 'todo' && {
                        backgroundColor: `color-mix(in srgb, ${statusColor} 8%, transparent)`,
                    }),
                ...(selected && {
                    backgroundColor: 'action.selected',
                    '&:hover, &.MuiTableRow-hover:hover': {
                        backgroundColor: 'action.selected',
                    },
                    '& > td:last-of-type': {
                        boxShadow: 'inset -3px 0 0 var(--mui-palette-primary-main)',
                    },
                }),
                ...(disabled && {
                    // (the name next to a status icon sits in an inline-flex box, which doesn't inherit the line)
                    '& > td, & .status-text': {
                        color: 'text.disabled',
                        textDecoration: 'line-through',
                    },
                }),
                // the arrow and the actions show on hover and keyboard focus, and always on touch screens (no hover there)
                '& .row-arrow, & .row-actions': {
                    opacity: 0,
                    transition: 'opacity 150ms, transform 150ms',
                },
                '&:hover .row-arrow, &:focus-visible .row-arrow': {
                    opacity: 1,
                    transform: 'translateX(2px)',
                },
                '&:hover .row-actions, &:focus-visible .row-actions, &:focus-within .row-actions': { opacity: 1 },
                '@media (hover: none)': {
                    '& .row-arrow, & .row-actions': { opacity: 1 },
                },
            }}
        >
            {children}
            <TableCell padding='none' align='right' sx={actions ? { ...arrowCellSx, width: 'auto', whiteSpace: 'nowrap' } : arrowCellSx}>
                {actions ? (
                    <span className='row-actions'>
                        {actions.map((action) => (
                            <Tooltip key={action.label} title={action.label}>
                                <IconButton
                                    size='small'
                                    color={action.color ?? 'default'}
                                    aria-label={action.label}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        action.onClick(event);
                                    }}
                                    onKeyDown={(event) => event.stopPropagation()}
                                >
                                    {action.icon}
                                </IconButton>
                            </Tooltip>
                        ))}
                    </span>
                ) : clickable && showArrow ? (
                    <ChevronRightIcon className='row-arrow' fontSize='small' sx={{ color: 'text.secondary', verticalAlign: 'middle' }} />
                ) : null}
            </TableCell>
        </TableRow>
    );
};

export const StyledTableCell = TableCell;
