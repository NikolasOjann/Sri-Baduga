const { io } = require("socket.io-client");
const { chromium } = require("playwright");

// GANTI INI DENGAN IP PC 1 ANDA (SERVER)
const SERVER_URL = "http://192.168.100.204:3000";
const CLIENT_ID = "Kiosk-Sribaduga";

console.log(`[*] Connecting to Central Server at ${SERVER_URL}...`);
const socket = io(SERVER_URL);

let browser = null;
let page = null;

socket.on("connect", () => {
    console.log(`[+] Connected to Server! My Socket ID: ${socket.id}`);
    socket.emit("register", { clientId: CLIENT_ID });
});

socket.on("registered", (data) => {
    console.log(`[=] Successfully registered as: ${data.clientId}`);
    console.log(`[*] Waiting for commands...`);
});

socket.on("execute_command", async (command) => {
    console.log(`[>] Received Command:`, command);

    try {
        if (command.action === "open_url") {
            const { url } = command.payload;
            console.log(`[*] Opening browser to URL: ${url}`);

            if (!browser || !browser.isConnected()) {
                console.log(`[*] Launching new browser instance...`);

                // Gunakan profil permanen agar Chrome mengingat bypass keamanan kita
                browser = await chromium.launchPersistentContext('C:\\kiosk-profile', {
                    headless: false,
                    channel: 'chrome',
                    ignoreDefaultArgs: ['--mute-audio'],
                    args: [
                        '--start-fullscreen',
                        '--autoplay-policy=no-user-gesture-required',
                        '--use-fake-ui-for-media-stream',
                        '--unsafely-treat-insecure-origin-as-secure=http://192.168.100.204:5173' // Pastikan IP ini sesuai dengan Laptop 1
                    ],
                    permissions: ['microphone'] // Izin mutlak microphone
                });

                // Ambil halaman (tab) pertama yang terbuka
                page = browser.pages()[0] || await browser.newPage();

            } else if (!page || page.isClosed()) {
                console.log(`[*] Opening new tab...`);
                page = await browser.newPage();
            }

            await page.goto(url);

            socket.emit("command_result", { clientId: CLIENT_ID, status: "success", result: `Successfully opened ${url}` });

        } else if (command.action === "close_browser") {
            if (browser) {
                await browser.close();
                browser = null;
                page = null;
                console.log(`[-] Browser closed.`);
                socket.emit("command_result", { clientId: CLIENT_ID, status: "success", result: "Browser closed" });
            }
        }
    } catch (error) {
        console.error(`[X] Error executing command:`, error);
        socket.emit("command_result", { clientId: CLIENT_ID, status: "error", result: error.message });
    }
});

// CCTV: Screen Mirroring Loop
setInterval(async () => {
    if (browser && browser.isConnected() && page && !page.isClosed()) {
        try {
            const buffer = await page.screenshot({ type: 'jpeg', quality: 30 });
            socket.emit("kiosk_stream", { clientId: CLIENT_ID, image: buffer.toString('base64') });
        } catch (err) { }
    }
}, 2000);

socket.on("disconnect", () => {
    console.log(`[-] Disconnected from Server.`);
});