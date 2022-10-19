import { createAudioResource, demuxProbe, type AudioResource } from "@discordjs/voice";
import { exec as ytdl } from "youtube-dl-exec";
import parseSpotify from "../utils/spotify";
import searchYouTube from "../utils/youtube";

export interface Person {
    url: string;
    name: string;
    image?: string | null;
}

export interface Track {
    type: "track";
    url: string;
    title: string;
    duration: string | "live";
    author?: Person | null;
    image?: string | null;
    external?: boolean;
    announce?: (resource: AudioResource<Track>) => void;
}

export interface Playlist {
    type: "playlist";
    url: string;
    title: string;
    tracks: Track[];
    author?: Person | null;
    image?: string | null;
}

export const getTrackOrPlaylist = async (query: string): Promise<Track | Playlist | null> => {
    const spotify = await parseSpotify(query);
    return spotify ?? searchYouTube(query);
}

export const getAudio = async (track: Track): Promise<AudioResource<Track>> => {
    const process = ytdl(track.url,
        {
            format: "bestaudio[acodec=opus]/bestaudio",
            limitRate: "128K",
            output: "-",
            quiet: true
        },
        { stdio: ["ignore", "pipe", "ignore"] }
    );

    if (!process.stdout)
        throw new Error("Failed to obtain audio stream.");

    const stream = process.stdout;
    return new Promise((resolve, reject) => {
        const onError = (error: Error) => {
            if (!process.killed)
                process.kill();

            stream.resume();
            reject(error);
        }

        process.once("spawn", () => {
            demuxProbe(stream).then(probe => {
                resolve(
                    createAudioResource(probe.stream, {
                        metadata: track,
                        inputType: probe.type
                    })
                )
            }).catch(onError);
        }).catch(onError)
    });
}
