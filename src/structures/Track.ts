import { createAudioResource, type AudioResource } from "@discordjs/voice";
import { type GuildTextBasedChannel } from "discord.js";
import ytdl from "ytdl-core";
import getSpotifyData from "../utils/spotify.js";
import getYouTubeData from "../utils/youtube.js";

export interface Person {
    url: string;
    name: string;
    image?: string;
}

export interface Track {
    type: "track";
    url: string;
    title: string;
    duration: number | null;
    artist: Person | null;
    image?: string;
    live?: boolean;
    external?: boolean;
}

export interface Playlist {
    type: "playlist";
    url: string;
    name: string;
    owner: Person | null;
    tracks: Track[];
    image?: string;
}

export type Payload = readonly [track: Track, textChannel: GuildTextBasedChannel | null];

export const searchQuery = async (query: string): Promise<Track | Playlist | null> => {
    const spotify = await getSpotifyData(query);
    return spotify ?? await getYouTubeData(query);
}

export const getAudio = async (payload: Payload): Promise<AudioResource<Payload>> => {
    const [track] = payload;
    const stream = ytdl(track.url, {
        filter: track.live ?
            "audio" :
            "audioonly",
        quality: "lowestaudio",
        dlChunkSize: 0,
        liveBuffer: 1 << 62,
        highWaterMark: 1 << 62
    });

    return createAudioResource(stream, {
        metadata: payload
    });
}
