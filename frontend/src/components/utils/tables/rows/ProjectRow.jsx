import { StyledCheckbox, StyledTableCell, StyledTableRow } from '../../../ui';
import dayjs from '../../../../dayjs';

export const ProjectRow = (props) => {
    const project = props.project;

    return (
        <StyledTableRow
            onClick={() => {
                props.setSelectedProject(project.ID);
            }}
        >
            <StyledTableCell>{project.Name}</StyledTableCell>
            <StyledTableCell>{project.Customer}</StyledTableCell>
            <StyledTableCell>{dayjs(project.FinishDate).format('L')}</StyledTableCell>
            <StyledTableCell>
                <StyledCheckbox disabled checked={project.Finished} aria-label='Dokončeno' />
            </StyledTableCell>
        </StyledTableRow>
    );
};
