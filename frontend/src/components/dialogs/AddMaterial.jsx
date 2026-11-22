import React from 'react';
import { useAtom } from 'jotai';
import Box from '@mui/material/Box';
import { dialogAtom } from '../../state/atoms';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledInput } from '../ui';
import { useSend } from '../inventory/useSend';

// The fields of a stock item, shared by this dialog and the item's settings. values/setters: { name, unit, price,
// minCount, supplier, location, description }
export const MaterialFields = ({ values, setters, disabled }) => {
    const field = (key) => ({ value: values[key], onChange: (event) => setters[key](event.target.value), disabled });
    return (
        <>
            <StyledInput id='name' label='Název' {...field('name')} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
                <StyledInput id='unit' label='Jednotka (ks, m, kg…)' {...field('unit')} />
                <StyledInput id='price' label='Cena za jednotku (Kč)' type='number' {...field('price')} />
                <StyledInput id='minCount' label='Minimální zásoba' type='number' {...field('minCount')} />
            </Box>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <StyledInput id='supplier' label='Dodavatel' {...field('supplier')} />
                <StyledInput id='location' label='Umístění ve skladu' {...field('location')} />
            </Box>
            <StyledInput id='description' label='Popis' multiline minRows={3} {...field('description')} />
        </>
    );
};

// the fields as the backend takes them
export const materialBody = (values) => ({
    Name: values.name.trim(),
    Unit: values.unit.trim() || 'ks',
    Price: Math.max(0, Math.round(Number(values.price) || 0)),
    MinCount: Math.max(0, Math.round(Number(values.minCount) || 0)),
    Supplier: values.supplier.trim() || null,
    Location: values.location.trim() || null,
    Description: values.description.trim() || null,
});

// A new stock item (admins, managers), with how many are put in stock right away
export const AddMaterial = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const send = useSend();
    const [values, setValues] = React.useState({ name: '', unit: 'ks', price: '', minCount: '', supplier: '', location: '', description: '' });
    const setters = Object.fromEntries(Object.keys(values).map((key) => [key, (value) => setValues((old) => ({ ...old, [key]: value }))]));
    const [amount, setAmount] = React.useState('');

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel?.();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        send('post', '/auth/material', { ...materialBody(values), Count: Math.max(0, Math.round(Number(amount) || 0)) }, 'Materiál přidán.');
        setDialog(null);
    };

    return (
        <StyledDialog title='Přidat materiál' onClose={handleCancel}>
            <FormStack component='form' onSubmit={handleSubmit}>
                <MaterialFields values={values} setters={setters} />
                <StyledInput id='amount' label='Naskladnit hned (počet)' type='number' value={amount} onChange={(event) => setAmount(event.target.value)} />
                <ButtonRow>
                    <StyledButton color='error' onClick={handleCancel}>
                        Zrušit
                    </StyledButton>
                    <StyledButton color='success' type='submit' disabled={!values.name.trim()}>
                        Přidat
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
