import { REST, Routes, type Client, type RESTPutAPIApplicationCommandsResult, type RESTPutAPIApplicationGuildCommandsResult } from "discord.js";
import Listener from "../structs/Listener";
import * as logger from "../utils/logger";

export default class ReadyListener extends Listener<"ready"> {
    public constructor() {
        super("ready", true);
    }

    public async run(client: Client<true>): Promise<void> {
        logger.info("Ready!");

        if (!process.env.CLIENT_ID)
            throw "The environment variable CLIENT_ID is not set.";

        const rest = new REST({ version: "10" }).setToken(client.token);

        const response = await rest.put(
            process.env.GUILD_ID ?
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) :
                Routes.applicationCommands(process.env.CLIENT_ID),
            { body: client.commands.map((command) => command.data) }
        ) as RESTPutAPIApplicationCommandsResult | RESTPutAPIApplicationGuildCommandsResult;

        response.forEach((command) => logger.info(`Successfully registered command \`${command.name}\`.`));
    }
}
