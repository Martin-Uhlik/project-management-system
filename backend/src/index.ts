import './env.ts';
import { allowedOrigins, createApp } from './app.ts';
import { attachLive } from './live.ts';
import { demoResetSettingsFromEnv, scheduleDemoReset } from './demoReset.ts';

const PORT = process.env.BACKEND_PORT;

const server = createApp().listen(PORT, (error?: Error) => {
    if (!error) console.log('Server is Successfully Running, and App is listening on port ' + PORT);
    else {
        console.error("Error occurred, server can't start", error);
        process.exit(1);
    }
});
// live updates (Socket.IO, path /live) on the same port as the API
attachLive(server, allowedOrigins());

// the public demo goes back to its starting state every night (see demoReset.ts)
if (process.env.DEMO_MODE === 'true') {
    const settings = demoResetSettingsFromEnv();
    if (settings) {
        scheduleDemoReset(settings);
        console.log(`The demo data is reset every day at ${settings.hour}:00 (${settings.timeZone}).`);
    }
}

// errors outside a request (a failed background cleanup, a rejected promise nobody awaited) would otherwise vanish
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});
