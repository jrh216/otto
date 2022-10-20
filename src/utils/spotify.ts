import { formatOpenURL } from "spotify-uri";
import spotify from "spotify-url-info";
import { fetch } from "undici";
import { type Playlist, type Track } from "../structs/Track";
import searchYouTube from "./youtube";

const asTrack = (track: any): Track => ({
    type: "track",
    url: formatOpenURL(track.uri),
    title: track.title ?? track.name,
    duration: Math.floor((track.duration ?? track.duration_ms) / 1000),
    author: {
        url: formatOpenURL(track.artists[0].uri),
        name: track.artists[0].name
    },
    image: track.coverArt?.sources[0].url,
    async audio() {
        const track = await searchYouTube(`${this.title} ${this.author.name} audio`) as Track | null;
        if (!track)
            return null;

        track.announce = this.announce;
        return track.audio();
    },
});

const parse = async (url: string): Promise<Track | Playlist | null> => {
    if (!url.match(/^https:\/\/open\.spotify\.com\/(album|playlist|track)\/([a-zA-Z0-9]*)/i))
        return null; // Invalid URL

    const data = await spotify(fetch).getData(url);
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
                tracks: data.tracks.items.map(asTrack)
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
                tracks: data.tracks.items.map((item: any) => asTrack(item.track))
            };
        case "track":
            return asTrack(data);
        default:
            return null;
    }
}

export default parse;
