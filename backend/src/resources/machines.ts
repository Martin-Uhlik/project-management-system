import type { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import prisma from '../client.ts';
import { currentUser, isManager, type SessionUser } from '../auth.ts';
import { publicUserSelect, taskProgressCount } from '../access.ts';
import { forbidden, notFound } from '../errors.ts';
import { date, id, idParam, parseBody, requiredText, text } from '../validation.ts';
import { dataDir, saveUploadedFile, sendDownload } from './tasks.ts';

const createMachineSchema = z.object({
    Name: requiredText(200),
    Description: text(5000).nullable().optional(),
    ResponsibleID: id.nullable().optional(),
});

const personSelect = { ID: true, FirstName: true, LastName: true } as const;
const serviceSelect = {
    ID: true,
    Date: true,
    Done: true,
    Title: true,
    Note: true,
    CreatedAt: true,
    CreatedBy: { select: personSelect },
} as const;

// The machine (not deleted), or 404
const findMachine = async (machineID: number) => {
    const machine = await prisma.machine.findFirst({ where: { ID: machineID, Deleted: false }, select: { ID: true, ResponsibleID: true } });
    if (!machine) throw notFound();
    return machine;
};

// Changing a machine (its details, services and files): admins, managers and the machine's responsible person
const requireMachineEditor = async (user: SessionUser, machineID: number) => {
    const machine = await findMachine(machineID);
    if (!isManager(user) && machine.ResponsibleID !== user.ID) throw forbidden();
    return machine;
};

// The last service done and the next one planned, from a machine's services
const serviceSummary = (services: { Date: Date; Done: boolean }[]) => {
    const done = services.filter((service) => service.Done).sort((a, b) => b.Date.getTime() - a.Date.getTime());
    const planned = services.filter((service) => !service.Done).sort((a, b) => a.Date.getTime() - b.Date.getTime());
    return { LastService: done[0] ?? null, NextService: planned[0] ?? null };
};

// ADMIN only (see app.ts)
export const createMachine = async (req: Request, res: Response) => {
    const machine = parseBody(createMachineSchema, req.body);
    await prisma.machine.create({
        data: machine,
    });
    return res.status(200).send();
};

// Every machine with its responsible person, last and next service and how many unfinished tasks are queued on it
export const getMachines = async (req: Request, res: Response) => {
    const machines = await prisma.machine.findMany({
        where: {
            Deleted: false,
        },
        select: {
            ID: true,
            Name: true,
            Description: true,
            Responsible: { select: publicUserSelect },
            Services: { select: { ID: true, Date: true, Done: true, Title: true } },
            _count: { select: { Task: { where: { Finished: false } } } },
        },
        orderBy: { Name: 'asc' },
    });
    return res.status(200).send(machines.map(({ Services, _count, ...machine }) => ({ ...machine, ...serviceSummary(Services), OpenTasks: _count.Task })));
};

export const getMachine = async (req: Request, res: Response) => {
    const machine = await prisma.machine.findFirst({
        where: {
            ID: idParam(req, 'machineID'),
            Deleted: false,
        },
        include: {
            Responsible: { select: publicUserSelect },
            Services: { select: serviceSelect, orderBy: { Date: 'desc' } },
            Task: {
                include: {
                    ...taskProgressCount,
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
    if (!machine) throw notFound();
    const files = await listMachineFiles(machine.ID);
    return res.status(200).send({ ...machine, ...serviceSummary(machine.Services), FileCount: files.length });
};

const updateMachineSchema = createMachineSchema.partial();

// ADMIN, MANAGER and the machine's responsible person; only admins and managers choose the responsible person
export const updateMachine = async (req: Request, res: Response) => {
    const me = currentUser(res);
    const machine = await requireMachineEditor(me, idParam(req, 'machineID'));
    const data = parseBody(updateMachineSchema, req.body);
    if (data.ResponsibleID !== undefined && data.ResponsibleID !== machine.ResponsibleID && !isManager(me)) throw forbidden();
    await prisma.machine.update({
        where: {
            ID: machine.ID,
        },
        data,
    });
    return res.status(200).send();
};

// ADMIN only (see app.ts)
export const removeMachine = async (req: Request, res: Response) => {
    await prisma.machine.update({
        where: {
            ID: idParam(req, 'machineID'),
        },
        data: {
            Deleted: true,
        },
    });
    return res.status(200).send();
};

// --- services

const serviceSchema = z.object({
    Date: date,
    Done: z.boolean().optional(),
    Title: requiredText(200),
    Note: text(5000).nullable().optional(),
});

export const createService = async (req: Request, res: Response) => {
    const me = currentUser(res);
    const machine = await requireMachineEditor(me, idParam(req, 'machineID'));
    const service = parseBody(serviceSchema, req.body);
    await prisma.machineService.create({ data: { ...service, MachineID: machine.ID, CreatedByID: me.ID } });
    return res.status(200).send();
};

// The service, which must belong to the machine in the URL
const findService = async (req: Request, res: Response) => {
    const machine = await requireMachineEditor(currentUser(res), idParam(req, 'machineID'));
    const service = await prisma.machineService.findFirst({ where: { ID: idParam(req, 'serviceID'), MachineID: machine.ID }, select: { ID: true } });
    if (!service) throw notFound();
    return service;
};

export const updateService = async (req: Request, res: Response) => {
    const service = await findService(req, res);
    await prisma.machineService.update({ where: { ID: service.ID }, data: parseBody(serviceSchema.partial(), req.body) });
    return res.status(200).send();
};

export const removeService = async (req: Request, res: Response) => {
    const service = await findService(req, res);
    await prisma.machineService.delete({ where: { ID: service.ID } });
    return res.status(200).send();
};

// --- worked time: the time people logged on the machine's tasks, to see the days the machine stood still

// at most about a quarter of a year at once
const workQuery = z
    .object({ from: date, to: date })
    .refine(({ from, to }) => to > from && to.getTime() - from.getTime() <= 93 * 24 * 3600 * 1000, 'Neplatné období.');

// GET /auth/machines/:machineID/work?from=&to=: the work sessions on the machine's tasks that overlap the period, cut
// to it (a running timer counts until now). The browser adds them up per day, in its own time zone.
export const getMachineWork = async (req: Request, res: Response) => {
    const machine = await findMachine(idParam(req, 'machineID'));
    const { from, to } = parseBody(workQuery, req.query);
    const now = new Date();
    const sessions = await prisma.userTaskTime.findMany({
        where: {
            Task: { MachineID: machine.ID },
            StartTime: { lt: to },
            OR: [{ StopTime: null }, { StopTime: { gt: from } }],
        },
        select: { StartTime: true, StopTime: true, User: { select: personSelect }, Task: { select: { ID: true, Name: true, ProjectID: true } } },
        orderBy: { StartTime: 'asc' },
    });
    const clip = (time: number) => new Date(Math.min(Math.max(time, from.getTime()), to.getTime()));
    return res.status(200).send(
        sessions.map((session) => ({
            ...session,
            StartTime: clip(session.StartTime.getTime()),
            StopTime: clip(Math.min((session.StopTime ?? now).getTime(), now.getTime())),
        })),
    );
};

// --- files (documentation, manuals...): <DATA_DIR>/machines/<machine>

const machineDir = (machineID: number) => path.join(dataDir(), 'machines', String(machineID));

// The machine's files with their size and who uploaded them when (the same shape as task files)
const listMachineFiles = async (machineID: number) => {
    const dir = machineDir(machineID);
    const names = await fs.promises.readdir(dir).catch((error) => {
        if (error.code === 'ENOENT') return [] as string[];
        throw error;
    });
    const records = await prisma.machineFile.findMany({
        where: { MachineID: machineID },
        select: { Name: true, UploadedAt: true, UploadedBy: { select: personSelect } },
    });
    const byName = new Map(records.map((record) => [record.Name, record]));
    const files = await Promise.all(
        names.map(async (name) => {
            const details = await fs.promises.stat(path.join(dir, name));
            if (!details.isFile()) return null;
            const record = byName.get(name);
            return {
                file: name,
                size: (details.size / 1048576).toFixed(1),
                details: record?.UploadedAt ?? details.mtime,
                Bytes: details.size,
                UploadedBy: record?.UploadedBy ?? null,
            };
        }),
    );
    return files.filter((file) => file !== null).sort((a, b) => new Date(b.details).getTime() - new Date(a.details).getTime());
};

// everyone signed in may read a machine's files, like the machine itself
export const getMachineFiles = async (req: Request, res: Response) => {
    const machine = await findMachine(idParam(req, 'machineID'));
    return res.status(200).send(await listMachineFiles(machine.ID));
};

export const uploadMachineFile = async (req: Request, res: Response) => {
    const me = currentUser(res);
    const machine = await requireMachineEditor(me, idParam(req, 'machineID'));
    const Name = await saveUploadedFile(req, machineDir(machine.ID));
    await prisma.machineFile.upsert({
        where: { MachineID_Name: { MachineID: machine.ID, Name } },
        create: { MachineID: machine.ID, Name, UploadedByID: me.ID },
        update: { UploadedAt: new Date(), UploadedByID: me.ID },
    });
    return res.status(200).send();
};

export const downloadMachineFile = async (req: Request, res: Response) => {
    const machine = await findMachine(idParam(req, 'machineID'));
    return sendDownload(req, res, machineDir(machine.ID));
};

export const removeMachineFile = async (req: Request, res: Response) => {
    const machine = await requireMachineEditor(currentUser(res), idParam(req, 'machineID'));
    const name = String(req.params.fileName ?? '');
    if (!name || path.basename(name) !== name || name === '.' || name === '..') throw notFound();
    const removed = await fs.promises.rm(path.join(machineDir(machine.ID), name)).then(
        () => true,
        () => false,
    );
    if (!removed) throw notFound();
    await prisma.machineFile.deleteMany({ where: { MachineID: machine.ID, Name: name } });
    return res.status(200).send();
};
