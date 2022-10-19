import { Collection, type ChatInputCommandInteraction, type SlashCommandBuilder } from "discord.js";

export const commands = new Collection<String, Command>();

export default interface Command {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
