import { commands } from "../structs/Command";
import type Event from "../structs/Event";
import * as logger from "../utils/logger";

const interactionCreate: Event<"interactionCreate"> = {
    name: "interactionCreate",
    listener: async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;

        const command = commands.get(interaction.commandName);

        try {
            command?.execute(interaction);
        } catch (error) {
            logger.error(`Command \`${interaction.commandName}\` had an error.`);
        }
    }
};

export default interactionCreate;