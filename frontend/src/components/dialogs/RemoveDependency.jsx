import { useModalDialog } from '../utils/useModalDialog';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';

export const RemoveDependency = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit(event.target.dependency.value, dialog.data.dependencyType);
        setDialog(null);
    };

    const dialogRef = useModalDialog(handleCancel);
    return (
        <div className='dialog-background' onSubmit={handleSubmit}>
            <div className='dialog' role='dialog' aria-modal='true' aria-labelledby='dialog-title' ref={dialogRef}>
                <h1 id='dialog-title' className='dialog-h1'>
                    Odebrat závislost
                </h1>
                <hr className='hline' />
                <form className='d-flex flex-column gap-5'>
                    <div className='d-flex flex-row align-items-center gap-3'>
                        <h2>Název:</h2>
                        <div className='form-group'>
                            <label htmlFor='dependency'>Úkol:</label>
                            <select className='form-select' id='dependency' name='dependency'>
                                {dialog.data.nodes.map((node) => {
                                    return (
                                        <option key={node.ID} value={node.ID}>
                                            {node.Name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                    <div className='d-flex gap-3 justify-content-end'>
                        <button className='btn btn-danger' type='button' onClick={handleCancel}>
                            Zrušit
                        </button>
                        <button className='btn btn-success' type='submit'>
                            Ok
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
