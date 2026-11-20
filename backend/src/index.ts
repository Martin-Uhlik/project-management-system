import './env.ts';
import { createApp } from './app.ts';

const PORT = process.env.BACKEND_PORT;

createApp().listen(PORT, (error?: Error) => {
    if (!error) console.log('Server is Successfully Running, and App is listening on port ' + PORT);
    else {
        console.error("Error occurred, server can't start", error);
        process.exit(1);
    }
});

// errors outside a request (a failed background cleanup, a rejected promise nobody awaited) would otherwise vanish
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});
