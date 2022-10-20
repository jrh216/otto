import { type AudioResource } from "@discordjs/voice";
import parseSpotify from "../utils/spotify";
import searchYouTube from "../utils/youtube";

export interface Track {
    type: "track";
    url: string;
    title: string;
    duration: number | "live";
    author: {
        url: string;
        name: string;
        image?: string;
    };
    image?: string;
    audio: () => Promise<AudioResource<Track> | null>;
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

const find = async (query: string): Promise<Track | Playlist | null> => {
    const spotify = await parseSpotify(query);
    return spotify ?? searchYouTube(query);
}

export default find;
