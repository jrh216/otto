import { AudioPlayerStatus, AudioResource, createAudioPlayer, entersState, joinVoiceChannel, VoiceConnectionStatus, type AudioPlayer, type VoiceConnection } from "@discordjs/voice";
import { Collection, type Snowflake, type VoiceBasedChannel } from "discord.js";
import * as logger from "../utils/logger";
import searchYouTube from "../utils/youtube";
import { getAudio, Playlist, type Track } from "./Track";

export const players = new Collection<Snowflake, Player>();

export default class Player {
    private readonly voiceConnection: VoiceConnection;
    private readonly audioPlayer: AudioPlayer;
    public queue: Track[];
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
                    const track = (oldState.resource as AudioResource<Track>).metadata;
                    this.queue.push(track); // Add track to end of queue
                }

                void this.process(); // Play next track in queue (if any)
            } else if (oldState.status !== AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
                const resource = newState.resource as AudioResource<Track>;
                const track = resource.metadata;

                track.announce && track.announce(resource); // Announce current track (if possible)
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
                voiceChannel.guildId,
                player = new Player(voiceConnection)
            );
        }

        return player;
    }

    public disconnect(): boolean {
        return this.voiceConnection.disconnect();
    }

    public play(track: Track | Playlist): void {
        // Add tracks to queue
        track.type === "track" ?
            this.queue.push(track) :
            this.queue.push(...track.tracks);

        void this.process();
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
        return this.skip() && this.disconnect(); // Skip current track and disconnect
    }

    public getStatus(): AudioPlayerStatus {
        return this.audioPlayer.state.status;
    }

    public getCurrentResource(): AudioResource<Track> | null {
        if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle)
            return this.audioPlayer.state.resource as AudioResource<Track>;
        return null;
    }

    private async process(): Promise<void> {
        if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0)
            return;

        let track = this.queue.shift()!;
        if (track.external) {
            const video = await searchYouTube(`${track.title} ${track.author?.name ?? ""} audio`) as Track;
            if (!video) {
                void this.process();
                return;
            }

            track = {
                ...video,
                announce: track.announce
            };
        }

        try {
            this.audioPlayer.play(await getAudio(track));
        } catch (error) {
            logger.error(error);
            void this.process(); // Attempt to play next track in queue
        }
    }
}
