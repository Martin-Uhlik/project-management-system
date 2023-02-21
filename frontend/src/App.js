import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {Login} from "./components/Login";
import {Auth} from "./Auth";
import {Overview} from "./components/tabs/Overview";
import {Settings} from "./components/tabs/Settings";
import {Stats} from "./components/tabs/Stats";
import {Projects} from "./components/tabs/Projects";
import {Inventory} from "./components/tabs/Inventory";
import {Machines} from "./components/tabs/Machines";
import {Users} from "./components/tabs/Users";
import {Machine} from "./components/machines/Machine";
import {Project} from "./components/projects/Project";
import {ProjectTask} from "./components/projects/ProjectTask";
import {TaskInputFiles} from "./components/projects/task/TaskInputFiles";
import {TaskOverview} from "./components/projects/task/TaskOverview";
import {TaskOutputFiles} from "./components/projects/task/TaskOutputFiles";
import {TaskMachines} from "./components/projects/task/TaskMachines";
import {TaskMaterial} from "./components/projects/task/TaskMaterial";

export const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login/>}/>
                <Route path="auth" element={<Auth/>}>
                    <Route index element={<Navigate to="overview"/>}/>
                    <Route path="overview" element={<Overview/>}/>
                    <Route path="stats" element={<Stats/>}/>
                    <Route path="projects" element={<Projects/>}/>
                    <Route path="projects/:project" element={<Project/>}/>
                    <Route path="projects/:project/:task" element={<ProjectTask/>}>
                        <Route index element={<Navigate to="overview"/>}/>
                        <Route path="overview" element={<TaskOverview/>}/>
                        <Route path="input-files" element={<TaskInputFiles/>}/>
                        <Route path="output-files" element={<TaskOutputFiles/>}/>
                        <Route path="machines" element={<TaskMachines/>}/>
                        <Route path="material" element={<TaskMaterial/>}/>
                    </Route>
                    <Route path="inventory" element={<Inventory/>}/>
                    <Route path="settings" element={<Settings/>}/>
                    <Route path="machines" element={<Machines/>}>
                        <Route path=":machine" element={<Machine/>}/>
                    </Route>
                    <Route path="users" element={<Users/>}/>
                </Route>
                <Route path="*" element={<h1>Wrong route: 404!</h1>}></Route>
            </Routes>
        </BrowserRouter>
    );
};