import {Request, Response} from "express";

const express = require('express');
const cors = require('cors');
const utilities = require("./resources/utilities");
const users = require("./resources/users");
const projects = require("./resources/projects");
const tasks = require("./resources/tasks");
const machines = require("./resources/machines");
const material = require("./resources/material");
const materialRequirements = require("./resources/materialRequirements");
const personalTasks = require("./resources/personalTasks");
const dotenv = require('dotenv');
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');


dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(fileUpload());
const PORT = process.env.BACKEND_PORT;


// user utilities
app.post("/login", utilities.login);
app.post("/auth/logout", utilities.logout);
app.get("/auth/:userID/tasks", tasks.getUserTasks);

app.post("/auth/users/timer/:userID", users.logTime);
app.patch("/auth/users/password/:userID", utilities.setPassword);

// user management
app.get("/auth/users", users.getUsers);
app.post("/auth/users", users.createUser);
app.get("/auth/users/:userID", users.getUser);
app.patch("/auth/users/:userID", users.updateUser);

// project management
app.get("/auth/projects", projects.getProjects);
app.post("/auth/projects", projects.createProject);
app.get("/auth/projects/:projectID", projects.getProject);
app.patch("/auth/projects/:projectID", projects.updateProject);
app.delete("/auth/projects/:projectID", projects.removeProject);

// task management
app.get("/auth/projects/:projectID/tasks", tasks.getProjectTasks);
app.post("/auth/projects/:projectID/tasks", tasks.createTask);
app.get("/auth/projects/:projectID/tasks/:taskID", tasks.getTask);
app.patch("/auth/projects/:projectID/tasks/:taskID", tasks.updateTask);
app.delete("/auth/projects/:projectID/tasks/:taskID", tasks.removeTask);

app.post("/auth/projects/:projectID/tasks/:taskID/predecessor", tasks.addPredecessor);
app.post("/auth/projects/:projectID/tasks/:taskID/successor", tasks.addSuccessor);
app.delete("/auth/projects/:projectID/tasks/:taskID/predecessor", tasks.removePredecessor);
app.delete("/auth/projects/:projectID/tasks/:taskID/successor", tasks.removeSuccessor);

app.get("/auth/projects/:projectID/tasks/:taskID/input-files", tasks.getInputFiles);
app.get("/auth/projects/:projectID/tasks/:taskID/output-files", tasks.getOutputFiles);
app.post("/auth/projects/:projectID/tasks/:taskID/input-files", tasks.uploadInputFile);
app.post("/auth/projects/:projectID/tasks/:taskID/output-files", tasks.uploadOutputFile);

// personal tasks management
app.get("/auth/:userID/personal-tasks", personalTasks.getTasks);
app.post("/auth/:userID/personal-tasks", personalTasks.createTask);
app.patch("/auth/:userID/personal-tasks/:taskID", personalTasks.updateTask);
app.delete("/auth/:userID/personal-tasks", personalTasks.removeFinished);

// material management
app.get("/auth/material", material.getMaterials);
app.post("/auth/material", material.createMaterial);
app.patch("/auth/material/:materialID", material.updateMaterial);
app.post("/auth/material/:materialID/event", material.eventMaterial);

app.get("/auth/tasks/:taskID/material", material.getTaskMaterial);

// material request management
app.get("/auth/materialRequirements", materialRequirements.getMaterialRequirements);
app.post("/auth/materialRequirements", materialRequirements.createMaterialRequirement);
app.patch("/auth/materialRequirements/:materialRequirementID", materialRequirements.updateMaterialRequirement);
app.delete("/auth/materialRequirements/:materialRequirementID", materialRequirements.removeMaterialRequirement);

// machines management
app.get("/auth/machines", machines.getMachines);
app.post("/auth/machines", machines.createMachine);
app.get("/auth/machines/:machineID", machines.getMachine);
app.patch("/auth/machines/:machineID", machines.updateMachine);
app.delete("/auth/machines/:machineID", machines.removeMachine);


const undefinedRequest = (req: Request, res: Response) => {
    res.status(404);
    res.send({errorMessage: "Chybná adresa zdroje."});
}
app.get('*', undefinedRequest);
app.post('*', undefinedRequest);
app.put('*', undefinedRequest);
app.patch('*', undefinedRequest);
app.delete('*', undefinedRequest);

app.listen(PORT, (error: any) => {
    if (!error)
        console.log("Server is Successfully Running, and App is listening on port " + PORT);
    else
        console.log("Error occurred, server can't start", error);
});
