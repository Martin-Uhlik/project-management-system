import Box from '@mui/material/Box';
import { StyledElapsed, StyledTableCell, StyledTableRow, StyledStatus, projectStatus, projectStatusLabels } from '../../../ui';
import dayjs from '../../../../dayjs';

// A project: finished green, orange with a running timer while someone works on one of its tasks, otherwise blue
// (the same colours and icons as tasks, see projectStatus)
export const ProjectRow = ({ project, setSelectedProject }) => {
    const status = projectStatus(project);
    return (
        <StyledTableRow status={status} onClick={() => setSelectedProject(project.ID)}>
            <StyledTableCell>
                <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <StyledStatus status={status} label={projectStatusLabels[status]}>
                        {project.Name}
                    </StyledStatus>
                    {status === 'inProgress' ? <StyledElapsed since={project.WorkingSince} status='inProgress' /> : null}
                </Box>
            </StyledTableCell>
            <StyledTableCell>{project.Customer}</StyledTableCell>
            <StyledTableCell>{project.FinishDate ? dayjs(project.FinishDate).format('L') : ''}</StyledTableCell>
        </StyledTableRow>
    );
};
