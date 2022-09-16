import { APIApplicationCommand, REST, Routes } from "discord.js";
import { commands } from "../structures/Command.js";
import type Event from "../structures/Event.js";
import * as logger from "../utils/logger.js";

const ready: Event<"ready"> = {
    name: "ready",
    once: true,
    execute: async (client) => {
        logger.info("Ready!");

        if (!process.env.CLIENT_ID)
            throw new Error("The environment variable CLIENT_ID is not defined.");

        const rest = new REST({ version: "10" }).setToken(client.token);

        const response = await rest.put(
            process.env.GUILD_ID ?
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) :
                Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands.map(command => command.data.toJSON()) }
        ) as APIApplicationCommand[];

        response.forEach((command) => {
            logger.info(`Successfully registered command \`${command.name}\`.`);
        });
    }
};

export default ready;
