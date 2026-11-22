// Formatting and states shared by the Sklad pages
import type { ChipProps } from '@mui/material/Chip';
import type { EventType, MaterialRequest, PublicUser, Stock, TaskSummary } from '../../types';

export const formatNumber = (value: number | null | undefined) => (value ?? 0).toLocaleString('cs-CZ');
export const formatPrice = (value: number | null | undefined) => `${formatNumber(value)} Kč`;
export const formatAmount = (count: number | null | undefined, unit?: string | null) => `${formatNumber(count)} ${unit || 'ks'}`;
export const fullName = (user: Pick<PublicUser, 'FirstName' | 'LastName'> | null | undefined) => (user ? `${user.FirstName} ${user.LastName}` : null);

// how an item stands: 'short' (more reserved than in stock), 'low' (fewer available than its minimum) or 'ok'; the
// colour shows it in lists and on its page
export type StockState = 'short' | 'low' | 'ok';
export const stockState = (material: Stock & { MinCount: number }): StockState =>
    material.Available < 0 ? 'short' : material.MinCount > 0 && material.Available < material.MinCount ? 'low' : 'ok';
export const stockTone: Record<StockState, 'error' | 'warning' | undefined> = { short: 'error', low: 'warning', ok: undefined };
export const stockStateLabels: Record<StockState, string> = { short: 'Chybí', low: 'Dochází', ok: 'Dostatek' };

// the kinds of stock movement
export const eventLabels: Record<EventType, string> = { ADD: 'Naskladnění', REMOVE: 'Výdej', RESERVATION: 'Rezervace', RELEASE: 'Zrušení rezervace' };
export const eventColors: Record<EventType, ChipProps['color']> = { ADD: 'success', REMOVE: 'error', RESERVATION: 'info', RELEASE: 'default' };
// how a movement changes the stock (+ in, − out) or the reservation
export const eventSign: Record<EventType, string> = { ADD: '+', REMOVE: '−', RESERVATION: '+', RELEASE: '−' };

// a task as "Project / task"
export const taskLabel = (task: Pick<TaskSummary, 'Name' | 'Project'> | null | undefined) =>
    task ? [task.Project?.Name, task.Name].filter(Boolean).join(' / ') : null;
export const taskLink = (task: Pick<TaskSummary, 'ID' | 'ProjectID'>) => `/auth/projects/${task.ProjectID}/${task.ID}`;

// a request: waiting for approval, or approved and waiting to be stocked
export type RequestState = 'waiting' | 'approved';
export const requestState = (request: Pick<MaterialRequest, 'AcceptedByID'>): RequestState => (request.AcceptedByID ? 'approved' : 'waiting');
export const requestStateLabels: Record<RequestState, string> = { waiting: 'Čeká na schválení', approved: 'Schváleno' };
export const requestStateColors: Record<RequestState, ChipProps['color']> = { waiting: 'warning', approved: 'success' };
