import { useState } from 'react';
import { useCamera } from '@react-sigma/core';
import { GraphSearch } from '@react-sigma/graph-search';
import '@react-sigma/graph-search/lib/style.css';

// Search box over the task graph: picking a task moves the camera to it and selects it
export const TaskSearch = ({ selectNode }) => {
    const { gotoNode } = useCamera();
    const [value, setValue] = useState(null);

    const handleChange = (option) => {
        setValue(option);
        if (option && option.type === 'nodes') {
            gotoNode(option.id);
            selectNode(option.id);
        }
    };

    return (
        <GraphSearch
            type='nodes'
            value={value}
            onChange={handleChange}
            labels={{
                placeholder: 'Hledat úkol…',
                no_result_found: 'Nic nenalezeno',
                type_something_to_search: 'Začněte psát pro vyhledání',
                no_label: 'Bez názvu',
            }}
        />
    );
};
