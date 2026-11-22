import prisma from './client.ts';
import { hasRole, isManager, type SessionUser } from './auth.ts';
import { forbidden, notFound } from './errors.ts';

// Who may open a project (its task graph, tasks and files): admins and managers, the project's owner and members,
// and anyone assigned to one of its tasks (only for that task, see requireTaskAccess)
const isProjectOwnerOrMember = async (user: SessionUser, projectID: number) => {
    const project = await prisma.project.findFirst({
        where: {
            ID: projectID,
            OR: [{ OwnerID: user.ID }, { Member: { some: { UserID: user.ID } } }],
        },
        select: { ID: true },
    });
    return project !== null;
};

const findProject = async (projectID: number) => {
    const project = await prisma.project.findFirst({ where: { ID: projectID, Deleted: false }, select: { ID: true } });
    if (!project) throw notFound();
    return project;
};

// Who may change a project's details or delete it (its Nastavení tab): admins and the project's owner
export const requireProjectOwnerOrAdmin = async (user: SessionUser, projectID: number) => {
    const project = await prisma.project.findFirst({ where: { ID: projectID, Deleted: false }, select: { OwnerID: true } });
    if (!project) throw notFound();
    if (!hasRole(user, 'ADMIN') && project.OwnerID !== user.ID) throw forbidden();
};

export const requireProjectAccess = async (user: SessionUser, projectID: number) => {
    await findProject(projectID);
    if (isManager(user) || (await isProjectOwnerOrMember(user, projectID))) return;
    throw forbidden();
};

// The task, which must belong to the project in the URL; 404 otherwise
export const findProjectTask = async (projectID: number, taskID: number) => {
    await findProject(projectID);
    const task = await prisma.task.findFirst({ where: { ID: taskID, ProjectID: projectID } });
    if (!task) throw notFound();
    return task;
};

export const isAssignedToTask = async (user: SessionUser, taskID: number) => {
    const assignment = await prisma.user_Task.findFirst({ where: { TaskID: taskID, UserID: user.ID }, select: { ID: true } });
    return assignment !== null;
};

// Read access to one task: project access, or being assigned to the task
export const requireTaskAccess = async (user: SessionUser, projectID: number, taskID: number) => {
    const task = await findProjectTask(projectID, taskID);
    if (isManager(user) || (await isProjectOwnerOrMember(user, projectID)) || (await isAssignedToTask(user, taskID))) {
        return task;
    }
    throw forbidden();
};

// Same as requireTaskAccess, for routes that only carry the task ID
export const requireTaskAccessByID = async (user: SessionUser, taskID: number) => {
    const task = await prisma.task.findUnique({ where: { ID: taskID }, select: { ProjectID: true } });
    if (!task) throw notFound();
    return requireTaskAccess(user, task.ProjectID, taskID);
};

// Added to a task query (include or select): how many users work on the task now and how many time records it has,
// which make an unfinished task "in progress" in the browser (taskStatus), and how many of its prerequisites are not
// finished yet, which make it "blocked". (Task.Successors are the dependencies in which the task is the successor,
// i.e. its prerequisites - see TaskDependency.)
export const taskProgressCount = {
    _count: { select: { WorkingUsers: true, UserTaskTime: true, Successors: { where: { Predecessor: { Finished: false } } } } },
} as const;

// Added to a project query (include or select): its tasks someone has the timer running on, with when they started.
// Pass the result through projectWork, which turns them into WorkingSince (see projectStatus in the browser).
export const projectWorkSelect = {
    Task: { where: { WorkingUsers: { some: {} } }, select: { WorkingUsers: { select: { WorkStartTime: true } } } },
} as const;

// A project queried with projectWorkSelect, with the tasks replaced by WorkingSince: when the earliest of the timers
// running on its tasks started (null when nobody works on the project now)
export const projectWork = <P extends { Task: { WorkingUsers: { WorkStartTime: Date | null }[] }[] }>(project: P) => {
    const { Task, ...rest } = project;
    const starts = Task.flatMap((task) => task.WorkingUsers.map((user) => user.WorkStartTime)).filter((start) => start !== null);
    const WorkingSince = starts.length ? new Date(Math.min(...starts.map((start) => start.getTime()))) : null;
    return { ...rest, WorkingSince };
};

// The user fields that are safe to send to the browser (never the password hash or salt)
export const publicUserSelect = {
    ID: true,
    UserName: true,
    FirstName: true,
    LastName: true,
    Enabled: true,
    Position: true,
    WorkStartTime: true,
    UserType: true,
    CurrentTaskID: true,
    ManagerID: true,
} as const;
