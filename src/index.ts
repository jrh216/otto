import { Client } from "discord.js";
import { config } from "dotenv";
import { registerCommands, registerEvents } from "./utils/registrars";

config(); // Load environment variables

const client = new Client({
    intents: [
        "Guilds",
        "GuildVoiceStates"
    ]
});

(async () => {
    await registerEvents(client);
    await registerCommands();

    client.login(process.env.TOKEN);
})();
