import { formatOpenURL } from "spotify-uri";
import spotify from "spotify-url-info";
import { fetch } from "undici";
import Innertube, { YTNodes } from "youtubei.js";
import YouTubePlaylistVideo from "youtubei.js/dist/src/parser/classes/PlaylistVideo";
import YouTubeVideo from "youtubei.js/dist/src/parser/classes/Video";
import { type Playlist, type Track } from "./Track";

export const SPOTIFY_ALBUM_REGEX = /^https:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9_-]*)/;
export const SPOTIFY_PLAYLIST_REGEX = /^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9_-]*)/;
export const SPOTIFY_TRACK_REGEX = /^https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9_-]*)/;
export const YOUTUBE_PLAYLIST_REGEX = /^https:\/\/(?:(?:www|m)\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]*)/;
export const YOUTUBE_VIDEO_REGEX = /^https:\/\/(?:(?:www|m)\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]*)/;

export enum QueryType {
    SPOTIFY_ALBUM,
    SPOTIFY_PLAYLIST,
    SPOTIFY_TRACK,
    YOUTUBE_PLAYLIST,
    YOUTUBE_VIDEO
}

const getType = (query: string): QueryType => {
    if (SPOTIFY_ALBUM_REGEX.test(query)) return QueryType.SPOTIFY_ALBUM;
    if (SPOTIFY_PLAYLIST_REGEX.test(query)) return QueryType.SPOTIFY_PLAYLIST;
    if (SPOTIFY_TRACK_REGEX.test(query)) return QueryType.SPOTIFY_TRACK;
    if (YOUTUBE_PLAYLIST_REGEX.test(query)) return QueryType.YOUTUBE_PLAYLIST;
    if (YOUTUBE_VIDEO_REGEX.test(query)) return QueryType.YOUTUBE_VIDEO;
    return QueryType.YOUTUBE_VIDEO;
}

const fromYouTubeVideo = (video: YouTubeVideo | YouTubePlaylistVideo): Track => ({
    type: "track",
    url: `https://youtube.com/watch?v=${video.id}`,
    title: video.title.text,
    duration: video.duration.seconds * 1000, // Convert to milliseconds
    source: "youtube",
    author: {
        url: video.author.url,
        name: video.author.name,
        image: video.author.best_thumbnail?.url
    },
    image: video.thumbnails.at(0)?.url
});

const fromSpotifyTrack = (track: any): Track => ({
    type: "track",
    url: formatOpenURL(track.uri),
    title: track.name,
    duration: track.duration ?? track.duration_ms,
    author: {
        url: formatOpenURL(track.artists.at(0).uri),
        name: track.artists.at(0).name
    },
    source: "spotify",
    image: track.coverArt?.sources.at(0).url
});

export const search = async (query: string, type?: QueryType): Promise<Track | Playlist | null> => {
    let _type = type ?? getType(query);
    switch (_type) {
        case QueryType.SPOTIFY_ALBUM: {
            const album = await spotify(fetch).getData(query);
            return {
                type: "playlist",
                url: formatOpenURL(album.uri),
                title: album.name,
                author: {
                    url: formatOpenURL(album.artists.at(0).uri),
                    name: album.artists.at(0).name
                },
                image: album.images.at(0).url,
                tracks: album.tracks.items.map(fromSpotifyTrack)
            };
        }
        case QueryType.SPOTIFY_PLAYLIST: {
            const playlist = await spotify(fetch).getData(query);
            return {
                type: "playlist",
                url: formatOpenURL(playlist.uri),
                title: playlist.name,
                author: {
                    url: formatOpenURL(playlist.owner.uri),
                    name: playlist.owner.display_name
                },
                image: playlist.images.at(0).url,
                tracks: playlist.tracks.items.map((item: any) => fromSpotifyTrack(item.track))
            };
        }
        case QueryType.SPOTIFY_TRACK: {
            const track = await spotify(fetch).getData(query);
            return fromSpotifyTrack(track);
        }
        case QueryType.YOUTUBE_PLAYLIST: {
            const youtube = await Innertube.create();

            const id = query.match(YOUTUBE_PLAYLIST_REGEX)?.at(1)!;

            try {
                const playlist = await youtube.getPlaylist(id);
                const videos = playlist.videos.as(YTNodes.PlaylistVideo, YTNodes.Video)
                    .filter((video) => !isNaN(video.duration.seconds));

                return {
                    type: "playlist",
                    url: `https://youtube.com/playlist?list=${id}`,
                    title: playlist.info.title,
                    author: {
                        url: playlist.info.author.url ?? "",
                        name: playlist.info.author.name,
                        image: playlist.info.author.best_thumbnail?.url
                    },
                    tracks: videos.map(fromYouTubeVideo),
                    image: playlist.info.thumbnails.at(0)?.url
                };
            } catch (error) {
                console.log(error);
                return null;
            }
        }
        case QueryType.YOUTUBE_VIDEO: {
            const youtube = await Innertube.create();

            const id = query.match(YOUTUBE_VIDEO_REGEX)?.at(1);

            if (!id) {
                const video = (await youtube.search(query, { type: "video" })).results
                    ?.filterType(YTNodes.Video)
                    .find((video) => !isNaN(video.duration.seconds));

                return video ? fromYouTubeVideo(video) : null;
            }

            try {
                const video = await youtube.getInfo(id, "WEB");
                if (video.basic_info.duration === 0)
                    return null; // Fail to resolve livestreams

                return {
                    type: "track",
                    url: `https://youtube.com/watch?v=${video.basic_info.id!}`,
                    title: video.basic_info.title!,
                    duration: video.basic_info.duration! * 1000, // Convert to milliseconds
                    author: video.basic_info.channel && {
                        url: video.basic_info.channel.url,
                        name: video.basic_info.channel.name,
                        image: video.secondary_info?.owner?.author.best_thumbnail?.url
                    },
                    source: "youtube",
                    image: video.basic_info.thumbnail?.at(0)?.url
                };
            } catch {
                return null;
            }
        }
        default: {
            return null;
        }
    }
}
