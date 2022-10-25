import { type AudioResource } from "@discordjs/voice";

export interface Track {
    type: "track";
    url: string;
    title: string;
    duration: number;
    author: {
        url: string;
        name: string;
        image?: string;
    };
    image?: string;
    audio: () => Promise<AudioResource<Track>>;
    announce?: (resource: AudioResource<Track>) => Promise<void>;
}

export interface Playlist {
    type: "playlist";
    url: string;
    title: string;
    author?: {
        url: string;
        name: string;
        image?: string;
    };
    image?: string;
    tracks: Track[];
}
