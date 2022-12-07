import { formatOpenURL } from "spotify-uri";
import spotify from "spotify-url-info";
import { fetch } from "undici";
import { getPlaylistInfo, search, YoutubeCompactVideoInfo as YouTubeVideo, YoutubeListVideoInfo as YouTubePlaylistVideo } from "youtube-dlsr";
import { type Playlist, type Track } from "./Queue";

export enum QueryType {
    SPOTIFY_ALBUM,
    SPOTIFY_PLAYLIST,
    SPOTIFY_TRACK,
    YOUTUBE_PLAYLIST,
    YOUTUBE_VIDEO
}

export const SPOTIFY_ALBUM_REGEX = /^https:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9_-]*)/;
export const SPOTIFY_PLAYLIST_REGEX = /^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9_-]*)/;
export const SPOTIFY_TRACK_REGEX = /^https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9_-]*)/;
export const YOUTUBE_PLAYLIST_REGEX = /^https:\/\/(?:(?:www|m)\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]*)/;
export const YOUTUBE_VIDEO_REGEX = /^https:\/\/(?:(?:www|m)\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]*)/;

const getType = (query: string): QueryType => {
    if (SPOTIFY_ALBUM_REGEX.test(query)) return QueryType.SPOTIFY_ALBUM;
    if (SPOTIFY_PLAYLIST_REGEX.test(query)) return QueryType.SPOTIFY_PLAYLIST;
    if (SPOTIFY_TRACK_REGEX.test(query)) return QueryType.SPOTIFY_TRACK;
    if (YOUTUBE_PLAYLIST_REGEX.test(query)) return QueryType.YOUTUBE_PLAYLIST;
    if (YOUTUBE_VIDEO_REGEX.test(query)) return QueryType.YOUTUBE_VIDEO;
    return QueryType.YOUTUBE_VIDEO;
}

const getTrackFromYouTube = (data: YouTubeVideo | YouTubePlaylistVideo): Track => ({
    type: "track",
    url: data.url,
    title: data.title,
    duration: data.duration,
    author: "channel" in data ? {
        name: data.channel.title,
        url: data.channel.url,
        image: data.channel.thumbnails[0].url
    } : undefined,
    source: "youtube",
    image: data.thumbnails[0].url
});

const getTrackFromSpotify = (data: any): Track => ({
    type: "track",
    url: formatOpenURL(data.uri),
    title: data.name,
    duration: data.duration ?? data.duration_ms,
    author: {
        url: formatOpenURL(data.artists.at(0).uri),
        name: data.artists[0].name
    },
    source: "spotify",
    image: data.coverArt?.sources[0].url
});

export const resolveQuery = async (query: string, type?: QueryType): Promise<Track | Playlist | null> => {
    switch (type ?? getType(query)) {
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
                tracks: album.tracks.items.map(getTrackFromSpotify)
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
                tracks: playlist.tracks.items.map((item: any) => getTrackFromSpotify(item.track))
            };
        }
        case QueryType.SPOTIFY_TRACK: {
            const track = await spotify(fetch).getData(query);

            return getTrackFromSpotify(track);
        }
        case QueryType.YOUTUBE_PLAYLIST: {
            const playlist = await getPlaylistInfo(query);
            if (playlist.tracks.length === 0)
                return null;

            return {
                type: "playlist",
                url: playlist.url,
                title: playlist.title,
                tracks: playlist.tracks.map(getTrackFromYouTube),
                image: playlist.tracks[0].thumbnails[0].url
            };
        }
        case QueryType.YOUTUBE_VIDEO: {
            const videos = await search(
                query,
                { type: "video", limit: 1 }
            ) as YouTubeVideo[];

            return videos.length !== 0 ?
                getTrackFromYouTube(videos[0]) :
                null;
        }
        default:
            return null;
    }
}
