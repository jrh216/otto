import { type Interaction } from "discord.js";
import Listener from "../structs/Listener";
import * as logger from "../utils/logger";

export default class InteractionCreateListener extends Listener<"interactionCreate"> {
    public constructor() {
        super("interactionCreate");
    }

    public async run(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand())
            return;

        const command = interaction.client.commands.get(interaction.commandName);

        try {
            await command?.execute(interaction);
        } catch (error) {
            logger.error(error);
        }
    }
}
