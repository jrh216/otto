import { REST, Routes, type RESTPutAPIApplicationCommandsResult, type RESTPutAPIApplicationGuildCommandsResult } from "discord.js";
import figlet from "figlet";
import { commands } from "../structs/Command";
import type Event from "../structs/Event";
import * as logger from "../utils/logger";

const ready: Event<"ready"> = {
    name: "ready",
    listener: async (client) => {
        console.log(figlet.textSync("Otto", { font: "Slant" })); // ASCII text

        if (!process.env.CLIENT_ID)
            throw new Error("The environment variable CLIENT_ID must be provided.");

        logger.info("Registering slash commands...");

        const rest = new REST({ version: "10" }).setToken(client.token);

        const results = await rest.put(
            process.env.GUILD_ID ?
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) :
                Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands.map(command => command.data.toJSON()) }
        ) as (RESTPutAPIApplicationCommandsResult | RESTPutAPIApplicationGuildCommandsResult);

        results.forEach(command => logger.info(`Successfully registered command \`${command.name}\`.`));
    },
    once: true
};

export default ready;
