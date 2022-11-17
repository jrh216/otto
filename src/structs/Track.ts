import { createAudioResource, type AudioResource } from "@discordjs/voice";
import { Readable } from "stream";
import Innertube from "youtubei.js";
import { streamToIterable } from "youtubei.js/dist/src/utils/Utils";
import { QueryType, search, YOUTUBE_VIDEO_REGEX } from "./Query";

interface Author {
    url: string | null;
    name: string;
    image?: string;
}

export interface Track {
    type: "track";
    url: string;
    title: string;
    duration: number;
    author: Author | null;
    source: "youtube" | "spotify";
    image?: string;
    announce?: (resource: AudioResource<Track>) => Promise<unknown>;
    error?: () => Promise<unknown>;
}

export interface Playlist {
    type: "playlist";
    url: string;
    title: string;
    author: Author | null;
    tracks: Track[];
    image?: string;
}

export const getAudio = async (track: Track): Promise<AudioResource<Track> | null> => {
    let _track: Track | null = track;
    if (_track.source !== "youtube") {
        _track = await search(
            `${_track.title} ${track.author?.name ?? ""} audio`.replace(/\s+/, ""),
            QueryType.YOUTUBE_VIDEO
        ) as Track | null;

        if (!_track)
            return null;

        _track.announce = track.announce;
        _track.error = track.error;
    }

    const youtube = await Innertube.create();
    const id = _track.url.match(YOUTUBE_VIDEO_REGEX)?.at(1)!;
    const stream = await youtube.download(id, {
        type: "audio",
        quality: "bestefficiency",
        client: "WEB"
    });

    return createAudioResource(
        Readable.from(streamToIterable(stream)),
        { metadata: _track }
    );
}
