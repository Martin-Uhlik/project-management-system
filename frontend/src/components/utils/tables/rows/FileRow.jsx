import { StyledTableCell, StyledTableRow } from '../../../ui';
import dayjs from '../../../../dayjs';

export const FileRow = (props) => {
    const row = props.row;

    return (
        <StyledTableRow>
            <StyledTableCell>{row.file}</StyledTableCell>
            <StyledTableCell align='right'>{row.size} MB</StyledTableCell>
            <StyledTableCell align='right'>{dayjs(row.details).format('LLL')}</StyledTableCell>
        </StyledTableRow>
    );
};
