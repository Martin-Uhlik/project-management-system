import './env.ts';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import * as utilities from './resources/utilities.ts';
import * as users from './resources/users.ts';
import * as projects from './resources/projects.ts';
import * as tasks from './resources/tasks.ts';
import * as machines from './resources/machines.ts';
import * as material from './resources/material.ts';
import * as materialRequirements from './resources/materialRequirements.ts';
import * as personalTasks from './resources/personalTasks.ts';

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(fileUpload());
const PORT = process.env.BACKEND_PORT;

// user utilities
app.post('/login', utilities.login);
app.post('/auth/logout', utilities.logout);
app.get('/auth/:userID/tasks', tasks.getUserTasks);

app.post('/auth/users/timer/:userID', users.logTime);
app.patch('/auth/users/password/:userID', utilities.setPassword);

// user management
app.get('/auth/users', users.getUsers);
app.post('/auth/users', users.createUser);
app.get('/auth/users/:userID', users.getUser);
app.patch('/auth/users/:userID', users.updateUser);

// project management
app.get('/auth/projects', projects.getProjects);
app.post('/auth/projects', projects.createProject);
app.get('/auth/projects/:projectID', projects.getProject);
app.patch('/auth/projects/:projectID', projects.updateProject);
app.delete('/auth/projects/:projectID', projects.removeProject);

// task management
app.get('/auth/projects/:projectID/tasks', tasks.getProjectTasks);
app.post('/auth/projects/:projectID/tasks', tasks.createTask);
app.get('/auth/projects/:projectID/tasks/:taskID', tasks.getTask);
app.patch('/auth/projects/:projectID/tasks/:taskID', tasks.updateTask);
app.delete('/auth/projects/:projectID/tasks/:taskID', tasks.removeTask);

app.post('/auth/projects/:projectID/tasks/:taskID/predecessor', tasks.addPredecessor);
app.post('/auth/projects/:projectID/tasks/:taskID/successor', tasks.addSuccessor);
app.delete('/auth/projects/:projectID/tasks/:taskID/predecessor', tasks.removePredecessor);
app.delete('/auth/projects/:projectID/tasks/:taskID/successor', tasks.removeSuccessor);

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
app.post('/auth/material', material.createMaterial);
app.patch('/auth/material/:materialID', material.updateMaterial);
app.post('/auth/material/:materialID/event', material.eventMaterial);

app.get('/auth/tasks/:taskID/material', material.getTaskMaterial);

// material request management
app.get('/auth/materialRequirements', materialRequirements.getMaterialRequirements);
app.post('/auth/materialRequirements', materialRequirements.createMaterialRequirement);
app.patch('/auth/materialRequirements/:materialRequirementID', materialRequirements.updateMaterialRequirement);
app.delete('/auth/materialRequirements/:materialRequirementID', materialRequirements.removeMaterialRequirement);

// machines management
app.get('/auth/machines', machines.getMachines);
app.post('/auth/machines', machines.createMachine);
app.get('/auth/machines/:machineID', machines.getMachine);
app.patch('/auth/machines/:machineID', machines.updateMachine);
app.delete('/auth/machines/:machineID', machines.removeMachine);

const undefinedRequest = (req: Request, res: Response) => {
    res.status(404);
    res.send({ errorMessage: 'Chybná adresa zdroje.' });
};
app.all('/{*splat}', undefinedRequest);

app.listen(PORT, (error?: Error) => {
    if (!error) console.log('Server is Successfully Running, and App is listening on port ' + PORT);
    else console.log("Error occurred, server can't start", error);
});
