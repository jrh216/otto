import { AudioPlayerStatus, createAudioPlayer, entersState, joinVoiceChannel, VoiceConnectionStatus, type AudioPlayer, type AudioResource, type VoiceConnection } from "@discordjs/voice";
import { type Client, type Snowflake, type VoiceBasedChannel } from "discord.js";
import * as logger from "../utils/logger";
import { getAudio, type Track } from "./Track";

export default class Player {
    private readonly voiceConnection: VoiceConnection;
    private readonly audioPlayer: AudioPlayer;
    public queue: Track[];
    public repeat: boolean;

    constructor(voiceConnection: VoiceConnection, client: Client<true>) {
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
                client.players.delete(this.voiceConnection.joinConfig.guildId);
            }
        });

        this.audioPlayer.on("stateChange", (oldState, newState) => {
            if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
                if (this.repeat)
                    this.queue.push((oldState.resource as AudioResource<Track>).metadata);

                void this.process();
            } else if (oldState.status !== AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
                const resource = newState.resource as AudioResource<Track>;
                const track = resource.metadata;

                track.announce && void track.announce(resource);
            }
        });

        this.voiceConnection.subscribe(this.audioPlayer);
    }

    public static async connect(client: Client<true>, guildId: Snowflake, channel?: VoiceBasedChannel | null): Promise<Player | null> {
        if (client.players.has(guildId))
            return client.players.get(guildId)!;

        if (!channel)
            return null;

        const player = new Player(
            joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guildId,
                adapterCreator: channel.guild.voiceAdapterCreator
            }),
            client
        );

        client.players.set(guildId, player);

        return player;
    }

    public disconnect(): boolean {
        return this.voiceConnection.disconnect();
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
        return this.audioPlayer.stop(true);
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

        const track = this.queue.shift()!;

        try {
            const audio = await getAudio(track);
            if (audio) {
                this.audioPlayer.play(audio);
                return;
            }
        } catch (error) {
            logger.error(error);
        }

        track.error && void track.error();
        void this.process();
    }
}
