import { AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnectionStatus, type AudioPlayer, type VoiceConnection } from "@discordjs/voice";
import { type Client, type GuildMember } from "discord.js";
import * as logger from "../utils/logger";
import { SpotifySource, YouTubeSource, type default as AudioSource, type Playable, type Track } from "./AudioSource";

export default class Player {
    private readonly voiceConnection: VoiceConnection;
    private readonly audioPlayer: AudioPlayer;
    private readonly sources: AudioSource[];
    public queue: Track[];
    public repeat: boolean;

    private constructor(voiceConnection: VoiceConnection, client: Client<true>) {
        this.voiceConnection = voiceConnection;
        this.audioPlayer = createAudioPlayer();
        this.sources = [new SpotifySource(), new YouTubeSource()];
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
                client.players.delete(this.voiceConnection.joinConfig.guildId);
            }
        });

        this.audioPlayer.on("stateChange", (oldState, newState) => {
            if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
                if (this.repeat)
                    this.queue.push(
                        (oldState.resource as AudioResource<Track>).metadata
                    );

                void this.process();
            } else if (oldState.status !== AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
                const resource = newState.resource as AudioResource<Track>;
                const track = resource.metadata;

                track.announce && track.announce(resource);
            }
        });

        this.voiceConnection.subscribe(this.audioPlayer);
    }

    public static get(member: GuildMember, join: boolean = true): Player | null {
        let player = member.client.players.get(member.guild.id);
        if (!join)
            return player ?? null;

        if (!player) {
            const channel = member.voice.channel;
            if (!channel)
                return null;

            const voiceConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator
            });

            member.client.players.set(
                member.guild.id,
                player = new Player(voiceConnection, member.client)
            );
        }

        return player;
    }

    public async search(query: string, omit: string[] = []): Promise<Playable | null> {
        let result = null;
        for (let source of this.sources) {
            if (source.name in omit)
                continue;

            result = await source.search(query);
            if (result)
                break;
        }

        return result;
    }

    public play(...tracks: Track[]): void {
        this.queue.push(...tracks);
        void this.process();
    }

    public skip(): boolean {
        return this.audioPlayer.stop(true);
    }

    public stop(): boolean {
        this.queue = [];
        return this.audioPlayer.stop(true) && this.voiceConnection.disconnect();
    }

    public getAudioStatus(): AudioPlayerStatus {
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
        if (!track.audio) {
            const result = await this.search(
                `${track.title} ${track.author.name} audio`,
                [track.source]
            ) as Track | null;

            if (result)
                track = {
                    ...track,
                    ...result
                };
        }

        try {
            const stream = await (track.audio && track.audio());
            if (stream) {
                this.audioPlayer.play(
                    createAudioResource(stream, {
                        metadata: track
                    })
                );

                return;
            }
        } catch (error) {
            logger.error(error);
        }

        track.error && track.error();
        void this.process();
    }
}
