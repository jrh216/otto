import { Client, Collection, GatewayIntentBits } from "discord.js";
import { registerCommands } from "./structs/Command";
import { registerListeners } from "./structs/Listener";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
client.queues = new Collection();

(async () => {
    await registerListeners(client);
    await registerCommands(client);
    await client.login(process.env.TOKEN);
})();
