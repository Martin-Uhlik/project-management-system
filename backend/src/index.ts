import './env.ts';
import { createApp } from './app.ts';

const PORT = process.env.BACKEND_PORT;

createApp().listen(PORT, (error?: Error) => {
    if (!error) console.log('Server is Successfully Running, and App is listening on port ' + PORT);
    else console.log("Error occurred, server can't start", error);
});
