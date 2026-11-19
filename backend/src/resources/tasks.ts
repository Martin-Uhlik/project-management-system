import type { Request, Response } from 'express';
import { getToken } from './utilities.ts';
import prisma from '../client.ts';
import { verifyUser } from '../auth.ts';
import { exceptionHandler } from '../exceptionHandler.ts';

import fs from 'node:fs';
import path from 'node:path';

// Stores the uploaded "file" field into dir; only the base name is kept, so a crafted name can't leave dir
const saveUploadedFile = async (req: Request, dir: string) => {
    const upload = req.files?.file;
    const file = Array.isArray(upload) ? upload[0] : upload;
    if (file) {
        await fs.promises.mkdir(dir, { recursive: true });
        await file.mv(path.join(dir, path.basename(file.name)));
    }
};

export const createTask = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.task.create({
        data: {
            ...req.body,
        },
    });
    return res.status(200).send();
});

export const getUserTasks = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const tasks = await prisma.user_Task.findMany({
        where: {
            UserID: +req.params.userID,
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
});

export const getProjectTasks = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const tasks = await prisma.task.findMany({
        where: {
            ProjectID: +req.params.projectID,
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
            ProjectID: +req.params.projectID,
        },
    });

    return res.status(200).send({ tasks: tasks, dependencies: dependencies });
});

export const getTask = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const task = await prisma.task.findUnique({
        where: {
            ID: +req.params.taskID,
        },
        include: {
            User_Task: {
                where: {
                    TaskID: +req.params.taskID,
                },
                select: {
                    User: {
                        select: {
                            ID: true,
                            UserName: true,
                            FirstName: true,
                            LastName: true,
                            Enabled: true,
                            Position: true,
                            WorkStartTime: true,
                            UserType: true,
                            CurrentTaskID: true,
                        },
                    },
                },
            },
            Predecessors: {
                include: {
                    Successor: {
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
            },
            Successors: {
                include: {
                    Predecessor: {
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
            },
        },
    });

    return res.status(200).send(task);
});

export const updateTask = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    if (!req.body.Name) {
        await prisma.task.update({
            where: {
                ID: +req.params.taskID,
            },
            data: {
                ...req.body,
            },
        });
    } else {
        await prisma.task.update({
            where: {
                ID: +req.params.taskID,
            },
            data: {
                Name: req.body.Name,
                Description: req.body.Description,
                FinishDate: req.body.FinishDate,
                OwnerID: req.body.OwnerID,
                DurationHours: req.body.DurationHours,
                DurationMinutes: req.body.DurationMinutes,
                User_Task: {
                    deleteMany: {
                        TaskID: +req.params.taskID,
                    },
                    createMany: {
                        data: req.body.Members,
                    },
                },
            },
        });
    }

    return res.status(200).send();
});

export const removeTask = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.taskDependency.deleteMany({
        where: {
            OR: [
                {
                    PredecessorID: +req.params.taskID,
                },
                {
                    SuccessorID: +req.params.taskID,
                },
            ],
        },
    });
    await prisma.task.delete({
        where: {
            ID: +req.params.taskID,
        },
    });
    return res.status(200).send();
});

export const addPredecessor = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.taskDependency.create({
        data: {
            PredecessorID: req.body.id,
            SuccessorID: +req.params.taskID,
            ProjectID: +req.params.projectID,
        },
    });
    return res.status(200).send();
});

export const addSuccessor = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.taskDependency.create({
        data: {
            PredecessorID: +req.params.taskID,
            SuccessorID: req.body.id,
            ProjectID: +req.params.projectID,
        },
    });
    return res.status(200).send();
});

export const removePredecessor = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.taskDependency.deleteMany({
        where: {
            PredecessorID: req.body.id,
            SuccessorID: +req.params.taskID,
            ProjectID: +req.params.projectID,
        },
    });
    return res.status(200).send();
});

export const removeSuccessor = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.taskDependency.deleteMany({
        where: {
            PredecessorID: +req.params.taskID,
            SuccessorID: req.body.id,
            ProjectID: +req.params.projectID,
        },
    });
    return res.status(200).send();
});

export const getInputFiles = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const projectdir = `./data/${+req.params.projectID}`;
    const taskdir = `./data/${+req.params.projectID}/${+req.params.taskID}`;

    if (!fs.existsSync(projectdir)) {
        fs.mkdirSync(projectdir);
    }

    if (!fs.existsSync(taskdir)) {
        fs.mkdirSync(taskdir);
    }

    if (!fs.existsSync(`${taskdir}/inputFiles`)) {
        fs.mkdirSync(`${taskdir}/inputFiles`);
    }

    const data = await fs.promises.readdir(`${taskdir}/inputFiles`);

    const dataDetails = data.map((file) => {
        const details = fs.statSync(`${taskdir}/inputFiles/${file}`);
        return { file: file, size: (details.size / 1048576).toFixed(1), details: details.birthtime };
    });
    return res.status(200).send(dataDetails);
});

export const getOutputFiles = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const projectdir = `./data/${+req.params.projectID}`;
    const taskdir = `./data/${+req.params.projectID}/${+req.params.taskID}`;

    if (!fs.existsSync(projectdir)) {
        fs.mkdirSync(projectdir);
    }

    if (!fs.existsSync(taskdir)) {
        fs.mkdirSync(taskdir);
    }

    if (!fs.existsSync(`${taskdir}/outputFiles`)) {
        fs.mkdirSync(`${taskdir}/outputFiles`);
    }

    const data = await fs.promises.readdir(`${taskdir}/outputFiles`);

    const dataDetails = data.map((file) => {
        const details = fs.statSync(`${taskdir}/outputFiles/${file}`);
        return { file: file, size: (details.size / 1048576).toFixed(1), details: details.birthtime };
    });
    return res.status(200).send(dataDetails);
});

export const uploadInputFile = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const taskdir = `./data/${+req.params.projectID}/${+req.params.taskID}`;

    await saveUploadedFile(req, `${taskdir}/inputFiles`);
    return res.status(200).send();
});

export const uploadOutputFile = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const taskdir = `./data/${+req.params.projectID}/${+req.params.taskID}`;

    await saveUploadedFile(req, `${taskdir}/outputFiles`);
    return res.status(200).send();
});
