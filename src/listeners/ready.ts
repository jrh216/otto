import { REST, RESTPutAPIApplicationGuildCommandsResult, Routes, type Client, type RESTPutAPIApplicationCommandsResult } from "discord.js";
import figlet from "figlet";
import Listener from "../structs/Listener";
import * as logger from "../utils/logger";

export default class ReadyListener extends Listener<"ready"> {
    public constructor() {
        super("ready", true);
    }

    public async run(client: Client<true>): Promise<void> {
        console.log(
            figlet.textSync(client.user.username, "Slant")
        );

        if (!process.env.CLIENT_ID)
            throw new Error("Please provide the CLIENT_ID environment variable.");

        const rest = new REST({ version: "10" }).setToken(client.token);

        const response = await rest.put(
            process.env.GUILD_ID ?
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) :
                Routes.applicationCommands(process.env.CLIENT_ID),
            { body: client.commands.map((command) => command.data.toJSON()) }
        ) as RESTPutAPIApplicationCommandsResult | RESTPutAPIApplicationGuildCommandsResult;

        response.forEach((command) =>
            logger.info(`Successfully registered command \`${command.name}\`.`)
        );
    }
}
