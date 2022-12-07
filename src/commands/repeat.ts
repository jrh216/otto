import { bold, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import Command from "../structs/Command";
import Queue from "../structs/Queue";

export default class RepeatCommand extends Command {
    public constructor() {
        super(
            new SlashCommandBuilder()
                .setName("repeat")
                .setDescription("Toggles repeating the current queue.")
                .setDMPermission(false)
        );
    }

    public async execute(interaction: ChatInputCommandInteraction<"cached">): Promise<unknown> {
        const queue = Queue.get(interaction.client, interaction.guildId);
        if (!queue)
            return interaction.reply({
                content: "Oops! Nothing's currently playing.",
                ephemeral: true
            });

        const repeat = queue.repeat = !queue.repeat;
        return interaction.reply(`Repeat is now ${bold(repeat ? "on" : "off")}.`);
    }
}
