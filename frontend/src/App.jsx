import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './state/query';
import { Login } from './components/Login';
import { Auth } from './Auth';
import { Overview } from './components/tabs/Overview';
import { Settings } from './components/tabs/Settings';
import { Stats } from './components/tabs/Stats';
import { Projects } from './components/tabs/Projects';
import { Inventory } from './components/tabs/Inventory';
import { Machines } from './components/tabs/Machines';
import { Users } from './components/tabs/Users';
import { ChatPage } from './components/chat/ChatPage';
import { Machine } from './components/machines/Machine';
import { ProjectTask } from './components/projects/ProjectTask';
import { TaskInputFiles } from './components/projects/task/TaskInputFiles';
import { TaskOverview } from './components/projects/task/TaskOverview';
import { TaskOutputFiles } from './components/projects/task/TaskOutputFiles';
import { TaskMachines } from './components/projects/task/TaskMachines';
import { TaskMaterial } from './components/projects/task/TaskMaterial';

// the task graph (sigma, WebGL) is the heaviest part of the app: load it only when a project is opened
const Project = lazy(() =>
    import('./components/projects/Project').then((module) => ({
        default: module.Project,
    })),
);

export const App = () => {
    return (
        // the loaded data is cached for the whole app (state/query.js)
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<Login />} />
                    <Route path='auth' element={<Auth />}>
                        <Route index element={<Navigate to='overview' />} />
                        <Route path='overview' element={<Overview />} />
                        <Route path='stats' element={<Stats />} />
                        <Route path='projects' element={<Projects />} />
                        <Route
                            path='projects/:project'
                            element={
                                <Suspense fallback={null}>
                                    <Project />
                                </Suspense>
                            }
                        />
                        <Route path='projects/:project/:task' element={<ProjectTask />}>
                            <Route index element={<Navigate to='overview' />} />
                            <Route path='overview' element={<TaskOverview />} />
                            <Route path='input-files' element={<TaskInputFiles />} />
                            <Route path='output-files' element={<TaskOutputFiles />} />
                            <Route path='machines' element={<TaskMachines />} />
                            <Route path='material' element={<TaskMaterial />} />
                        </Route>
                        <Route path='inventory' element={<Inventory />} />
                        <Route path='settings' element={<Settings />} />
                        <Route path='machines' element={<Machines />} />
                        <Route path='machines/:machine' element={<Machine />} />
                        <Route path='users' element={<Users />} />
                        <Route path='chat' element={<ChatPage />} />
                    </Route>
                    <Route path='*' element={<h1>Stránka nenalezena (404)</h1>}></Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
};
