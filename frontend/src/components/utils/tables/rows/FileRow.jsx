import Box from '@mui/material/Box';
import { StyledTableCell, StyledTableRow, fileType, formatBytes } from '../../../ui';
import dayjs from '../../../../dayjs';

export const FileRow = ({ row, selected, onSelect }) => {
    const type = fileType(row.file);
    const Icon = type.icon;
    return (
        <StyledTableRow selected={selected} onClick={onSelect ? () => onSelect(row) : undefined}>
            <StyledTableCell>
                <Box
                    component='span'
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        wordBreak: 'break-word',
                    }}
                >
                    <Icon fontSize='small' sx={{ color: 'text.secondary', flexShrink: 0 }} />
                    {row.file}
                </Box>
            </StyledTableCell>
            <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                {row.Bytes !== undefined ? formatBytes(row.Bytes) : `${row.size} MB`}
            </StyledTableCell>
            <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                {dayjs(row.details).format('L LT')}
            </StyledTableCell>
        </StyledTableRow>
    );
};
