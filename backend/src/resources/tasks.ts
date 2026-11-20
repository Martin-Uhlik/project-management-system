import type { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import prisma from '../client.ts';
import { currentUser, isManager } from '../auth.ts';
import { findProjectTask, isAssignedToTask, publicUserSelect, requireProjectAccess, requireTaskAccess } from '../access.ts';
import { badRequest, forbidden } from '../errors.ts';
import { date, id, idParam, parseBody, requiredText, sentKeys, text } from '../validation.ts';

// Uploaded task files: <DATA_DIR>/<project>/<task>/inputFiles|outputFiles
const dataDir = () => process.env.DATA_DIR || './data';

// Stores the uploaded "file" field into dir; only the base name is kept, so a crafted name can't leave dir
const saveUploadedFile = async (req: Request, dir: string) => {
    const upload = req.files?.file;
    const file = Array.isArray(upload) ? upload[0] : upload;
    if (!file) throw badRequest('Chybí soubor.');
    const name = path.basename(file.name);
    if (!name || name === '.' || name === '..') throw badRequest('Neplatný název souboru.');
    await fs.promises.mkdir(dir, { recursive: true });
    await file.mv(path.join(dir, name));
};

const listFiles = async (dir: string) => {
    await fs.promises.mkdir(dir, { recursive: true });
    const files = await fs.promises.readdir(dir);
    return Promise.all(
        files.map(async (file) => {
            const details = await fs.promises.stat(path.join(dir, file));
            return { file: file, size: (details.size / 1048576).toFixed(1), details: details.birthtime };
        }),
    );
};

const taskDir = (req: Request, kind: 'inputFiles' | 'outputFiles') =>
    path.join(dataDir(), String(idParam(req, 'projectID')), String(idParam(req, 'taskID')), kind);

const createTaskSchema = z.object({
    Name: requiredText(200),
    Description: text(5000).nullable().optional(),
    FinishDate: date,
    XPosition: z.number().finite(),
    YPosition: z.number().finite(),
    Size: z.number().int().min(0).max(1000),
    OwnerID: id,
});

// ADMIN and MANAGER (see app.ts)
export const createTask = async (req: Request, res: Response) => {
    const projectID = idParam(req, 'projectID');
    await requireProjectAccess(currentUser(res), projectID);
    const task = parseBody(createTaskSchema, req.body);
    await prisma.task.create({
        data: {
            ...task,
            Finished: false,
            ProjectID: projectID,
        },
    });
    return res.status(200).send();
};

export const getUserTasks = async (req: Request, res: Response) => {
    const tasks = await prisma.user_Task.findMany({
        where: {
            UserID: idParam(req, 'userID'),
            Task: { Project: { Deleted: false } },
        },
        select: {
            Task: {
                include: {
                    Owner: {
                        select: {
                            FirstName: true,
                            LastName: true,
                        },
                    },
                    Project: {
                        select: {
                            Name: true,
                        },
                    },
                },
            },
        },
    });
    return res.status(200).send(tasks);
};

export const getProjectTasks = async (req: Request, res: Response) => {
    const projectID = idParam(req, 'projectID');
    await requireProjectAccess(currentUser(res), projectID);
    const tasks = await prisma.task.findMany({
        where: {
            ProjectID: projectID,
        },
        select: {
            ID: true,
            Name: true,
            Size: true,
            XPosition: true,
            YPosition: true,
            Finished: true,
        },
    });

    const dependencies = await prisma.taskDependency.findMany({
        where: {
            ProjectID: projectID,
        },
    });

    return res.status(200).send({ tasks: tasks, dependencies: dependencies });
};

const linkedTaskInclude = {
    include: {
        Owner: {
            select: {
                FirstName: true,
                LastName: true,
            },
        },
        Project: {
            select: {
                Name: true,
            },
        },
    },
} as const;

export const getTask = async (req: Request, res: Response) => {
    const projectID = idParam(req, 'projectID');
    const taskID = idParam(req, 'taskID');
    await requireTaskAccess(currentUser(res), projectID, taskID);
    const task = await prisma.task.findUnique({
        where: {
            ID: taskID,
        },
        include: {
            User_Task: {
                select: {
                    User: {
                        select: publicUserSelect,
                    },
                },
            },
            Predecessors: {
                include: {
                    Successor: linkedTaskInclude,
                },
            },
            Successors: {
                include: {
                    Predecessor: linkedTaskInclude,
                },
            },
        },
    });

    return res.status(200).send(task);
};

const updateTaskSchema = z.object({
    // task details: ADMIN and MANAGER
    Name: requiredText(200).optional(),
    Description: text(5000).nullable().optional(),
    FinishDate: date.optional(),
    OwnerID: id.optional(),
    DurationHours: z.number().int().min(0).max(100000).optional(),
    DurationMinutes: z.number().int().min(0).max(59).optional(),
    Members: z
        .array(z.object({ UserID: id }))
        .max(1000)
        .optional(),
    MachineID: id.nullable().optional(),
    // also the task's assigned users
    Finished: z.boolean().optional(),
    // also anyone who can open the project (moving the task in the graph)
    XPosition: z.number().finite().optional(),
    YPosition: z.number().finite().optional(),
});
const ASSIGNEE_FIELDS = ['Finished', 'XPosition', 'YPosition'];
const PROJECT_FIELDS = ['XPosition', 'YPosition'];

export const updateTask = async (req: Request, res: Response) => {
    const projectID = idParam(req, 'projectID');
    const taskID = idParam(req, 'taskID');
    const me = currentUser(res);
    const keys = sentKeys(req.body);
    await requireTaskAccess(me, projectID, taskID);

    if (!isManager(me)) {
        const onlyPosition = keys.every((key) => PROJECT_FIELDS.includes(key));
        const onlyAssigneeFields = keys.every((key) => ASSIGNEE_FIELDS.includes(key));
        if (!(onlyPosition || (onlyAssigneeFields && (await isAssignedToTask(me, taskID))))) throw forbidden();
    }

    const { Members, ...data } = parseBody(updateTaskSchema, req.body);
    await prisma.task.update({
        where: {
            ID: taskID,
        },
        data: {
            ...data,
            ...(Members && {
                User_Task: {
                    deleteMany: {},
                    createMany: {
                        data: [...new Set(Members.map((member) => member.UserID))].map((UserID) => ({ UserID })),
                    },
                },
            }),
        },
    });

    return res.status(200).send();
};

// ADMIN and MANAGER (see app.ts)
export const removeTask = async (req: Request, res: Response) => {
    const projectID = idParam(req, 'projectID');
    const taskID = idParam(req, 'taskID');
    await findProjectTask(projectID, taskID);
    // the task's links go with it; material events and requests stay, without the task
    await prisma.$transaction([
        prisma.taskDependency.deleteMany({ where: { OR: [{ PredecessorID: taskID }, { SuccessorID: taskID }] } }),
        prisma.user_Task.deleteMany({ where: { TaskID: taskID } }),
        prisma.userTaskTime.deleteMany({ where: { TaskID: taskID } }),
        prisma.user.updateMany({ where: { CurrentTaskID: taskID }, data: { CurrentTaskID: null } }),
        prisma.materialEvent.updateMany({ where: { TargetTaskID: taskID }, data: { TargetTaskID: null } }),
        prisma.materialRequest.updateMany({ where: { TargetTaskID: taskID }, data: { TargetTaskID: null } }),
        prisma.task.delete({ where: { ID: taskID } }),
    ]);
    return res.status(200).send();
};

const dependencySchema = z.object({ id: id });

// The task in the URL and the other task in the body, both in the URL's project
const dependencyTasks = async (req: Request) => {
    const projectID = idParam(req, 'projectID');
    const taskID = idParam(req, 'taskID');
    const other = parseBody(dependencySchema, req.body).id;
    await findProjectTask(projectID, taskID);
    await findProjectTask(projectID, other);
    if (other === taskID) throw badRequest('Úkol nemůže záviset sám na sobě.');
    return { projectID, taskID, other };
};

// Dependencies: ADMIN and MANAGER (see app.ts)
export const addPredecessor = async (req: Request, res: Response) => {
    const { projectID, taskID, other } = await dependencyTasks(req);
    await prisma.taskDependency.create({
        data: {
            PredecessorID: other,
            SuccessorID: taskID,
            ProjectID: projectID,
        },
    });
    return res.status(200).send();
};

export const addSuccessor = async (req: Request, res: Response) => {
    const { projectID, taskID, other } = await dependencyTasks(req);
    await prisma.taskDependency.create({
        data: {
            PredecessorID: taskID,
            SuccessorID: other,
            ProjectID: projectID,
        },
    });
    return res.status(200).send();
};

export const removePredecessor = async (req: Request, res: Response) => {
    const { projectID, taskID, other } = await dependencyTasks(req);
    await prisma.taskDependency.deleteMany({
        where: {
            PredecessorID: other,
            SuccessorID: taskID,
            ProjectID: projectID,
        },
    });
    return res.status(200).send();
};

export const removeSuccessor = async (req: Request, res: Response) => {
    const { projectID, taskID, other } = await dependencyTasks(req);
    await prisma.taskDependency.deleteMany({
        where: {
            PredecessorID: taskID,
            SuccessorID: other,
            ProjectID: projectID,
        },
    });
    return res.status(200).send();
};

// Task files: anyone who can open the task
const withTaskAccess = async (req: Request, res: Response) => {
    await requireTaskAccess(currentUser(res), idParam(req, 'projectID'), idParam(req, 'taskID'));
};

export const getInputFiles = async (req: Request, res: Response) => {
    await withTaskAccess(req, res);
    return res.status(200).send(await listFiles(taskDir(req, 'inputFiles')));
};

export const getOutputFiles = async (req: Request, res: Response) => {
    await withTaskAccess(req, res);
    return res.status(200).send(await listFiles(taskDir(req, 'outputFiles')));
};

export const uploadInputFile = async (req: Request, res: Response) => {
    await withTaskAccess(req, res);
    await saveUploadedFile(req, taskDir(req, 'inputFiles'));
    return res.status(200).send();
};

export const uploadOutputFile = async (req: Request, res: Response) => {
    await withTaskAccess(req, res);
    await saveUploadedFile(req, taskDir(req, 'outputFiles'));
    return res.status(200).send();
};
