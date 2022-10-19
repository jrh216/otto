import fetch from "cross-fetch";
import { formatOpenURL } from "spotify-uri";
import spotify from "spotify-url-info";
import { type Person, type Playlist, type Track } from "../structs/Track";
import { formatDuration } from "./duration";

interface Image {
    url: string;
}

interface SpotifyArtist {
    uri: string;
    name: string;
}

interface SpotifyPlaylist {
    uri: string;
    name: string;
    owner: {
        uri: string;
        display_name: string;
    };
    images: Image[];
    tracks: {
        items: {
            track: SpotifyTrack;
        }[];
    }
}

interface SpotifyAlbum {
    uri: string;
    name: string;
    artists: SpotifyArtist[];
    images: Image[];
    tracks: {
        items: SpotifyTrack[];
    }
}

interface SpotifyTrack {
    uri: string;
    name: string;
    duration?: number;
    duration_ms?: number;
    artists: SpotifyArtist[];
    coverArt?: {
        sources: Image[];
    };
}

const toPerson = (artist: SpotifyArtist): Person => ({
    url: formatOpenURL(artist.uri),
    name: artist.name
});

const toTrack = (track: SpotifyTrack): Track => ({
    type: "track",
    url: formatOpenURL(track.uri),
    title: track.name,
    duration: formatDuration(track.duration ?? track.duration_ms ?? 0, "milliseconds"),
    author: toPerson(track.artists[0]),
    image: track.coverArt?.sources[0].url,
    external: true
});

const parse = async (url: string): Promise<Track | Playlist | null> => {
    if (!url.match(/^https:\/\/open.spotify.com\/(?:album|playlist|track)\/[a-z0-9](?:\?si=[a-z0-9])?/i))
        return null;

    const data = await spotify(fetch).getData(url);
    switch (data.type) {
        case "playlist":
            const playlist: SpotifyPlaylist = data;
            return {
                type: "playlist",
                url: formatOpenURL(playlist.uri),
                title: playlist.name,
                tracks: playlist.tracks.items.map(item => toTrack(item.track)),
                author: {
                    url: formatOpenURL(playlist.owner.uri),
                    name: playlist.owner.display_name
                },
                image: playlist.images[0].url
            };
        case "album":
            const album: SpotifyAlbum = data;
            return {
                type: "playlist",
                url: formatOpenURL(album.uri),
                title: album.name,
                tracks: album.tracks.items.map(toTrack),
                author: toPerson(album.artists[0]),
                image: album.images[0].url
            };
        case "track":
            return toTrack(data);
    }

    return null;
}

export default parse;
