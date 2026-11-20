import { StyledTable } from '../../ui';
import { ProjectRow } from './rows/ProjectRow';

export const ProjectTable = ({ projects, setSelectedProject }) => {
    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Zákazník' }, { label: 'Dokončení' }, { label: 'Dokončeno' }]}>
            {projects.map((project) => (
                <ProjectRow key={project.ID} project={project} setSelectedProject={setSelectedProject} />
            ))}
        </StyledTable>
    );
};
