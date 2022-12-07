import { type AudioResource } from "@discordjs/voice";
import { GuildMember, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import Command from "../structs/Command";
import { resolveQuery } from "../structs/Query";
import Queue, { type Track } from "../structs/Queue";
import { NowPlayingEmbed, QueuedEmbed } from "../utils/embeds";

export default class PlayCommand extends Command {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName("play")
                .setDescription("Plays a song or video.")
                .setDMPermission(false)
                .addStringOption(option =>
                    option
                        .setName("query")
                        .setDescription("A query or link.")
                        .setRequired(true)
                )
        )
    }

    public async execute(interaction: ChatInputCommandInteraction<"cached" | "raw">): Promise<unknown> {
        const queue = Queue.create(interaction.client, interaction.guildId, (queue) => {
            queue.on("trackStart", (resource: AudioResource<Track>) => {
                interaction.channel?.send({
                    embeds: [
                        NowPlayingEmbed(resource.metadata, resource.playbackDuration)
                    ]
                });
            });

            queue.on("error", () => {
                interaction.channel?.send("Oops! Failed to play the next track. Skipping.")
            });
        });

        if (!queue.connect((interaction.member as GuildMember).voice.channel))
            return interaction.reply({
                content: "Oops! You're not in a voice channel.",
                ephemeral: true
            });

        await interaction.deferReply();

        const query = interaction.options.getString("query", true);
        const result = await resolveQuery(query);
        if (!result)
            return interaction.followUp({
                content: "Oops! Didn't find any results for that query.",
                ephemeral: true
            });

        queue.enqueue(...(
            result.type === "track" ?
                [result] :
                result.tracks
        ));

        return interaction.editReply({
            embeds: [
                QueuedEmbed(result)
            ]
        });
    }
}
