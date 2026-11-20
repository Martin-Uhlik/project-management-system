import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { currentUser, requireRole, requireSession } from './auth.ts';
import { errorHandler, HttpError } from './errors.ts';
import { createLoginLimiter, defaultLoginLimits, type LoginLimiterOptions } from './rateLimit.ts';
import * as utilities from './resources/utilities.ts';
import * as users from './resources/users.ts';
import * as projects from './resources/projects.ts';
import * as tasks from './resources/tasks.ts';
import * as machines from './resources/machines.ts';
import * as material from './resources/material.ts';
import * as materialRequirements from './resources/materialRequirements.ts';
import * as personalTasks from './resources/personalTasks.ts';
import * as stats from './resources/stats.ts';
import * as chat from './resources/chat.ts';
import { live, personalTaskTopics, projectTopics, resync, topic, userTopics } from './live.ts';

// The addresses the frontend is opened from (FRONTEND_ORIGIN, comma separated). Only they may call the API from a
// browser: CORS answers them alone, and requests that change data from any other origin are refused.
export const allowedOrigins = () =>
    (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost')
        .split(',')
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean);

export type AppOptions = { loginLimits?: LoginLimiterOptions };

export const createApp = (options: AppOptions = {}) => {
    const app = express();
    const origins = allowedOrigins();
    const loginLimiter = createLoginLimiter(options.loginLimits ?? defaultLoginLimits);

    app.disable('x-powered-by');
    // behind a reverse proxy, set TRUST_PROXY (e.g. 1) so the login limit sees the client's IP
    if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

    app.use(cors({ origin: origins, credentials: true }));
    app.use((req: Request, res: Response, next: NextFunction) => {
        const origin = req.headers.origin;
        if (origin && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !origins.includes(origin)) {
            throw new HttpError(403, 'Požadavek z nepovolené adresy.');
        }
        next();
    });
    app.use(express.json({ limit: '1mb' }));
    app.use(fileUpload({ limits: { fileSize: 200 * 1024 * 1024 }, abortOnLimit: true }));

    const ADMIN = requireRole('ADMIN');
    const MANAGER = requireRole('ADMIN', 'MANAGER');

    // live(...): after a change, the browsers that show the changed data are told to load it again (see live.ts)
    const USERS = live(topic('users'));
    const USER = live(userTopics());
    const PROJECTS = live(topic('projects'));
    const PROJECT = live(projectTopics());
    const PROJECT_AND_MACHINES = live(projectTopics(), topic('machines'));
    const PERSONAL_TASKS = live(personalTaskTopics());
    const MATERIAL = live(topic('material'));
    const MACHINES = live(topic('machines'));
    // the user's own other tabs update their unread counts (new messages themselves go out from chat.ts)
    const OWN_CHAT = live((req, res) => [`chat:${currentUser(res).ID}`]);

    // sign-in; everything under /auth needs a valid session
    app.post('/login', utilities.login(loginLimiter));
    app.use('/auth', requireSession);

    // the signed-in user
    app.get('/auth/me', utilities.me);
    app.post('/auth/logout', resync(), utilities.logout);
    app.get('/auth/:userID/tasks', tasks.getUserTasks);

    app.post('/auth/users/timer/:userID', USER, users.logTime);
    app.patch('/auth/users/password/:userID', resync('userID'), utilities.setPassword);

    // user management
    app.get('/auth/users', users.getUsers);
    app.post('/auth/users', ADMIN, USERS, users.createUser);
    app.get('/auth/users/:userID', users.getUser);
    app.patch('/auth/users/:userID', USER, resync('userID'), users.updateUser);

    // worker statistics (whose: see stats.ts)
    app.get('/auth/stats/people', stats.getStatsPeople);
    app.get('/auth/stats/users/:userID', stats.getUserStats);

    // project management
    app.get('/auth/projects', projects.getProjects);
    app.post('/auth/projects', MANAGER, PROJECTS, projects.createProject);
    app.get('/auth/projects/:projectID', projects.getProject);
    app.get('/auth/projects/:projectID/stats', projects.getProjectStats);
    app.patch('/auth/projects/:projectID', MANAGER, PROJECT, projects.updateProject);
    app.delete('/auth/projects/:projectID', ADMIN, PROJECT, projects.removeProject);

    // task management
    app.get('/auth/projects/:projectID/tasks', tasks.getProjectTasks);
    app.post('/auth/projects/:projectID/tasks', MANAGER, PROJECT, tasks.createTask);
    app.get('/auth/projects/:projectID/tasks/:taskID', tasks.getTask);
    app.patch('/auth/projects/:projectID/tasks/:taskID', PROJECT_AND_MACHINES, tasks.updateTask);
    app.delete('/auth/projects/:projectID/tasks/:taskID', MANAGER, PROJECT_AND_MACHINES, USERS, tasks.removeTask);

    app.post('/auth/projects/:projectID/tasks/:taskID/predecessor', MANAGER, PROJECT, tasks.addPredecessor);
    app.post('/auth/projects/:projectID/tasks/:taskID/successor', MANAGER, PROJECT, tasks.addSuccessor);
    app.delete('/auth/projects/:projectID/tasks/:taskID/predecessor', MANAGER, PROJECT, tasks.removePredecessor);
    app.delete('/auth/projects/:projectID/tasks/:taskID/successor', MANAGER, PROJECT, tasks.removeSuccessor);

    app.get('/auth/projects/:projectID/tasks/:taskID/input-files', tasks.getInputFiles);
    app.get('/auth/projects/:projectID/tasks/:taskID/output-files', tasks.getOutputFiles);
    app.post('/auth/projects/:projectID/tasks/:taskID/input-files', PROJECT, tasks.uploadInputFile);
    app.post('/auth/projects/:projectID/tasks/:taskID/output-files', PROJECT, tasks.uploadOutputFile);
    app.get('/auth/projects/:projectID/tasks/:taskID/input-files/:fileName', tasks.downloadInputFile);
    app.get('/auth/projects/:projectID/tasks/:taskID/output-files/:fileName', tasks.downloadOutputFile);

    // personal tasks management
    app.get('/auth/:userID/personal-tasks', personalTasks.getTasks);
    app.post('/auth/:userID/personal-tasks', PERSONAL_TASKS, personalTasks.createTask);
    app.patch('/auth/:userID/personal-tasks/:taskID', PERSONAL_TASKS, personalTasks.updateTask);
    app.delete('/auth/:userID/personal-tasks', PERSONAL_TASKS, personalTasks.removeFinished);
    app.delete('/auth/:userID/personal-tasks/:taskID', PERSONAL_TASKS, personalTasks.removeTask);

    // material management
    app.get('/auth/material', material.getMaterials);
    app.post('/auth/material', MANAGER, MATERIAL, material.createMaterial);
    app.patch('/auth/material/:materialID', MANAGER, MATERIAL, material.updateMaterial);
    app.post('/auth/material/:materialID/event', MATERIAL, material.eventMaterial);

    app.get('/auth/tasks/:taskID/material', material.getTaskMaterial);

    // material request management
    app.get('/auth/materialRequirements', materialRequirements.getMaterialRequirements);
    app.post('/auth/materialRequirements', MANAGER, MATERIAL, materialRequirements.createMaterialRequirement);
    app.patch('/auth/materialRequirements/:materialRequirementID', MATERIAL, materialRequirements.updateMaterialRequirement);
    app.delete('/auth/materialRequirements/:materialRequirementID', MATERIAL, materialRequirements.removeMaterialRequirement);

    // machines management
    app.get('/auth/machines', machines.getMachines);
    app.post('/auth/machines', ADMIN, MACHINES, machines.createMachine);
    app.get('/auth/machines/:machineID', machines.getMachine);
    app.patch('/auth/machines/:machineID', MANAGER, MACHINES, machines.updateMachine);
    app.delete('/auth/machines/:machineID', ADMIN, MACHINES, machines.removeMachine);

    // chat: direct messages and project group chats (who may use which: see chat.ts)
    app.get('/auth/chat', chat.getConversations);
    app.get('/auth/chat/users/:userID/messages', chat.getDirectMessages);
    app.post('/auth/chat/users/:userID/messages', chat.sendDirectMessage);
    app.post('/auth/chat/users/:userID/read', OWN_CHAT, chat.readDirectMessages);
    app.get('/auth/chat/projects/:projectID/messages', chat.getProjectMessages);
    app.post('/auth/chat/projects/:projectID/messages', chat.sendProjectMessage);
    app.post('/auth/chat/projects/:projectID/read', OWN_CHAT, chat.readProjectMessages);

    app.all('/{*splat}', (req: Request, res: Response) => {
        res.status(404).send({ errorMessage: 'Chybná adresa zdroje.' });
    });
    app.use(errorHandler);

    return app;
};
