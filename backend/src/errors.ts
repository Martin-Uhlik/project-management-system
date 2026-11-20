import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from './generated/prisma/client.ts';

// Throw from a route to answer with that status and a message the frontend shows to the user
export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export const unauthorized = () => new HttpError(401, 'Neplatné přihlášení.');
export const forbidden = () => new HttpError(403, 'Nemáte oprávnění k této akci.');
export const notFound = () => new HttpError(404, 'Záznam nenalezen.');
export const badRequest = (message = 'Neplatná data požadavku.') => new HttpError(400, message);

// Express 5 passes errors from async routes here
export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }
    if (err instanceof HttpError) {
        return res.status(err.status).send({ errorMessage: err.message });
    }
    if (err instanceof ZodError) {
        const fields = err.issues.map((issue) => issue.path.join('.') || '(body)').join(', ');
        return res.status(400).send({ errorMessage: `Neplatná data požadavku (${fields}).` });
    }
    // malformed JSON body (from express.json)
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).send({ errorMessage: 'Neplatná data požadavku.' });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // record to update or delete was not found
        if (err.code === 'P2025') {
            return res.status(404).send({ errorMessage: 'Záznam nenalezen.' });
        }
        // unique constraint, e.g. a taken user name
        if (err.code === 'P2002') {
            return res.status(409).send({ errorMessage: 'Záznam s těmito údaji už existuje.' });
        }
        // foreign key: a referenced user, task or machine doesn't exist
        if (err.code === 'P2003') {
            return res.status(400).send({ errorMessage: 'Odkazovaný záznam neexistuje.' });
        }
    }
    console.error(`${req.method} ${req.originalUrl} failed:`, err);
    return res.status(500).send({ errorMessage: 'Nastala chyba na straně serveru.' });
};
