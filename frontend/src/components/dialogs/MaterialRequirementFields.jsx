import { StyledDateTimePicker, StyledInput } from '../ui';

// The fields of a material request, shared by the add and edit dialogs. values/setters: { name, count, price, description, date }
export const MaterialRequirementFields = ({ values, setters }) => {
    return (
        <>
            <StyledInput id='name' label='Název' value={values.name} onChange={(event) => setters.name(event.target.value)} />
            <StyledInput id='amount' label='Počet kusů' type='number' value={values.count} onChange={(event) => setters.count(event.target.value)} />
            <StyledInput id='price' label='Cena za kus (s DPH)' type='number' value={values.price} onChange={(event) => setters.price(event.target.value)} />
            <StyledInput
                id='description'
                label='Popis'
                multiline
                rows={3}
                value={values.description}
                onChange={(event) => setters.description(event.target.value)}
            />
            <StyledDateTimePicker label='Datum, kdy je materiál potřeba' value={values.date} onChange={setters.date} />
        </>
    );
};
