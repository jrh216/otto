import { type AudioResource } from "@discordjs/voice";
import { type Awaitable } from "discord.js";
import { Readable } from "node:stream";
import { formatOpenURL } from "spotify-uri";
import spotify, { type Spotify } from "spotify-url-info";
import { fetch } from "undici";
import Innertube, { UniversalCache } from "youtubei.js";
import YouTubePlaylist from "youtubei.js/dist/src/parser/classes/Playlist";
import YouTubePlaylistVideo from "youtubei.js/dist/src/parser/classes/PlaylistVideo";
import YouTubeVideo from "youtubei.js/dist/src/parser/classes/Video";
import { streamToIterable } from "youtubei.js/dist/src/utils/Utils";

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
    source: string;
    image?: string;
    audio?: () => Promise<Readable | null>;
    announce?: (resource: AudioResource<Track>) => Awaitable<unknown>;
    error?: () => Awaitable<unknown>;
}

export interface Playlist {
    type: "playlist";
    url: string;
    title: string;
    tracks: Track[];
    author?: Author;
    image?: string;
}

export type Playable =
    | Track
    | Playlist;

export default abstract class AudioSource {
    public readonly name: string;

    public constructor(name: string) {
        this.name = name;
    }

    public abstract search(query: string): Promise<Playable | null>;
}

export class YouTubeSource extends AudioSource {
    private youtube: Promise<Innertube>;

    public constructor() {
        super("youtube");

        this.youtube = Innertube.create({
            cache: new UniversalCache()
        });
    }

    public async search(query: string): Promise<Playable | null> {
        const youtube = await this.youtube;

        const _query = query.replace(/^(https:\/\/)(m\.)(youtube\.com\/.*)$/i, "$1$3"); // `m.youtube.com` fix
        const result = (await youtube.search(_query))
            .results?.find((result) =>
                result.is(YouTubeVideo) ?
                    !isNaN(result.duration.seconds) :
                    result.is(YouTubePlaylist)
            );

        if (!result)
            return null;

        if (result.is(YouTubePlaylist)) {
            const playlist = await youtube.getPlaylist(result.id);
            const videos = playlist.videos.as(YouTubePlaylistVideo);

            return {
                type: "playlist",
                url: `https://youtube.com/playlist?list=${result.id}`,
                title: playlist.info.title,
                author: playlist.info.author && {
                    url: playlist.info.author.url!,
                    name: playlist.info.author.name,
                    image: playlist.info.author.best_thumbnail?.url
                },
                image: playlist.info.thumbnails[0].url,
                tracks: videos.map(this.toTrack)
            };
        }

        return this.toTrack(result.as(YouTubeVideo));
    }

    private toTrack(video: YouTubeVideo | YouTubePlaylistVideo): Track {
        return {
            type: "track",
            url: `https://youtube.com/watch?v=${video.id}`,
            title: video.title.text,
            duration: video.duration.seconds * 1000, // Convert to milliseconds
            author: {
                url: video.author.url!,
                name: video.author.name,
                image: video.author.best_thumbnail?.url
            },
            image: video.thumbnails[0]?.url,
            source: this.name,
            audio: async () => {
                const youtube = await this.youtube;
                const stream = await youtube.download(video.id, {
                    type: "audio",
                    quality: "bestefficiency"
                });

                return Readable.from(streamToIterable(stream));
            }
        };
    }
}

export class SpotifySource extends AudioSource {
    private spotify: Spotify;

    public constructor() {
        super("spotify");

        this.spotify = spotify(fetch);
    }

    public async search(query: string): Promise<Playable | null> {
        if (!query.match(/^https:\/\/open\.spotify\.com\/(?:album|playlist|track)\/(?:.*)/i))
            return null; // Invalid URL

        const data = await this.spotify.getData(query);
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
                    tracks: data.tracks.items.map(this.toTrack)
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
                    tracks: data.tracks.items.map((item: any) => this.toTrack(item.track))
                };
            case "track":
                return this.toTrack(data);
            default:
                return null;
        }
    }

    private toTrack(track: any): Track {
        return {
            type: "track",
            url: formatOpenURL(track.uri),
            title: track.name,
            duration: track.duration ?? track.duration_ms,
            author: {
                url: formatOpenURL(track.artists[0].uri),
                name: track.artists[0].name
            },
            image: track.coverArt?.sources[0].url,
            source: this.name
        };
    }
}
