import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { currentUser } from '../auth.ts';
import { publicUserSelect, requireTaskAccessByID } from '../access.ts';
import { count, id, idParam, parseBody, requiredText, text } from '../validation.ts';
import { badRequest, notFound } from '../errors.ts';
import type { EventType } from '../generated/prisma/client.ts';

// ---------------------------------------------------------------------------------------------------------------------
// Stock: what is in stock, reserved and available, from the stock movements (MaterialEvent)
// - ADD puts items in stock, REMOVE takes them out
// - RESERVATION sets items aside for a task (or in general, without a task); taking items out for that task (REMOVE
//   with the task) uses its reservation up, and RELEASE gives (part of) it back

type StockEvent = { EventType: EventType; Count: number; TargetTaskID: number | null };

// the open reservation of each task (key: the task's ID, or 0 for reservations without a task)
const openReservations = (events: StockEvent[]) => {
    const byTask = new Map<number, { Reserved: number; Taken: number; Released: number }>();
    for (const event of events) {
        const key = event.TargetTaskID ?? 0;
        const entry = byTask.get(key) ?? { Reserved: 0, Taken: 0, Released: 0 };
        if (event.EventType === 'RESERVATION') entry.Reserved += event.Count;
        else if (event.EventType === 'REMOVE') entry.Taken += event.Count;
        else if (event.EventType === 'RELEASE') entry.Released += event.Count;
        byTask.set(key, entry);
    }
    return new Map(
        [...byTask]
            .filter(([, entry]) => entry.Reserved > 0)
            .map(([key, entry]) => [key, { ...entry, Open: Math.max(0, entry.Reserved - entry.Taken - entry.Released) }]),
    );
};

export const stockOf = (events: StockEvent[]) => {
    const Count = events.reduce((total, event) => total + (event.EventType === 'ADD' ? event.Count : event.EventType === 'REMOVE' ? -event.Count : 0), 0);
    const Reserved = [...openReservations(events).values()].reduce((total, entry) => total + entry.Open, 0);
    return { Count, Reserved, Available: Count - Reserved };
};

const materialFields = {
    Name: requiredText(200),
    Description: text(5000).nullable().optional(),
    Unit: requiredText(20).optional(),
    Price: z.number().int().min(0).max(1_000_000_000).optional(),
    Supplier: text(200).nullable().optional(),
    Location: text(200).nullable().optional(),
    MinCount: z.number().int().min(0).max(1_000_000).optional(),
};

const createMaterialSchema = z.object({
    ...materialFields,
    // how many are put in stock right away (none: an empty item)
    Count: z.number().int().min(0).max(1_000_000).optional(),
});

// ADMIN and MANAGER (see app.ts); the first stock entry is recorded as made by the signed-in user
export const createMaterial = async (req: Request, res: Response) => {
    const { Count, ...material } = parseBody(createMaterialSchema, req.body);
    const created = await prisma.material.create({
        data: {
            ...material,
            MaterialEvent: Count ? { create: { Count, TargetUserID: currentUser(res).ID, EventType: 'ADD' } } : undefined,
        },
    });
    return res.status(200).send({ ID: created.ID });
};

const eventSelect = { EventType: true, Count: true, TargetTaskID: true } as const;

// Every stock item with how many are in stock, reserved and available (and its stock movements)
export const getMaterials = async (req: Request, res: Response) => {
    const materials = await prisma.material.findMany({
        include: { MaterialEvent: true },
        orderBy: { Name: 'asc' },
    });
    return res.status(200).send(materials.map((material) => ({ ...material, ...stockOf(material.MaterialEvent) })));
};

const taskSelect = { ID: true, Name: true, ProjectID: true, FinishDate: true, Finished: true, Project: { select: { Name: true } } } as const;
const requestInclude = {
    TargetUser: { select: publicUserSelect },
    AcceptedBy: { select: publicUserSelect },
    TargetTask: { select: taskSelect },
    Material: { select: { ID: true, Name: true, Unit: true } },
} as const;

// One stock item: its details, stock, movements (newest first), open reservations and the requests to restock it
export const getMaterial = async (req: Request, res: Response) => {
    const material = await prisma.material.findUnique({
        where: { ID: idParam(req, 'materialID') },
        include: {
            MaterialEvent: {
                include: { TargetUser: { select: publicUserSelect }, TargetTask: { select: taskSelect } },
                orderBy: [{ CreatedAt: 'desc' }, { ID: 'desc' }],
            },
            Requests: { include: requestInclude, orderBy: { AddedDate: 'desc' } },
        },
    });
    if (!material) throw notFound();
    const { MaterialEvent, ...details } = material;
    return res.status(200).send({
        ...details,
        ...stockOf(MaterialEvent),
        Events: MaterialEvent,
        Reservations: reservationsOf(material, MaterialEvent),
    });
};

type ReservationEvent = StockEvent & {
    CreatedAt: Date;
    TargetTask: { ID: number; Name: string; ProjectID: number; FinishDate: Date; Finished: boolean; Project: { Name: string } } | null;
    TargetUser: { ID: number; FirstName: string; LastName: string } | null;
};

// The open reservations of an item, one per task: how many were reserved, taken and given back, who reserved them and
// when last
const reservationsOf = (material: { ID: number; Name: string; Unit: string; Price: number }, events: ReservationEvent[]) =>
    [...openReservations(events)]
        .filter(([, entry]) => entry.Open > 0)
        .map(([key, entry]) => {
            const reservations = events.filter((event) => event.EventType === 'RESERVATION' && (event.TargetTaskID ?? 0) === key);
            const people = new Map(reservations.filter((event) => event.TargetUser).map((event) => [event.TargetUser!.ID, event.TargetUser!]));
            const last = reservations.reduce((newest, event) => (event.CreatedAt > newest ? event.CreatedAt : newest), reservations[0].CreatedAt);
            return {
                Key: `${material.ID}-${key}`,
                Material: { ID: material.ID, Name: material.Name, Unit: material.Unit, Price: material.Price },
                Task: reservations[0].TargetTask,
                ...entry,
                ReservedAt: last,
                ReservedBy: [...people.values()],
            };
        });

// GET /auth/material/reservations: the open reservations of every item, the soonest task deadline first
export const getReservations = async (req: Request, res: Response) => {
    const materials = await prisma.material.findMany({
        select: {
            ID: true,
            Name: true,
            Unit: true,
            Price: true,
            MaterialEvent: { include: { TargetUser: { select: publicUserSelect }, TargetTask: { select: taskSelect } } },
        },
    });
    const reservations = materials.flatMap((material) => reservationsOf(material, material.MaterialEvent));
    const deadline = (reservation: (typeof reservations)[number]) => reservation.Task?.FinishDate.getTime() ?? Infinity;
    return res.status(200).send(reservations.sort((a, b) => deadline(a) - deadline(b) || a.Material.Name.localeCompare(b.Material.Name)));
};

// ADMIN and MANAGER (see app.ts)
export const updateMaterial = async (req: Request, res: Response) => {
    const ID = idParam(req, 'materialID');
    const data = parseBody(z.object({ ...materialFields, Name: materialFields.Name.optional() }), req.body);
    if (!(await prisma.material.findUnique({ where: { ID }, select: { ID: true } }))) throw notFound();
    await prisma.material.update({ where: { ID }, data });
    return res.status(200).send();
};

const eventSchema = z.object({
    Count: count,
    EventType: z.enum(['ADD', 'REMOVE', 'RESERVATION', 'RELEASE']),
    TargetTaskID: id.nullable().optional(),
});

// Stock movements (put in, take out, reserve for a task, give a reservation back): everyone, for tasks they can open,
// recorded as made by the signed-in user. More than is in stock can't be taken out, nor more given back than is reserved.
export const eventMaterial = async (req: Request, res: Response) => {
    const materialID = idParam(req, 'materialID');
    const event = parseBody(eventSchema, req.body);
    const me = currentUser(res);
    const material = await prisma.material.findUnique({ where: { ID: materialID }, select: { ID: true, MaterialEvent: { select: eventSelect } } });
    if (!material) throw notFound();
    if (event.TargetTaskID) {
        await requireTaskAccessByID(me, event.TargetTaskID);
    }
    if (event.EventType === 'REMOVE' && event.Count > stockOf(material.MaterialEvent).Count) {
        throw badRequest('Na skladě jich tolik není.');
    }
    if (event.EventType === 'RELEASE' && event.Count > (openReservations(material.MaterialEvent).get(event.TargetTaskID ?? 0)?.Open ?? 0)) {
        throw badRequest('Tolik jich zarezervováno není.');
    }
    await prisma.materialEvent.create({
        data: {
            ...event,
            TargetUserID: me.ID,
            MaterialID: materialID,
        },
    });
    return res.status(200).send();
};

// The material of a task: per item, how many are still reserved for it and how many were taken out for it
export const getTaskMaterial = async (req: Request, res: Response) => {
    const taskID = idParam(req, 'taskID');
    await requireTaskAccessByID(currentUser(res), taskID);
    const materials = await prisma.material.findMany({
        where: { MaterialEvent: { some: { TargetTaskID: taskID } } },
        include: { MaterialEvent: { where: { TargetTaskID: taskID }, select: eventSelect } },
        orderBy: { Name: 'asc' },
    });
    return res.status(200).send(
        materials.map(({ MaterialEvent, ...material }) => {
            const reservation = openReservations(MaterialEvent).get(taskID);
            const taken = MaterialEvent.filter((event) => event.EventType === 'REMOVE').reduce((total, event) => total + event.Count, 0);
            return { Material: material, Reserved: reservation?.Open ?? 0, Taken: taken };
        }),
    );
};
