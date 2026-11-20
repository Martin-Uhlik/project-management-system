import { StyledTable, useSearch } from '../../ui';
import dayjs from '../../../dayjs';
import { ProjectRow } from './rows/ProjectRow';

export const ProjectTable = ({ projects, setSelectedProject }) => {
    const search = useSearch(projects, (project) => [project.Name, project.Customer, dayjs(project.FinishDate).format('L')]);
    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Zákazník' }, { label: 'Dokončení' }, { label: 'Dokončeno' }]} search={search}>
            {search.results.map((project) => (
                <ProjectRow key={project.ID} project={project} setSelectedProject={setSelectedProject} />
            ))}
        </StyledTable>
    );
};
