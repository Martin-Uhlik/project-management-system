import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { requireRole, requireSession } from './auth.ts';
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

    // sign-in; everything under /auth needs a valid session
    app.post('/login', utilities.login(loginLimiter));
    app.use('/auth', requireSession);

    // the signed-in user
    app.get('/auth/me', utilities.me);
    app.post('/auth/logout', utilities.logout);
    app.get('/auth/:userID/tasks', tasks.getUserTasks);

    app.post('/auth/users/timer/:userID', users.logTime);
    app.patch('/auth/users/password/:userID', utilities.setPassword);

    // user management
    app.get('/auth/users', users.getUsers);
    app.post('/auth/users', ADMIN, users.createUser);
    app.get('/auth/users/:userID', users.getUser);
    app.patch('/auth/users/:userID', users.updateUser);

    // project management
    app.get('/auth/projects', projects.getProjects);
    app.post('/auth/projects', MANAGER, projects.createProject);
    app.get('/auth/projects/:projectID', projects.getProject);
    app.patch('/auth/projects/:projectID', MANAGER, projects.updateProject);
    app.delete('/auth/projects/:projectID', ADMIN, projects.removeProject);

    // task management
    app.get('/auth/projects/:projectID/tasks', tasks.getProjectTasks);
    app.post('/auth/projects/:projectID/tasks', MANAGER, tasks.createTask);
    app.get('/auth/projects/:projectID/tasks/:taskID', tasks.getTask);
    app.patch('/auth/projects/:projectID/tasks/:taskID', tasks.updateTask);
    app.delete('/auth/projects/:projectID/tasks/:taskID', MANAGER, tasks.removeTask);

    app.post('/auth/projects/:projectID/tasks/:taskID/predecessor', MANAGER, tasks.addPredecessor);
    app.post('/auth/projects/:projectID/tasks/:taskID/successor', MANAGER, tasks.addSuccessor);
    app.delete('/auth/projects/:projectID/tasks/:taskID/predecessor', MANAGER, tasks.removePredecessor);
    app.delete('/auth/projects/:projectID/tasks/:taskID/successor', MANAGER, tasks.removeSuccessor);

    app.get('/auth/projects/:projectID/tasks/:taskID/input-files', tasks.getInputFiles);
    app.get('/auth/projects/:projectID/tasks/:taskID/output-files', tasks.getOutputFiles);
    app.post('/auth/projects/:projectID/tasks/:taskID/input-files', tasks.uploadInputFile);
    app.post('/auth/projects/:projectID/tasks/:taskID/output-files', tasks.uploadOutputFile);

    // personal tasks management
    app.get('/auth/:userID/personal-tasks', personalTasks.getTasks);
    app.post('/auth/:userID/personal-tasks', personalTasks.createTask);
    app.patch('/auth/:userID/personal-tasks/:taskID', personalTasks.updateTask);
    app.delete('/auth/:userID/personal-tasks', personalTasks.removeFinished);

    // material management
    app.get('/auth/material', material.getMaterials);
    app.post('/auth/material', MANAGER, material.createMaterial);
    app.patch('/auth/material/:materialID', MANAGER, material.updateMaterial);
    app.post('/auth/material/:materialID/event', material.eventMaterial);

    app.get('/auth/tasks/:taskID/material', material.getTaskMaterial);

    // material request management
    app.get('/auth/materialRequirements', materialRequirements.getMaterialRequirements);
    app.post('/auth/materialRequirements', MANAGER, materialRequirements.createMaterialRequirement);
    app.patch('/auth/materialRequirements/:materialRequirementID', materialRequirements.updateMaterialRequirement);
    app.delete('/auth/materialRequirements/:materialRequirementID', materialRequirements.removeMaterialRequirement);

    // machines management
    app.get('/auth/machines', machines.getMachines);
    app.post('/auth/machines', ADMIN, machines.createMachine);
    app.get('/auth/machines/:machineID', machines.getMachine);
    app.patch('/auth/machines/:machineID', MANAGER, machines.updateMachine);
    app.delete('/auth/machines/:machineID', ADMIN, machines.removeMachine);

    app.all('/{*splat}', (req: Request, res: Response) => {
        res.status(404).send({ errorMessage: 'Chybná adresa zdroje.' });
    });
    app.use(errorHandler);

    return app;
};
