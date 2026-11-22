import Divider from '@mui/material/Divider';
import { useSetAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { RestrictedComponent } from '../utils/RestrictedComponent';
import { CartIcon, StyledAlert, StyledButton, StyledFact, StyledFacts, StyledOpenButton } from '../ui';
import { formatAmount, formatPrice, stockState, stockTone } from './format';
import type { Material } from '../../types';

// Opens the dialog for a new request to restock an item, filled in from it
export const useRestock = () => {
    const setDialog = useSetAtom(dialogAtom);
    return (material: Pick<Material, 'ID' | 'Name' | 'Price'>) =>
        setDialog({
            type: 'AddMaterialRequirement',
            data: {
                initial: { name: material.Name, price: material.Price || '', materialID: material.ID },
                handleCancel: () => {},
            },
        });
};

// The selected stock item in Sklad: how many are in stock, reserved and available, its price, supplier and place, and
// the arrow to its page. Below its minimum (or with more reserved than in stock) a warning offers a restock request.
export const MaterialPreview = ({ material }: { material: Material }) => {
    const restock = useRestock();
    const state = stockState(material);
    return (
        <div className='content-box_content'>
            <div className='content-box_header'>
                <h1>{material.Name}</h1>
                <StyledOpenButton label='Přejít na materiál' to={`/auth/inventory/${material.ID}`} />
            </div>
            <Divider />
            {state !== 'ok' ? (
                <StyledAlert
                    severity={state === 'short' ? 'error' : 'warning'}
                    action={
                        <RestrictedComponent types={['ADMIN', 'MANAGER']}>
                            <StyledButton size='small' variant='outlined' color='inherit' startIcon={<CartIcon />} onClick={() => restock(material)}>
                                Doobjednat
                            </StyledButton>
                        </RestrictedComponent>
                    }
                >
                    {state === 'short'
                        ? `Zarezervováno je o ${formatAmount(-material.Available, material.Unit)} více, než je na skladě.`
                        : `Dostupné množství je pod minimem ${formatAmount(material.MinCount, material.Unit)}.`}
                </StyledAlert>
            ) : null}
            <StyledFacts>
                <StyledFact label='Na skladě'>{formatAmount(material.Count, material.Unit)}</StyledFact>
                <StyledFact label='Rezervováno'>{formatAmount(material.Reserved, material.Unit)}</StyledFact>
                <StyledFact label='Dostupné' tone={stockTone[state]}>
                    {formatAmount(material.Available, material.Unit)}
                </StyledFact>
                <StyledFact label='Minimální zásoba'>{material.MinCount ? formatAmount(material.MinCount, material.Unit) : null}</StyledFact>
                <StyledFact label={`Cena za ${material.Unit || 'ks'}`}>{material.Price ? formatPrice(material.Price) : null}</StyledFact>
                <StyledFact label='Hodnota zásoby'>{material.Price ? formatPrice(Math.max(0, material.Count) * material.Price) : null}</StyledFact>
                <StyledFact label='Dodavatel'>{material.Supplier}</StyledFact>
                <StyledFact label='Umístění'>{material.Location}</StyledFact>
            </StyledFacts>
            <Divider />
            <StyledFact label='Popis'>{material.Description}</StyledFact>
        </div>
    );
};
