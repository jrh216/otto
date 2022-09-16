import { Client } from "discord.js";
import { config } from "dotenv";
import { registerCommands, registerEvents } from "./utils/registrars.js";

config(); // Load environment variables

const client = new Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildVoiceStates"
    ]
});

await registerEvents(client);
await registerCommands();
await client.login(process.env.TOKEN);
