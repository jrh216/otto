import { Client, Collection } from "discord.js";
import dotenv from "dotenv";
import { registerCommands, registerListeners } from "./utils/registrars";

dotenv.config(); // Load environment variables

const client = new Client({
    intents: [
        "Guilds",
        "GuildVoiceStates"
    ]
});

client.commands = new Collection();
client.players = new Collection();

(async () => {
    await registerListeners(client);
    await registerCommands(client);
    await client.login(process.env["TOKEN"]);
})();
