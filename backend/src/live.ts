import type { Server as HttpServer } from 'node:http';
import type { NextFunction, Request, Response } from 'express';
import { Server, type Socket } from 'socket.io';
import prisma from './client.ts';
import { currentUser, findSessionUser, getTokenFromHeaders, type SessionUser } from './auth.ts';

// ---------------------------------------------------------------------------------------------------------------------
// Live updates. The data still goes over REST: after a change, the server only tells the browsers that may see the
// changed data which part changed (a "topic"), and the screens that show it load it again.
//
// Topics, and who is told about them:
//   projects              everyone        the project list and project headers (and their status: who works on them)
//   project:<id>          admins, managers, the project's owner and members and the users assigned to its tasks:
//                                         its tasks, task graph, files, statistics
//   users                 everyone        the user list and anyone's public details (their running timer, too)
//   user:<id>             the user, their managers (all levels up) and admins, as for the statistics: their work time,
//                                         assigned tasks and statistics
//   personal-tasks:<id>   the user        their personal tasks
//   material              everyone        material, its movements and the material requests
//   machines              everyone        machines
//
// The browser connects with its session cookie (or "Authorization: Bearer <token>", like the API) and gets the
// message "changed" with a list of topics.

export const LIVE_PATH = '/live';
export const LIVE_EVENT = 'changed';
// a request's X-Socket-ID (the browser's own connection) is not told about its own change: that screen already reloads
export const SOCKET_ID_HEADER = 'x-socket-id';

let io: Server | null = null;

const ALL = 'all';
const userRoom = (userID: number) => `user:${userID}`;
const roleRoom = (role: SessionUser['UserType']) => `role:${role}`;

type SocketData = { user: SessionUser; token: string; expiryTimer?: NodeJS.Timeout };
type LiveSocket = Socket<object, object, object, SocketData>;

// a session can't outlive 20 hours (SESSION_LIFETIME_MS), well inside what setTimeout takes
const disconnectWhenExpired = (socket: LiveSocket, expires: Date) => {
    clearTimeout(socket.data.expiryTimer);
    socket.data.expiryTimer = setTimeout(() => socket.disconnect(true), Math.max(0, expires.getTime() - Date.now()));
};

// Starts the live updates on the API's HTTP server; origins: the addresses the frontend may be opened from
export const attachLive = (server: HttpServer, origins: string[]) => {
    io = new Server(server, {
        path: LIVE_PATH,
        serveClient: false,
        cors: { origin: origins, credentials: true },
        // a page of another site must not connect with the user's cookie (CORS doesn't cover WebSocket)
        allowRequest: (req, callback) => {
            const origin = req.headers.origin;
            callback(null, !origin || origins.includes(origin));
        },
    });

    io.use(async (socket: LiveSocket, next) => {
        try {
            const token = getTokenFromHeaders(socket.handshake.headers);
            const session = await findSessionUser(token);
            if (!session) return next(new Error('unauthorized'));
            socket.data.user = session.user;
            socket.data.token = token;
            disconnectWhenExpired(socket, session.expires);
            next();
        } catch (error) {
            next(error instanceof Error ? error : new Error('unauthorized'));
        }
    });

    io.on('connection', (socket: LiveSocket) => {
        const { user } = socket.data;
        void socket.join([ALL, userRoom(user.ID), roleRoom(user.UserType)]);
        socket.on('disconnect', () => clearTimeout(socket.data.expiryTimer));
    });
    return io;
};

export const closeLive = async () => {
    const server = io;
    io = null;
    if (server) await server.close();
};

// The users above this one (their manager, the manager's manager, ...), who see their statistics
const managersOf = async (userID: number) => {
    const users = await prisma.user.findMany({ where: { Deleted: false }, select: { ID: true, ManagerID: true } });
    const managerOf = new Map(users.map((user) => [user.ID, user.ManagerID]));
    const managers: number[] = [];
    let current = managerOf.get(userID);
    while (current != null && current !== userID && !managers.includes(current)) {
        managers.push(current);
        current = managerOf.get(current);
    }
    return managers;
};

const projectPeople = async (projectID: number) => {
    const project = await prisma.project.findUnique({
        where: { ID: projectID },
        select: {
            OwnerID: true,
            Member: { select: { UserID: true } },
            Task: { select: { User_Task: { select: { UserID: true } } } },
        },
    });
    if (!project) return [];
    return [
        project.OwnerID,
        ...project.Member.map((member) => member.UserID),
        ...project.Task.flatMap((task) => task.User_Task.map((assignment) => assignment.UserID)),
    ];
};

// The rooms told about a topic
const audience = async (topic: string): Promise<string[]> => {
    const [kind, idText] = topic.split(':');
    if (idText === undefined) return [ALL];
    const id = Number(idText);
    if (!Number.isInteger(id)) return [];
    switch (kind) {
        case 'project':
            return [roleRoom('ADMIN'), roleRoom('MANAGER'), ...new Set((await projectPeople(id)).map(userRoom))];
        case 'user':
            return [userRoom(id), roleRoom('ADMIN'), ...(await managersOf(id)).map(userRoom)];
        case 'personal-tasks':
            return [userRoom(id)];
        default:
            return [];
    }
};

// Tells the browsers allowed to see them that these topics changed (except the connection exceptSocketID)
export const publish = async (topics: Iterable<string>, exceptSocketID?: string) => {
    const server = io;
    if (!server) return;
    for (const topic of new Set(topics)) {
        const rooms = await audience(topic);
        if (!rooms.length) continue;
        const target = exceptSocketID ? server.to(rooms).except(exceptSocketID) : server.to(rooms);
        target.emit(LIVE_EVENT, [topic]);
    }
};

// Checks this user's connections again after their sessions or role changed: a connection whose session ended is
// closed (the browser then signs in again), one whose role changed moves to the rooms of the new role
export const resyncUser = async (userID: number) => {
    const server = io;
    if (!server) return;
    const sockets = (await server.in(userRoom(userID)).fetchSockets()) as unknown as LiveSocket[];
    for (const socket of sockets) {
        const session = await findSessionUser(socket.data.token);
        if (!session) {
            socket.disconnect(true);
            continue;
        }
        if (session.user.UserType !== socket.data.user.UserType) {
            void socket.leave(roleRoom(socket.data.user.UserType));
            void socket.join(roleRoom(session.user.UserType));
        }
        socket.data.user = session.user;
        disconnectWhenExpired(socket, session.expires);
    }
};

// ---------------------------------------------------------------------------------------------------------------------
// Route middleware: which topics a request changes. The collectors run before the handler and again after it succeeded,
// so data the change takes away (a task's former assignees, the task a stopped timer ran on) is counted too.

type Collect = (req: Request, res: Response) => Promise<Iterable<string>> | Iterable<string>;

const paramID = (req: Request, name: string) => {
    const id = Number(req.params[name]);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const collectAll = async (collectors: Collect[], req: Request, res: Response) => {
    const topics: string[] = [];
    for (const collect of collectors) {
        try {
            topics.push(...(await collect(req, res)));
        } catch {
            // e.g. the project doesn't exist: the handler answers with an error, and nothing is published
        }
    }
    return topics;
};

// The browser connection that made the request, when it belongs to the signed-in user
const requestSocketID = (req: Request, res: Response) => {
    const id = req.headers[SOCKET_ID_HEADER];
    if (typeof id !== 'string' || !io) return undefined;
    const socket = io.sockets.sockets.get(id) as LiveSocket | undefined;
    const user = res.locals.user as SessionUser | undefined;
    return socket && user && socket.data.user?.ID === user.ID ? id : undefined;
};

const afterSuccess = (res: Response, run: () => Promise<void>) => {
    res.on('finish', () => {
        if (res.statusCode >= 400) return;
        run().catch((error) => console.error('Live update failed:', error));
    });
};

export const live =
    (...collectors: Collect[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
        if (!io) return next();
        const before = await collectAll(collectors, req, res);
        afterSuccess(res, async () => publish([...before, ...(await collectAll(collectors, req, res))], requestSocketID(req, res)));
        next();
    };

// After the request succeeded, checks the user's connections again (see resyncUser); param: the route's user ID,
// or the signed-in user when left out
export const resync = (param?: string) => (req: Request, res: Response, next: NextFunction) => {
    if (!io) return next();
    const userID = param ? paramID(req, param) : currentUser(res).ID;
    if (userID) afterSuccess(res, () => resyncUser(userID));
    next();
};

// Collectors

export const topic =
    (...names: string[]): Collect =>
    () =>
        names;

// The project in the route (projectID): the project list, the project, and the task lists of everyone assigned to
// one of its tasks
export const projectTopics =
    (param = 'projectID'): Collect =>
    async (req) => {
        const projectID = paramID(req, param);
        return projectID ? topicsOfProject(projectID) : [];
    };

const topicsOfProject = async (projectID: number) => {
    const assignments = await prisma.user_Task.findMany({ where: { Task: { ProjectID: projectID } }, select: { UserID: true } });
    return ['projects', `project:${projectID}`, ...assignments.map((assignment) => `user:${assignment.UserID}`)];
};

// The user in the route (userID): the user list, their own data, and the project of the task their timer runs on
// (its status and logged time)
export const userTopics =
    (param = 'userID'): Collect =>
    async (req) => {
        const userID = paramID(req, param);
        if (!userID) return [];
        const user = await prisma.user.findUnique({ where: { ID: userID }, select: { CurrentTask: { select: { ProjectID: true } } } });
        const projectID = user?.CurrentTask?.ProjectID;
        return ['users', `user:${userID}`, ...(projectID ? ['projects', `project:${projectID}`] : [])];
    };

export const personalTaskTopics =
    (param = 'userID'): Collect =>
    (req) => {
        const userID = paramID(req, param);
        return userID ? [`personal-tasks:${userID}`] : [];
    };
