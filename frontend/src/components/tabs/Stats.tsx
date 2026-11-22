import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { selectedTabAtom, userAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import dayjs from '../../dayjs';
import { PersonStats, fullName, statsPeriod } from '../stats/PersonStats';
import { ProjectStats } from '../projects/project/ProjectStats';
import {
    ArrowLeftIcon,
    StyledButton,
    StyledMonthPicker,
    StyledWeekPicker,
    StyledSegmentedSelect,
    StyledPageHeader,
    StyledSection,
    StyledSelect,
    StyledStatTile,
    StyledTable,
    StyledTableCell,
    StyledTableRow,
    StyledTimeUsage,
    formatMinutes,
    timeUsage,
    useChartColors,
    useStatusColors,
} from '../ui';
import type { ReactNode } from 'react';
import type { PersonTotals, ProjectListItem } from '../../types';
import type { StatsPeriod } from '../stats/PersonStats';

const none: PersonTotals[] = [];
const noProjects: ProjectListItem[] = [];

// The top line of a tab's content: a title on the left, controls (the week or month) on the right
const Toolbar = ({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) => (
    <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0 }}>
            <h1 style={{ margin: 0 }}>{title}</h1>
            {subtitle ? (
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {subtitle}
                </Typography>
            ) : null}
        </Box>
        <Stack direction='row' sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {children}
        </Stack>
    </Stack>
);

// "Týmové statistiky": the period's totals of the people under a manager (all people for an admin) and a table of them;
// a row opens that person's own statistics (?user=ID), with a way back to the team
const TeamStats = ({
    period,
    periodPicker,
    userID,
    setUser,
}: {
    period: StatsPeriod;
    periodPicker: ReactNode;
    userID: number | null;
    setUser: (id: number | null) => void;
}) => {
    const me = useAtomValue(userAtom);
    const chartColors = useChartColors();
    const statusColors = useStatusColors();
    const from = period.start.toISOString();
    const to = period.end.toISOString();
    const people = useApi<PersonTotals[]>('/auth/stats/people', { params: { from, to }, topics: ['users', 'user:*'] }).data ?? null;
    // a manager's team are the people under them; an admin's team is everyone
    const team = useMemo(() => (people ?? none).filter((person) => me?.UserType === 'ADMIN' || person.User.ID !== me?.ID), [people, me]);
    const totals = useMemo(
        () =>
            team.reduce(
                (sum, person) => ({
                    worked: sum.worked + person.WorkedMinutes,
                    tasks: sum.tasks + person.TaskCount,
                    finished: sum.finished + person.FinishedCount,
                    planned: sum.planned + person.PlannedMinutes,
                    actual: sum.actual + (person.PlannedMinutes ? person.ActualMinutes : 0),
                    active: sum.active + (person.WorkedMinutes > 0 ? 1 : 0),
                }),
                { worked: 0, tasks: 0, finished: 0, planned: 0, actual: 0, active: 0 },
            ),
        [team],
    );

    const member = userID ? team.find((person) => person.User.ID === userID) : null;
    if (member) {
        return (
            <>
                <Toolbar title={fullName(member.User)} subtitle={member.User.Position}>
                    <StyledButton variant='outlined' color='inherit' startIcon={<ArrowLeftIcon />} onClick={() => setUser(null)}>
                        Zpět na tým
                    </StyledButton>
                    {periodPicker}
                </Toolbar>
                <PersonStats userID={member.User.ID} period={period} />
            </>
        );
    }

    const usage = timeUsage(totals.actual, totals.planned);
    return (
        <>
            <Toolbar title={me?.UserType === 'ADMIN' ? 'Všichni pracovníci' : 'Můj tým'}>{periodPicker}</Toolbar>
            {people && team.length === 0 ? <Typography sx={{ color: 'text.secondary' }}>Pod vámi zatím nikdo není.</Typography> : null}
            {team.length > 0 ? (
                <>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))' }}>
                        <StyledStatTile
                            label='Odpracováno týmem'
                            value={formatMinutes(totals.worked)}
                            accent={chartColors.actualTime}
                            caption={`pracovalo ${totals.active} z ${team.length}`}
                        />
                        <StyledStatTile
                            label={`Úkoly ${period.inThis}`}
                            value={totals.tasks}
                            accent={statusColors.finished}
                            caption={`${totals.finished} z nich dokončeno`}
                        />
                        <StyledStatTile
                            label='Skutečnost proti plánu'
                            value={usage === null ? '–' : `${usage} %`}
                            tone={usage !== null && usage > 100 ? 'error' : undefined}
                            accent={chartColors.plannedTime}
                            caption={usage === null ? 'úkoly bez odhadu' : `${formatMinutes(totals.actual)} z plánovaných ${formatMinutes(totals.planned)}`}
                        />
                    </Box>
                    <StyledSection
                        title='Pracovníci'
                        caption={`Souhrn za vybraný ${period.unit === 'week' ? 'týden' : 'měsíc'}. Kliknutím zobrazíte detail pracovníka.`}
                    >
                        <StyledTable
                            columns={[
                                { label: 'Pracovník' },
                                { label: 'Vedoucí' },
                                { label: 'Odpracováno', align: 'right' },
                                { label: 'Úkoly', align: 'right' },
                                { label: 'Plánováno', align: 'right' },
                                { label: 'Skutečnost', align: 'right' },
                                { label: 'Čerpání', align: 'right' },
                            ]}
                        >
                            {team.map((person) => (
                                <StyledTableRow key={person.User.ID} disabled={!person.User.Enabled} onClick={() => setUser(person.User.ID)}>
                                    <StyledTableCell>{person.User.ID === me?.ID ? `${fullName(person.User)} (já)` : fullName(person.User)}</StyledTableCell>
                                    <StyledTableCell>{fullName(person.User.Manager)}</StyledTableCell>
                                    <StyledTableCell align='right'>{formatMinutes(person.WorkedMinutes)}</StyledTableCell>
                                    <StyledTableCell align='right'>
                                        {person.FinishedCount} / {person.TaskCount}
                                    </StyledTableCell>
                                    <StyledTableCell align='right'>{person.PlannedMinutes ? formatMinutes(person.PlannedMinutes) : '–'}</StyledTableCell>
                                    <StyledTableCell align='right'>{person.PlannedMinutes ? formatMinutes(person.ActualMinutes) : '–'}</StyledTableCell>
                                    <StyledTableCell align='right'>
                                        <StyledTimeUsage planned={person.PlannedMinutes} actual={person.ActualMinutes} />
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))}
                        </StyledTable>
                    </StyledSection>
                </>
            ) : null}
        </>
    );
};

// "Projektové statistiky": a project picked from the ones the user is part of (managers and admins: all), with its
// planned against worked time per worker and per task (?project=ID)
const ProjectsStats = ({ projectID, setProject }: { projectID: number | null; setProject: (id: number) => void }) => {
    const me = useAtomValue(userAtom);
    const { data: projects = noProjects } = useApi<ProjectListItem[]>('/auth/projects', { topics: ['projects'] });
    const manager = me?.UserType === 'ADMIN' || me?.UserType === 'MANAGER';
    const options = useMemo(
        () =>
            projects
                .filter((project) => manager || project.Mine)
                // unfinished first, then by name
                .sort((a, b) => Number(a.Finished) - Number(b.Finished) || a.Name.localeCompare(b.Name, 'cs')),
        [projects, manager],
    );
    const chosen = options.find((project) => project.ID === projectID) ?? options.find((project) => project.Mine) ?? options[0] ?? null;

    return (
        <>
            <Toolbar title={chosen?.Name ?? 'Projekty'} subtitle={chosen?.Customer}>
                {options.length ? (
                    <StyledSelect
                        id='statsProject'
                        label='Projekt'
                        size='small'
                        fullWidth={false}
                        sx={{ minWidth: '16rem' }}
                        value={chosen?.ID ?? ''}
                        onChange={(event) => setProject(Number(event.target.value))}
                        options={options.map((project) => ({ value: project.ID, label: project.Finished ? `${project.Name} (dokončen)` : project.Name }))}
                    />
                ) : null}
            </Toolbar>
            {chosen ? (
                // a block around it, so the statistics take the full width
                <div>
                    <ProjectStats key={chosen.ID} projectID={chosen.ID} />
                </div>
            ) : (
                <Typography sx={{ color: 'text.secondary' }}>Nejste v žádném projektu.</Typography>
            )}
        </>
    );
};

const tabs = [
    { label: 'Moje statistiky', value: 'me' },
    { label: 'Projektové statistiky', value: 'projects' },
    { label: 'Týmové statistiky', value: 'team', managers: true },
];

// The Statistiky section: tabs for your own week or month, a project's numbers and (managers and admins) your team's.
// The address keeps the choice: ?tab=projects&project=3, ?tab=team&month=2026-11&user=12, ?period=week&week=2026-11-16.
export const Stats = () => {
    const setTab = useSetAtom(selectedTabAtom);
    useEffect(() => {
        setTab('Statistiky');
    });

    const me = useAtomValue(userAtom);
    const manager = me?.UserType === 'ADMIN' || me?.UserType === 'MANAGER';
    const shownTabs = tabs.filter((tab) => !tab.managers || manager);

    const [searchParams, setSearchParams] = useSearchParams();
    const tab = shownTabs.find((item) => item.value === searchParams.get('tab'))?.value ?? 'me';
    // a week (?period=week&week=<its Monday>) or a calendar month (?month=2026-11, the default), never in the future
    const unit = searchParams.get('period') === 'week' ? 'week' : 'month';
    const monthKey =
        /^\d{4}-\d{2}$/.test(searchParams.get('month') ?? '') && searchParams.get('month')! <= dayjs().format('YYYY-MM')
            ? searchParams.get('month')!
            : dayjs().format('YYYY-MM');
    const weekKey = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.get('week') ?? '') ? searchParams.get('week') : null;
    const period = useMemo(() => {
        if (unit === 'week') {
            const thisWeek = dayjs().startOf('isoWeek');
            const week = weekKey && dayjs(weekKey).isValid() ? dayjs(weekKey).startOf('isoWeek') : thisWeek;
            return statsPeriod('week', week.isAfter(thisWeek) ? thisWeek : week);
        }
        return statsPeriod('month', dayjs(`${monthKey}-01`).startOf('month'));
    }, [unit, monthKey, weekKey]);
    const update = (changes: Record<string, string | number | null | undefined>) => {
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined) next.delete(key);
            else next.set(key, String(value));
        }
        setSearchParams(next, { replace: true });
    };
    const scrollTop = () => document.querySelector('.content-wrap_inner')?.scrollTo({ top: 0 });

    const periodPicker = (
        <>
            <StyledSegmentedSelect
                label='Období'
                showLabels
                sx={{ width: 'auto' }}
                value={unit}
                onChange={(value) => update({ period: value === 'week' ? 'week' : null })}
                options={[
                    { value: 'week', label: 'Týden' },
                    { value: 'month', label: 'Měsíc' },
                ]}
            />
            {unit === 'week' ? (
                <StyledWeekPicker value={period.start} max={dayjs()} onChange={(value) => update({ week: value.format('YYYY-MM-DD') })} />
            ) : (
                <StyledMonthPicker value={period.start} onChange={(value) => update({ month: value.format('YYYY-MM') })} />
            )}
        </>
    );

    return (
        <>
            <StyledPageHeader
                title='Statistiky'
                tabs={shownTabs}
                active={tab}
                onSelect={(value) => update({ tab: value === 'me' ? null : value, user: null })}
            />
            <div className='content-wrap_inner'>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '75rem', width: '100%', mx: 'auto' }}>
                    {tab === 'projects' ? (
                        <ProjectsStats projectID={Number(searchParams.get('project')) || null} setProject={(id) => update({ project: id })} />
                    ) : tab === 'team' ? (
                        <TeamStats
                            period={period}
                            periodPicker={periodPicker}
                            userID={Number(searchParams.get('user')) || null}
                            setUser={(id) => {
                                update({ user: id });
                                scrollTop();
                            }}
                        />
                    ) : me ? (
                        <>
                            <Toolbar title={fullName(me)} subtitle={me.Position}>
                                {periodPicker}
                            </Toolbar>
                            <PersonStats userID={me.ID} period={period} />
                        </>
                    ) : null}
                </Box>
            </div>
        </>
    );
};
