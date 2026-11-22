import { WorkPlanChart } from '../utils/WorkPlanChart';
import { AssignedTasks } from '../tabs/overview/AssignedTasks';

// A machine's "Úkoly" tab: the tasks queued on it and their production plan
export const MachineTasks = ({ machine }) => (
    <div className='content-2-column'>
        <div className='content-box'>
            <div className='content-box_content'>
                <div className='content-box_header'>
                    <h1>Fronta výroby</h1>
                </div>
                <AssignedTasks showHeader={false} machineTasks={machine.Task} />
            </div>
        </div>
        <div className='content-box'>
            <div className='content-box_content'>
                <h1>Harmonogram výroby</h1>
                <div className='content-box_chart-wrapper-outer'>
                    <div className='content-box_chart-wrapper-inner'>
                        <WorkPlanChart tasks={machine.Task} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);
