import { StyledTableCell, StyledTableRow, StyledStatus } from '../../../ui';
import dayjs from '../../../../dayjs';

// A project: finished projects are green, running ones orange (the same colours and icons as tasks)
export const ProjectRow = ({ project, setSelectedProject }) => {
    const status = project.Finished ? 'finished' : 'inProgress';
    return (
        <StyledTableRow status={status} onClick={() => setSelectedProject(project.ID)}>
            <StyledTableCell>
                <StyledStatus status={status}>{project.Name}</StyledStatus>
            </StyledTableCell>
            <StyledTableCell>{project.Customer}</StyledTableCell>
            <StyledTableCell>{project.FinishDate ? dayjs(project.FinishDate).format('L') : ''}</StyledTableCell>
        </StyledTableRow>
    );
};
