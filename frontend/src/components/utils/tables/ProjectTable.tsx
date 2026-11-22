import { StyledTable, useSearch } from '../../ui';
import dayjs from '../../../dayjs';
import { useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';
import { userAtom } from '../../../state/atoms';
import { ProjectRow } from './rows/ProjectRow';
import type { ProjectListItem } from '../../../types';

// A row selects the project (its preview next to the table); the arrow on the row opens the project's page
export const ProjectTable = ({
    projects,
    selectedProject,
    setSelectedProject,
}: {
    projects: ProjectListItem[];
    selectedProject?: number | null;
    setSelectedProject: (id: number) => void;
}) => {
    const navigate = useNavigate();
    const me = useAtomValue(userAtom);
    // admins and managers open every project, others the ones they own or are members of (Mine)
    const canOpen = (project: ProjectListItem) => me?.UserType === 'ADMIN' || me?.UserType === 'MANAGER' || project.Mine;
    const search = useSearch(projects, (project) => [project.Name, project.Customer, dayjs(project.FinishDate).format('L')]);
    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Zákazník' }, { label: 'Dokončení' }]} search={search}>
            {search.results.map((project) => (
                <ProjectRow
                    key={project.ID}
                    project={project}
                    setSelectedProject={setSelectedProject}
                    selected={project.ID === selectedProject}
                    onOpen={canOpen(project) ? () => navigate(`/auth/projects/${project.ID}`) : null}
                />
            ))}
        </StyledTable>
    );
};
