import prisma from './client.ts';
import { isManager, type SessionUser } from './auth.ts';
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
} as const;
