import { commands } from "../structures/Command.js";
import type Event from "../structures/Event.js";
import * as logger from "../utils/logger.js";

const interactionCreate: Event<"interactionCreate"> = {
    name: "interactionCreate",
    execute: async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;

        const command = commands.get(interaction.commandName);

        if (command) {
            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error(error);
            }
        } else {
            logger.error(`Command \`${interaction.commandName}\` doesn't exist.`);
        }
    }
};

export default interactionCreate;
