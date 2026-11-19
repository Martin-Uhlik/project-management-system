import { Link, useNavigate } from 'react-router';
import moment from 'moment';

export const AssignedTask = (props) => {
    const navigate = useNavigate();
    const owner = props.task.Owner;
    const taskAddress = `/auth/projects/${props.task.ProjectID.toString()}/${props.task.ID.toString()}`;
    return (
        <tr className='task p-3' onClick={() => navigate(taskAddress)}>
            <td>
                {/* the whole row opens the task with a mouse; the link makes it reachable by keyboard too */}
                <Link className='task_link' to={taskAddress} onClick={(event) => event.stopPropagation()}>
                    {props.task.Name}
                </Link>
            </td>
            <td>{props.task.Project.Name}</td>
            <td>{`${owner.FirstName} ${owner.LastName}`}</td>
            <td>{moment(props.task.FinishDate).format('L')}</td>
        </tr>
    );
};
