import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import Command from "../structs/Command";
import Queue from "../structs/Queue";

export default class StopCommand extends Command {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName("stop")
                .setDescription("Stops audio playback.")
                .setDMPermission(false)
        )
    }

    public async execute(interaction: ChatInputCommandInteraction<"cached" | "raw">): Promise<unknown> {
        const queue = Queue.get(interaction.client, interaction.guildId);
        if (!queue)
            return interaction.reply({
                content: "Oops! Nothing's currently playing.",
                ephemeral: true
            });

        queue.stop(true);

        return interaction.reply("Stopping audio playback...");
    }
}
