import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { currentUser, isManager, type SessionUser } from '../auth.ts';
import { badRequest, forbidden, notFound } from '../errors.ts';
import { CHAT_EVENT, sendToUsers } from '../live.ts';
import { Prisma } from '../generated/prisma/client.ts';
import { id, idParam, parseBody } from '../validation.ts';

// ---------------------------------------------------------------------------------------------------------------------
// Chat: direct messages between any two users, and a group chat per project.
//
// A project's chat belongs to the people who are part of the project: its owner, its members and everyone assigned to
// one of its tasks. Admins and managers, who may open every project, may also open (read and write) every project's
// chat; it then shows in their list too. A new message goes out at once over the live connection (CHAT_EVENT, see
// live.ts) to everyone in the conversation; reading a conversation moves the user's read marker (ChatRead), which the
// unread counts are measured against.

export const MAX_MESSAGE_LENGTH = 4000;
const PAGE_SIZE = 50;

const userNameSelect = { ID: true, FirstName: true, LastName: true } as const;

const messageSelect = {
    ID: true,
    SenderID: true,
    RecipientID: true,
    ProjectID: true,
    Text: true,
    SentAt: true,
    Sender: { select: userNameSelect },
} as const;

type MessageRow = { ID: number; SenderID: number; RecipientID: number | null; ProjectID: number | null; Text: string; SentAt: Date };

// The users who are part of the project (owner, members, assignees)
const projectParticipants = async (projectID: number) => {
    const project = await prisma.project.findUnique({
        where: { ID: projectID },
        select: {
            OwnerID: true,
            Member: { select: { UserID: true } },
            Task: { select: { User_Task: { select: { UserID: true } } } },
        },
    });
    if (!project) return new Set<number>();
    return new Set([
        project.OwnerID,
        ...project.Member.map((member) => member.UserID),
        ...project.Task.flatMap((task) => task.User_Task.map((assignment) => assignment.UserID)),
    ]);
};

// The projects (not deleted) the user is part of
const participantProjectIDs = async (userID: number) => {
    const projects = await prisma.project.findMany({
        where: {
            Deleted: false,
            OR: [{ OwnerID: userID }, { Member: { some: { UserID: userID } } }, { Task: { some: { User_Task: { some: { UserID: userID } } } } }],
        },
        select: { ID: true },
    });
    return projects.map((project) => project.ID);
};

// 404 for a missing or deleted project, 403 unless the user may use its chat
export const requireProjectChatAccess = async (user: SessionUser, projectID: number) => {
    const project = await prisma.project.findFirst({ where: { ID: projectID, Deleted: false }, select: { ID: true } });
    if (!project) throw notFound();
    if (isManager(user)) return;
    if (!(await projectParticipants(projectID)).has(user.ID)) throw forbidden();
};

// The other user of a direct conversation: an existing, not deleted user other than oneself
const requirePartner = async (user: SessionUser, partnerID: number) => {
    if (partnerID === user.ID) throw badRequest('Sám sobě zprávu poslat nelze.');
    const partner = await prisma.user.findFirst({ where: { ID: partnerID, Deleted: false }, select: { ID: true } });
    if (!partner) throw notFound();
};

// Who is told about a new message in the project's chat: the people who are part of the project, and the admins and
// managers who have opened that chat before
const projectAudience = async (projectID: number) => {
    const participants = await projectParticipants(projectID);
    const readers = await prisma.chatRead.findMany({
        where: { ProjectID: projectID, User: { Deleted: false, UserType: { in: ['ADMIN', 'MANAGER'] } } },
        select: { UserID: true },
    });
    return [...participants, ...readers.map((reader) => reader.UserID)];
};

// Moves the user's read marker forward (never back) to lastReadID
const markRead = async (userID: number, target: { partnerID: number } | { projectID: number }, lastReadID: number) => {
    if ('partnerID' in target) {
        await prisma.$executeRaw`
            INSERT INTO "ChatRead" ("UserID", "PartnerID", "LastReadID") VALUES (${userID}, ${target.partnerID}, ${lastReadID})
            ON CONFLICT ("UserID", "PartnerID") DO UPDATE SET "LastReadID" = GREATEST("ChatRead"."LastReadID", EXCLUDED."LastReadID")`;
    } else {
        await prisma.$executeRaw`
            INSERT INTO "ChatRead" ("UserID", "ProjectID", "LastReadID") VALUES (${userID}, ${target.projectID}, ${lastReadID})
            ON CONFLICT ("UserID", "ProjectID") DO UPDATE SET "LastReadID" = GREATEST("ChatRead"."LastReadID", EXCLUDED."LastReadID")`;
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// The conversation list

// GET /auth/chat: every user to write to (with the last message and how many are unread), the project chats of the
// user and the unread total, for the header's badge
export const getConversations = async (req: Request, res: Response) => {
    const user = currentUser(res);

    const users = await prisma.user.findMany({
        where: { Deleted: false, NOT: { ID: user.ID } },
        select: { ...userNameSelect, UserName: true, Position: true, Enabled: true },
        orderBy: [{ LastName: 'asc' }, { FirstName: 'asc' }],
    });

    // the newest message with every partner, and how many of theirs came after the user's read marker
    const lastDirect = await prisma.$queryRaw<(MessageRow & { PartnerID: number })[]>`
        SELECT DISTINCT ON ("PartnerID") *
        FROM (
            SELECT CASE WHEN "SenderID" = ${user.ID} THEN "RecipientID" ELSE "SenderID" END AS "PartnerID", "ID", "SenderID",
                   "RecipientID", "ProjectID", "Text", "SentAt"
            FROM "ChatMessage"
            WHERE "RecipientID" IS NOT NULL AND ("SenderID" = ${user.ID} OR "RecipientID" = ${user.ID})
        ) AS direct
        ORDER BY "PartnerID", "ID" DESC`;
    const unreadDirect = await prisma.$queryRaw<{ PartnerID: number; Unread: number }[]>`
        SELECT m."SenderID" AS "PartnerID", COUNT(*)::int AS "Unread"
        FROM "ChatMessage" m
        LEFT JOIN "ChatRead" r ON r."UserID" = ${user.ID} AND r."PartnerID" = m."SenderID"
        WHERE m."RecipientID" = ${user.ID} AND m."ID" > COALESCE(r."LastReadID", 0)
        GROUP BY m."SenderID"`;

    // the user's projects; admins and managers also keep the chats they have opened
    const projectIDs = new Set(await participantProjectIDs(user.ID));
    if (isManager(user)) {
        const opened = await prisma.chatRead.findMany({
            where: { UserID: user.ID, ProjectID: { not: null }, Project: { Deleted: false } },
            select: { ProjectID: true },
        });
        for (const read of opened) if (read.ProjectID !== null) projectIDs.add(read.ProjectID);
    }
    const ids = [...projectIDs];
    const projects = ids.length
        ? await prisma.project.findMany({ where: { ID: { in: ids } }, select: { ID: true, Name: true, Finished: true }, orderBy: { Name: 'asc' } })
        : [];
    const lastProject = ids.length
        ? await prisma.$queryRaw<MessageRow[]>`
              SELECT DISTINCT ON ("ProjectID") "ID", "SenderID", "RecipientID", "ProjectID", "Text", "SentAt"
              FROM "ChatMessage"
              WHERE "ProjectID" IN (${Prisma.join(ids)})
              ORDER BY "ProjectID", "ID" DESC`
        : [];
    const unreadProject = ids.length
        ? await prisma.$queryRaw<{ ProjectID: number; Unread: number }[]>`
              SELECT m."ProjectID", COUNT(*)::int AS "Unread"
              FROM "ChatMessage" m
              LEFT JOIN "ChatRead" r ON r."UserID" = ${user.ID} AND r."ProjectID" = m."ProjectID"
              WHERE m."ProjectID" IN (${Prisma.join(ids)}) AND m."SenderID" <> ${user.ID} AND m."ID" > COALESCE(r."LastReadID", 0)
              GROUP BY m."ProjectID"`
        : [];

    // the senders' names (also of users deleted since)
    const senderIDs = [...new Set([...lastDirect, ...lastProject].map((message) => message.SenderID))];
    const senders = new Map((await prisma.user.findMany({ where: { ID: { in: senderIDs } }, select: userNameSelect })).map((sender) => [sender.ID, sender]));
    const withSender = (message: MessageRow | undefined) =>
        message
            ? {
                  ID: message.ID,
                  SenderID: message.SenderID,
                  RecipientID: message.RecipientID,
                  ProjectID: message.ProjectID,
                  Text: message.Text,
                  SentAt: message.SentAt,
                  Sender: senders.get(message.SenderID) ?? null,
              }
            : null;

    const lastByPartner = new Map(lastDirect.map((message) => [message.PartnerID, message]));
    const unreadByPartner = new Map(unreadDirect.map((row) => [row.PartnerID, row.Unread]));
    const lastByProject = new Map(lastProject.map((message) => [message.ProjectID, message]));
    const unreadByProject = new Map(unreadProject.map((row) => [row.ProjectID, row.Unread]));

    const Users = users.map((partner) => ({
        User: partner,
        LastMessage: withSender(lastByPartner.get(partner.ID)),
        Unread: unreadByPartner.get(partner.ID) ?? 0,
    }));
    const Projects = projects.map((project) => ({
        Project: project,
        LastMessage: withSender(lastByProject.get(project.ID)),
        Unread: unreadByProject.get(project.ID) ?? 0,
    }));
    // (unread messages from users deleted since can't be opened, so they don't count)
    const Unread = [...Users, ...Projects].reduce((total, conversation) => total + conversation.Unread, 0);

    return res.status(200).send({ Unread, Users, Projects });
};

// ---------------------------------------------------------------------------------------------------------------------
// One conversation

const pageQuery = z.object({
    before: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).default(PAGE_SIZE),
});

// The newest messages (older than ?before=<message ID>, for scrolling back), oldest first, and whether older ones exist
const messagePage = async (where: Prisma.ChatMessageWhereInput, query: unknown) => {
    const { before, limit } = pageQuery.parse(query ?? {});
    const messages = await prisma.chatMessage.findMany({
        where: { ...where, ...(before ? { ID: { lt: before } } : {}) },
        select: messageSelect,
        orderBy: { ID: 'desc' },
        take: limit + 1,
    });
    return { Messages: messages.slice(0, limit).reverse(), HasMore: messages.length > limit };
};

const directWhere = (userID: number, partnerID: number): Prisma.ChatMessageWhereInput => ({
    OR: [
        { SenderID: userID, RecipientID: partnerID },
        { SenderID: partnerID, RecipientID: userID },
    ],
});

// How far the partner has read the conversation (to show "Přečteno" under the user's last message)
const partnerLastRead = async (userID: number, partnerID: number) => {
    const read = await prisma.chatRead.findUnique({ where: { UserID_PartnerID: { UserID: partnerID, PartnerID: userID } }, select: { LastReadID: true } });
    return read?.LastReadID ?? 0;
};

export const getDirectMessages = async (req: Request, res: Response) => {
    const user = currentUser(res);
    const partnerID = idParam(req, 'userID');
    await requirePartner(user, partnerID);
    const page = await messagePage(directWhere(user.ID, partnerID), req.query);
    return res.status(200).send({ ...page, PartnerLastReadID: await partnerLastRead(user.ID, partnerID) });
};

export const getProjectMessages = async (req: Request, res: Response) => {
    const user = currentUser(res);
    const projectID = idParam(req, 'projectID');
    await requireProjectChatAccess(user, projectID);
    return res.status(200).send(await messagePage({ ProjectID: projectID }, req.query));
};

const messageSchema = z.object({
    Text: z.string().trim().min(1, 'Zpráva je prázdná.').max(MAX_MESSAGE_LENGTH, `Zpráva může mít nejvýše ${MAX_MESSAGE_LENGTH} znaků.`),
});

// The new message goes to everyone in the conversation (all their tabs, the sender's too) and counts as read by the sender
export const sendDirectMessage = async (req: Request, res: Response) => {
    const user = currentUser(res);
    const partnerID = idParam(req, 'userID');
    const { Text } = parseBody(messageSchema, req.body);
    await requirePartner(user, partnerID);
    const message = await prisma.chatMessage.create({ data: { SenderID: user.ID, RecipientID: partnerID, Text }, select: messageSelect });
    await markRead(user.ID, { partnerID }, message.ID);
    sendToUsers([user.ID, partnerID], CHAT_EVENT, message);
    return res.status(200).send(message);
};

export const sendProjectMessage = async (req: Request, res: Response) => {
    const user = currentUser(res);
    const projectID = idParam(req, 'projectID');
    const { Text } = parseBody(messageSchema, req.body);
    await requireProjectChatAccess(user, projectID);
    const message = await prisma.chatMessage.create({ data: { SenderID: user.ID, ProjectID: projectID, Text }, select: messageSelect });
    await markRead(user.ID, { projectID }, message.ID);
    sendToUsers([user.ID, ...(await projectAudience(projectID))], CHAT_EVENT, message);
    return res.status(200).send(message);
};

// Marks the conversation read up to LastReadID (a message the user has seen), or up to its newest message
const readSchema = z.object({ LastReadID: id.optional() });

const newestID = async (where: Prisma.ChatMessageWhereInput, upTo?: number) => {
    const message = await prisma.chatMessage.findFirst({
        where: { ...where, ...(upTo ? { ID: { lte: upTo } } : {}) },
        select: { ID: true },
        orderBy: { ID: 'desc' },
    });
    return message?.ID ?? null;
};

export const readDirectMessages = async (req: Request, res: Response) => {
    const user = currentUser(res);
    const partnerID = idParam(req, 'userID');
    const { LastReadID } = parseBody(readSchema, req.body);
    await requirePartner(user, partnerID);
    const lastID = await newestID(directWhere(user.ID, partnerID), LastReadID);
    if (lastID) {
        await markRead(user.ID, { partnerID }, lastID);
        // the partner sees that their messages were read
        sendToUsers([partnerID], CHAT_EVENT, { Read: { ReaderID: user.ID, PartnerID: partnerID, LastReadID: lastID } });
    }
    return res.status(200).send();
};

export const readProjectMessages = async (req: Request, res: Response) => {
    const user = currentUser(res);
    const projectID = idParam(req, 'projectID');
    const { LastReadID } = parseBody(readSchema, req.body);
    await requireProjectChatAccess(user, projectID);
    const lastID = await newestID({ ProjectID: projectID }, LastReadID);
    // a manager opening a chat with no messages yet still keeps it in their list
    await markRead(user.ID, { projectID }, lastID ?? 0);
    return res.status(200).send();
};
