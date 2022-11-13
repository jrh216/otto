import { createAudioResource, type AudioResource } from "@discordjs/voice";
import { type Awaitable } from "discord.js";
import { Readable } from "node:stream";
import { formatOpenURL } from "spotify-uri";
import spotify from "spotify-url-info";
import { fetch } from "undici";
import { Innertube, UniversalCache, YTNodes } from "youtubei.js";
import PlaylistVideo from "youtubei.js/dist/src/parser/classes/PlaylistVideo";
import Video from "youtubei.js/dist/src/parser/classes/Video";
import { streamToIterable } from "youtubei.js/dist/src/utils/Utils";

const YouTube = Innertube.create({
    cache: new UniversalCache()
});

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
    author: Author;
    defer: boolean;
    image?: string;
    announce?: (resource: AudioResource<Track>) => Awaitable<unknown>;
    error?: () => Awaitable<unknown>;
}

export interface Playlist {
    type: "playlist";
    url: string;
    title: string;
    author: Author;
    tracks: Track[];
    image?: string;
}

export const search = async (query: string): Promise<Track | Playlist | null> => {
    if (query.match(/^https:\/\/open\.spotify\.com\/(?:album|playlist|track)\/([a-zA-Z0-9_-]*)/)) {
        const toTrack = (track: any): Track => ({
            type: "track",
            url: formatOpenURL(track.uri),
            title: track.name,
            duration: track.duration ?? track.duration_ms,
            author: {
                url: formatOpenURL(track.artists[0].uri),
                name: track.artists[0].name
            },
            defer: true,
            image: track.coverArt?.sources[0].url
        });

        const data = await spotify(fetch).getData(query);
        switch (data.type) {
            case "album":
                return {
                    type: "playlist",
                    url: formatOpenURL(data.uri),
                    title: data.name,
                    author: {
                        url: formatOpenURL(data.artists[0].uri),
                        name: data.artists[0].name
                    },
                    image: data.images[0].url,
                    tracks: data.tracks.items.map(toTrack)
                };
            case "playlist":
                return {
                    type: "playlist",
                    url: formatOpenURL(data.uri),
                    title: data.name,
                    author: {
                        url: formatOpenURL(data.owner.uri),
                        name: data.owner.display_name
                    },
                    image: data.images[0].url,
                    tracks: data.tracks.items.map((item: any) => toTrack(item.track))
                };
            case "track":
                return toTrack(data);
            default:
                return null;
        }
    } else {
        const parseURL = (url: string): [string, string] | null => {
            const results = url.match(/^https:\/\/(?:(?:www|m)\.)?youtube\.com\/(?:watch\?v=([a-zA-Z0-9_-]*)|playlist\?list=([a-zA-Z0-9_-]*))/);
            return results ? [
                results[1],
                results[2]
            ] : null;
        }

        const toTrack = (video: Video | PlaylistVideo): Track => ({
            type: "track",
            url: `https://youtube.com/watch?v=${video.id}`,
            title: video.title.text,
            duration: video.duration.seconds * 1000, // Convert to milliseconds
            author: {
                url: video.author.url!,
                name: video.author.name,
                image: video.author.best_thumbnail?.url
            },
            defer: false,
            image: video.thumbnails[0].url
        });

        const youtube = await YouTube;
        const ids = parseURL(query);
        if (!ids) {
            const result = (await youtube.search(query)).results
                ?.find((result) => result.is(YTNodes.Video) && !isNaN(result.duration.seconds))
                ?.as(YTNodes.Video);

            return result ?
                toTrack(result) :
                null;
        }

        const [videoId, playlistId] = ids;
        if (videoId) {
            const video = await youtube.getInfo(videoId, "WEB");
            if (!video.basic_info.duration)
                return null; // No live videos

            return {
                type: "track",
                url: `https://youtube.com/watch?v=${video.basic_info.id}`,
                title: video.basic_info.title!,
                duration: video.basic_info.duration,
                author: {
                    url: video.basic_info.channel!.url,
                    name: video.basic_info.channel!.name
                },
                defer: false,
                image: video.basic_info.thumbnail?.at(0)?.url
            };
        } else if (playlistId) {
            return null;

            // const playlist = await youtube.getPlaylist(playlistId);
            // const videos = playlist.videos.as(YTNodes.PlaylistVideo);

            // return {
            //     type: "playlist",
            //     url: `https://youtube.com/playlist?list=${playlistId}`,
            //     title: playlist.info.title,
            //     author: {
            //         url: playlist.info.author.url!,
            //         name: playlist.info.author.name,
            //         image: playlist.info.author.best_thumbnail?.url
            //     },
            //     tracks: videos.map(toTrack),
            //     image: playlist.info.thumbnails[0].url
            // };
        }

        return null;
    }
}

export const getAudio = async (track: Track): Promise<AudioResource<Track> | null> => {
    let _track = track;
    if (_track.defer) {
        const video = await search(
            `${_track.title} ${_track.author.name}`
        ) as Track | null;

        if (!video)
            return null;

        video.announce = _track.announce;
        video.error = _track.error;
        _track = video;
    }

    const id = _track.url.match(/https:\/\/youtube\.com\/watch\?v=([a-zA-Z0-9_-]*)/)![1];

    const youtube = await YouTube;
    const stream = await youtube.download(id, {
        type: "audio",
        quality: "bestefficiency"
    });

    return createAudioResource(
        Readable.from(streamToIterable(stream)),
        { metadata: _track }
    );
}
