import { Collection, type ChatInputCommandInteraction, type SlashCommandBuilder } from "discord.js";

export const commands = new Collection<string, Command>();

export default interface Command {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
