import { type AudioResource } from "@discordjs/voice";
import { type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import EmbedLogger from "../embeds/EmbedLogger";
import EmbedPlaylist from "../embeds/EmbedPlaylist";
import EmbedTrack from "../embeds/EmbedTrack";
import { type Track } from "../structs/AudioSource";
import Command from "../structs/Command";
import Player from "../structs/Player";

const announce = (interaction: ChatInputCommandInteraction): (resource: AudioResource<Track>) => Promise<unknown> => {
    return (resource: AudioResource<Track>): Promise<unknown> => {
        const track = resource.metadata;
        return interaction.followUp({
            embeds: [
                EmbedTrack(track, "Now Playing", resource.playbackDuration)
                    .setThumbnail(null)
                    .setImage(track.image ?? null)
            ]
        });
    }
}

const error = (interaction: ChatInputCommandInteraction): () => Promise<unknown> => {
    return (): Promise<unknown> =>
        interaction.followUp({
            embeds: [
                EmbedLogger("Unable to play the track.", "error")
            ]
        });
}

export default class PlayCommand extends Command {
    public constructor() {
        super((builder) =>
            builder
                .setName("play")
                .setDescription("Plays a song or video audio.")
                .setDMPermission(false)
                .addStringOption(option =>
                    option
                        .setName("query")
                        .setDescription("A query or URL.")
                        .setRequired(true)
                )
        );
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<unknown> {
        const player = Player.get(interaction.member as GuildMember);
        if (!player)
            return interaction.reply({
                embeds: [
                    EmbedLogger("You need to be in a voice channel.", "error")
                ],
                ephemeral: true
            });

        await interaction.deferReply();

        const query = interaction.options.getString("query", true);
        const result = await player.search(query);

        if (!result)
            return interaction.editReply({
                embeds: [
                    EmbedLogger("No results were found for that query.", "error")
                ]
            });

        if (result.type === "track") {
            result.announce = announce(interaction);
            result.error = error(interaction);

            await interaction.editReply({
                embeds: [
                    EmbedTrack(result, "Queued")
                ]
            });

            player.play(result);
        } else if (result.type === "playlist") {
            result.tracks.forEach((track) => {
                track.announce = announce(interaction);
                track.error = error(interaction);
            });

            await interaction.editReply({
                embeds: [
                    EmbedPlaylist(result, "Queued")
                ]
            });

            player.play(...result.tracks);
        }
    }
}
