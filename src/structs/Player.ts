import { AudioPlayerStatus, createAudioPlayer, entersState, joinVoiceChannel, VoiceConnectionStatus, type AudioPlayer, type AudioResource, type VoiceConnection } from "@discordjs/voice";
import { Collection, type GuildMember, type Snowflake } from "discord.js";
import * as logger from "../utils/logger";
import { type Playlist, type Track } from "./Track";

export const players = new Collection<Snowflake, Player>();

export default class Player {
    private readonly voiceConnection: VoiceConnection;
    private readonly audioPlayer: AudioPlayer;
    private queue: Track[];

    constructor(voiceConnection: VoiceConnection) {
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.queue = [];

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
                void this.process();
            } else if (oldState.status !== AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
                const resource = newState.resource as AudioResource<Track>;
                const track = resource.metadata;

                track.announce && track.announce(resource);
            }
        });

        this.voiceConnection.subscribe(this.audioPlayer);
    }

    public static connect(member: GuildMember): Player | null {
        let player = players.get(member.guild.id);
        if (!player) {
            const voice = member.voice.channel;
            if (!voice)
                return null;

            const voiceConnection = joinVoiceChannel({
                channelId: voice.id,
                guildId: voice.guild.id,
                adapterCreator: voice.guild.voiceAdapterCreator
            });

            players.set(
                voice.guild.id,
                player = new Player(voiceConnection)
            );
        }

        return player;
    }

    public disconnect(): boolean {
        return this.voiceConnection.disconnect();
    }

    public play(media: Track | Playlist): void {
        media.type === "track" ?
            this.queue.push(media) :
            this.queue.push(...media.tracks)

        void this.process();
    }

    public pause(): boolean {
        return this.audioPlayer.pause();
    }

    public unpause(): boolean {
        return this.audioPlayer.unpause();
    }

    public skip(): boolean {
        return this.audioPlayer.stop(true);
    }

    public stop(): boolean {
        this.queue = [];
        return this.skip() && this.disconnect();
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

        const track = this.queue.shift()!;

        try {
            this.audioPlayer.play(await track.audio());
        } catch (error) {
            logger.error(error);
            void this.process();
        }
    }
}
