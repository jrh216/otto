import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnectionStatus, type AudioPlayer, type AudioResource, type VoiceConnection } from "@discordjs/voice";
import { type Client, type Snowflake, type VoiceBasedChannel } from "discord.js";
import { EventEmitter } from "node:events";
import { download } from "youtube-dlsr";
import { QueryType, resolveQuery } from "./Query";

type Source = "spotify" | "youtube";

interface Author {
    url: string;
    name: string;
    image?: string;
}

export interface Track {
    type: "track";
    url: string;
    title: string;
    duration: number;
    source: Source;
    author?: Author;
    image?: string;
}

export interface Playlist {
    type: "playlist";
    url: string;
    title: string;
    tracks: Track[];
    author?: Author;
    image?: string;
}

export default class Queue extends EventEmitter {
    private queue: any[];
    public repeat: boolean;
    private audioPlayer: AudioPlayer;
    private voiceConnection: VoiceConnection | null;

    private constructor() {
        super();
        this.queue = [];
        this.repeat = false;
        this.audioPlayer = createAudioPlayer();
        this.voiceConnection = null;

        this.audioPlayer.on("stateChange", (oldState, newState) => {
            if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
                if (this.repeat)
                    this.queue.push((oldState.resource as AudioResource<Track>).metadata);
                void this.process();
            } else if (oldState.status !== AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
                this.emit("trackStart", newState.resource as AudioResource);
            }
        });
    }

    public static create(client: Client<true>, guildId: Snowflake, ready: (queue: Queue) => void): Queue {
        let queue = client.queues.get(guildId);
        if (!queue) {
            client.queues.set(
                guildId,
                queue = new Queue()
            );

            ready(queue);
        }

        return queue;
    }

    public static get(client: Client<true>, guildId: Snowflake): Queue | null {
        return client.queues.get(guildId) ?? null;
    }

    public connect(channel: VoiceBasedChannel | null): boolean {
        if (!channel)
            return false;

        if (!!this.voiceConnection)
            return true;

        const voiceConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator
        });

        voiceConnection.on("stateChange", async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Signalling || newState.status === VoiceConnectionStatus.Connecting) {
                try {
                    await entersState(voiceConnection, VoiceConnectionStatus.Ready, 30_000);
                } catch {
                    voiceConnection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Disconnected) {
                try {
                    await entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
                } catch {
                    voiceConnection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                channel.client.queues.delete(voiceConnection.joinConfig.guildId);
            }
        });

        this.voiceConnection = voiceConnection;
        this.voiceConnection.subscribe(this.audioPlayer);

        return true;
    }

    public disconnect(): boolean {
        return !!this.voiceConnection && this.voiceConnection.disconnect();
    }

    public enqueue(...tracks: Track[]): void {
        this.queue.push(...tracks);
        void this.process();
    }

    public stop(clear?: true): boolean {
        if (clear) this.queue = [];
        return this.audioPlayer.stop(true);
    }

    public length(): number {
        return this.queue.length;
    }

    public getStatus(): AudioPlayerStatus {
        return this.audioPlayer.state.status;
    }

    public getCurrentTrack(): AudioResource<Track> | null {
        return this.audioPlayer.state.status !== AudioPlayerStatus.Idle ?
            this.audioPlayer.state.resource as AudioResource<Track> :
            null;
    }

    private async process(): Promise<void> {
        if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0)
            return;

        const track = this.queue.shift()!;

        try {
            const audio = await getAudio(track);
            this.audioPlayer.play(audio);
        } catch {
            this.emit("error");
            void this.process();
        }
    }
}

const getAudio = async (track: Track): Promise<AudioResource<Track>> => {
    let _track = track;
    if (_track.source !== "youtube") {
        const video = await resolveQuery(
            `${_track.title} ${_track.author?.name ?? ""} audio`.replace(/\s+/, ""),
            QueryType.YOUTUBE_VIDEO
        ) as Track | null;

        if (!video)
            throw "Failed to get track audio.";

        _track = video;
    }

    const stream = await download(_track.url, {
        chunkSize: 65536,
        highWaterMark: 1 << 25,
        liveBuffer: 1 << 63
    });

    return createAudioResource(stream, { metadata: _track });
}

