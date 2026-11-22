import { useNavigate } from 'react-router';
import dayjs from '../../dayjs';
import { StyledTableCell, StyledTableRow, StyledStatus, taskStatus } from '../ui';

// A project task in a task list: its status in colour and as an icon; clicking the row opens the task.
// actions: hover buttons instead of the arrow (see StyledTableRow)
export const AssignedTask = ({ task, actions }) => {
    const navigate = useNavigate();
    const owner = task.Owner;
    const status = taskStatus(task);
    return (
        <StyledTableRow status={status} onClick={() => navigate(`/auth/projects/${task.ProjectID}/${task.ID}`)} actions={actions}>
            <StyledTableCell>
                <StyledStatus status={status}>{task.Name}</StyledStatus>
            </StyledTableCell>
            <StyledTableCell>{task.Project?.Name}</StyledTableCell>
            <StyledTableCell>{owner ? `${owner.FirstName} ${owner.LastName}` : ''}</StyledTableCell>
            <StyledTableCell>{dayjs(task.FinishDate).format('L')}</StyledTableCell>
        </StyledTableRow>
    );
};
