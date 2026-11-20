import { Link, useNavigate } from 'react-router';
import dayjs from '../../dayjs';

export const AssignedTask = (props) => {
    const navigate = useNavigate();
    const owner = props.task.Owner;
    const taskAddress = `/auth/projects/${props.task.ProjectID.toString()}/${props.task.ID.toString()}`;
    return (
        <tr className='task' onClick={() => navigate(taskAddress)}>
            <td>
                {/* the whole row opens the task with a mouse; the link makes it reachable by keyboard too */}
                <Link className='task_link' to={taskAddress} onClick={(event) => event.stopPropagation()}>
                    {props.task.Name}
                </Link>
            </td>
            <td>{props.task.Project.Name}</td>
            <td>{`${owner.FirstName} ${owner.LastName}`}</td>
            <td>{dayjs(props.task.FinishDate).format('L')}</td>
        </tr>
    );
};
