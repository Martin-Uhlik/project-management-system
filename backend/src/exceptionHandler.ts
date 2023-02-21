import {Request, Response} from "express";

export const exceptionHandler = (foo: (req: Request, res: Response) => void) => {
    return async (req: Request, res: Response) => {
        try {
            await foo(req, res);
        } catch (err: any) {
            if (err.message === "403") {
                res.status(403);
                res.send({errorMessage: "Neplatné přihlášení."});
            } else {
                res.status(500);
                res.send({errorMessage: "Nastala chyba na straně serveru."});
            }
        }
    };
}
