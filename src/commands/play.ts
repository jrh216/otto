import { type AudioResource } from "@discordjs/voice";
import { type ChatInputCommandInteraction } from "discord.js";
import Command from "../structs/Command";
import Player from "../structs/Player";
import { search } from "../structs/Query";
import { type Track } from "../structs/Track";
import { PlaylistEmbed, TrackEmbed } from "../utils/embed";

const announce = (interaction: ChatInputCommandInteraction<"cached">): (resource: AudioResource<Track>) => Promise<unknown> => {
    return (resource: AudioResource<Track>): Promise<unknown> =>
        interaction.followUp({
            embeds: [
                TrackEmbed(resource.metadata, "Now Playing", resource.playbackDuration)
                    .setThumbnail(null)
                    .setImage(resource.metadata.image ?? null)
            ]
        });
}

const error = (interaction: ChatInputCommandInteraction<"cached">): () => Promise<unknown> => {
    return (): Promise<unknown> =>
        interaction.followUp({
            content: "Oops! Unable to play that track.",
            ephemeral: true
        });
}

export default class PlayCommand extends Command {
    public constructor() {
        super((builder) =>
            builder
                .setName("play")
                .setDescription("Plays a song or video.")
                .addStringOption(option =>
                    option
                        .setName("query")
                        .setDescription("A query or URL.")
                        .setRequired(true)
                )
        );
    }

    public async execute(interaction: ChatInputCommandInteraction<"cached">): Promise<unknown> {
        const player = await Player.connect(interaction.client, interaction.guildId, interaction.member.voice.channel);
        if (!player)
            return interaction.reply({
                content: "You must be in a voice channel.",
                ephemeral: true
            });

        await interaction.deferReply();

        const query = interaction.options.getString("query", true);
        const result = await search(query);
        if (!result)
            return interaction.editReply({
                content: "Oops! Unable to find a result for that query."
            });

        if (result.type === "track") {
            result.announce = announce(interaction);
            result.error = error(interaction);

            player.play(result);

            return interaction.editReply({
                embeds: [
                    TrackEmbed(result, "Queued")
                ]
            });
        } else if (result.type === "playlist") {
            result.tracks.forEach((track) => {
                track.announce = announce(interaction);
                track.error = error(interaction);
            });

            player.play(...result.tracks);

            return interaction.editReply({
                embeds: [
                    PlaylistEmbed(result, "Queued")
                ]
            });
        }

        return interaction.editReply({
            content: "Oops! Something really bad has happened..."
        });
    }
}
