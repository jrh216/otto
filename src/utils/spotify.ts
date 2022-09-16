import fetch from "cross-fetch";
import { formatOpenURL } from "spotify-uri";
import spotify from "spotify-url-info";
import { Person, type Playlist, type Track } from "../structures/Track.js";
import duration from "./duration.js";

interface Image {
    url: string;
}

interface SpotifyArtist {
    uri: string;
    name: string;
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

interface SpotifyPlaylist {
    uri: string;
    name: string;
    owner: {
        uri: string;
        display_name: string;
    },
    images: Image[];
    tracks: {
        items: {
            track: SpotifyTrack
        }[];
    };
}

interface SpotifyTrack {
    uri: string;
    name: string;
    duration?: number;
    duration_ms?: number;
    artists: SpotifyArtist[];
    coverArt?: {
        sources: Image[];
    }
}

const toPerson = (artist: SpotifyArtist): Person => ({
    url: formatOpenURL(artist.uri),
    name: artist.name
});

const toTrack = (track: SpotifyTrack): Track => ({
    type: "track",
    url: formatOpenURL(track.uri),
    title: track.name,
    duration: duration(track.duration_ms ?? track.duration ?? 0).asSeconds(),
    artist: toPerson(track.artists[0]),
    image: track.coverArt?.sources[0].url,
    external: true
});

const getData = async (url: string): Promise<Track | Playlist | null> => {
    if (!url.match(/https:\/\/open.spotify.com\/(?:album|playlist|track)\/[a-z0-9](?:\?si=[a-z0-9])?/i))
        return null;

    const data = await spotify(fetch).getData(url);
    if (data.type === "album") {
        const album = data as SpotifyAlbum;
        return {
            type: "playlist",
            url: formatOpenURL(album.uri),
            name: album.name,
            owner: toPerson(album.artists[0]),
            tracks: album.tracks.items.map((track) => toTrack(track)),
            image: album.images[0].url
        } as Playlist;
    } else if (data.type === "playlist") {
        const playlist = data as SpotifyPlaylist;
        console.log(playlist.tracks.items);
        return {
            type: "playlist",
            url: formatOpenURL(playlist.uri),
            name: playlist.name,
            owner: {
                url: formatOpenURL(playlist.owner.uri),
                name: playlist.owner.display_name
            },
            tracks: playlist.tracks.items.map((track) => toTrack(track.track)),
            image: playlist.images[0].url
        } as Playlist;
    } else if (data.type === "track") {
        return toTrack(data as SpotifyTrack);
    }

    return null;
}

export default getData;
