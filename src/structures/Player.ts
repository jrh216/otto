import { AudioPlayerStatus, AudioResource, createAudioPlayer, entersState, joinVoiceChannel, VoiceConnectionStatus, type AudioPlayer, type VoiceConnection } from "@discordjs/voice";
import { Collection, type GuildTextBasedChannel, type Snowflake, type VoiceBasedChannel } from "discord.js";
import duration from "../utils/duration.js";
import { trackEmbed } from "../utils/embeds.js";
import * as logger from "../utils/logger.js";
import getYouTubeData from "../utils/youtube.js";
import { getAudio, searchQuery, type Payload, type Playlist, type Track } from "./Track.js";

export const players = new Collection<Snowflake, Player>();

export default class Player {
    private readonly voiceConnection: VoiceConnection;
    private readonly audioPlayer: AudioPlayer;
    public queue: Payload[];
    public repeat: boolean;

    constructor(voiceConnection: VoiceConnection) {
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.queue = [];
        this.repeat = false;

        this.voiceConnection.on("stateChange", async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Signalling || newState.status === VoiceConnectionStatus.Connecting) {
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 30_000);
                } catch {
                    this.voiceConnection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Disconnected) {
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
                } catch {
                    this.voiceConnection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                players.delete(this.voiceConnection.joinConfig.guildId);
            }
        });

        this.audioPlayer.on("stateChange", async (oldState, newState) => {
            if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
                if (this.repeat) {
                    const payload = (oldState.resource as AudioResource<Payload>).metadata;
                    this.queue.push(payload); // Add finished track to end of queue
                }

                void this.process(); // Play next track in queue (if any)
            } else if (oldState.status !== AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
                const [track, textChannel] = (newState.resource as AudioResource<Payload>).metadata;
                if (!textChannel)
                    return;

                textChannel.send({
                    embeds: [
                        trackEmbed("Now Playing", track, 0, "full")
                    ]
                })
            }
        });

        this.voiceConnection.subscribe(this.audioPlayer);
    }

    public static connect(guildId: Snowflake, voiceChannel?: VoiceBasedChannel | null): Player | null {
        let player = players.get(guildId);
        if (!player) {
            if (!voiceChannel)
                return null;

            const voiceConnection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });

            players.set(
                guildId,
                player = new Player(voiceConnection)
            );
        }

        return player;
    }

    public disconnect(): boolean {
        return this.voiceConnection.disconnect();
    }

    public async play(query: string, textChannel: GuildTextBasedChannel | null): Promise<Track | Playlist | null> {
        const data = await searchQuery(query);
        if (data) {
            if (data.type === "playlist") {
                this.queue.push(
                    ...data.tracks.map((track) => [
                        track,
                        textChannel
                    ] as const)
                );
            } else if (data.type === "track") {
                this.queue.push([
                    data,
                    textChannel
                ]);
            }

            void this.process();
        }

        return data;
    }

    public pause(): boolean {
        return this.audioPlayer.pause();
    }

    public unpause(): boolean {
        return this.audioPlayer.unpause();
    }

    public skip(): boolean {
        return this.audioPlayer.stop(true); // Stop current track
    }

    public stop(): boolean {
        this.queue = []; // Clear queue
        this.repeat = false; // Turn off repeat
        return this.skip() && this.disconnect(); // Skip current track and disconnect
    }

    public getStatus(): AudioPlayerStatus {
        return this.audioPlayer.state.status;
    }

    public getCurrentTrack(): Track | null {
        if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle)
            return (this.audioPlayer.state.resource as AudioResource<Payload>).metadata[0];
        return null;
    }

    public getDuration(): number | null {
        if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
            const resource = this.audioPlayer.state.resource as AudioResource<Payload>;
            return duration(resource.playbackDuration).asSeconds(); // Convert to seconds
        }

        return null;
    }

    private async process(): Promise<void> {
        if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0)
            return;

        let [track, textChannel] = this.queue.shift()!;

        if (track.external) {
            const query = `audio ${track.title} ${track.artist?.name ?? ""}`.trim();
            const video = await getYouTubeData(query);
            if (!video) {
                textChannel?.send("Oops! Couldn't find that song.");

                void this.process();
                return;
            }

            track = video as Track;
        }

        try {
            this.audioPlayer.play(await getAudio([track, textChannel]));
        } catch (error) {
            logger.error(error);
        }
    }
}
