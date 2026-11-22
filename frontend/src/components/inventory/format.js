// Formatting and states shared by the Sklad pages
export const formatNumber = (value) => (value ?? 0).toLocaleString('cs-CZ');
export const formatPrice = (value) => `${formatNumber(value)} Kč`;
export const formatAmount = (count, unit) => `${formatNumber(count)} ${unit || 'ks'}`;
export const fullName = (user) => (user ? `${user.FirstName} ${user.LastName}` : null);

// how an item stands: 'short' (more reserved than in stock), 'low' (fewer available than its minimum) or 'ok'; the
// colour shows it in lists and on its page
export const stockState = (material) => (material.Available < 0 ? 'short' : material.MinCount > 0 && material.Available < material.MinCount ? 'low' : 'ok');
export const stockTone = { short: 'error', low: 'warning', ok: undefined };
export const stockStateLabels = { short: 'Chybí', low: 'Dochází', ok: 'Dostatek' };

// the kinds of stock movement
export const eventLabels = { ADD: 'Naskladnění', REMOVE: 'Výdej', RESERVATION: 'Rezervace', RELEASE: 'Zrušení rezervace' };
export const eventColors = { ADD: 'success', REMOVE: 'error', RESERVATION: 'info', RELEASE: 'default' };
// how a movement changes the stock (+ in, − out) or the reservation
export const eventSign = { ADD: '+', REMOVE: '−', RESERVATION: '+', RELEASE: '−' };

// a task as "Project / task"
export const taskLabel = (task) => (task ? [task.Project?.Name, task.Name].filter(Boolean).join(' / ') : null);
export const taskLink = (task) => `/auth/projects/${task.ProjectID}/${task.ID}`;

// a request: waiting for approval, or approved and waiting to be stocked
export const requestState = (request) => (request.AcceptedByID ? 'approved' : 'waiting');
export const requestStateLabels = { waiting: 'Čeká na schválení', approved: 'Schváleno' };
export const requestStateColors = { waiting: 'warning', approved: 'success' };
