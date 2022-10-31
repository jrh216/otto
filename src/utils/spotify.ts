import { formatOpenURL } from "spotify-uri";
import spotify from "spotify-url-info";
import { fetch } from "undici";
import { type Playlist, type Track } from "../structs/Track";
import searchYouTube from "./youtube";

const asTrack = (track: any): Track => ({
    type: "track",
    url: formatOpenURL(track.uri),
    title: track.name,
    duration: track.duration ?? track.duration_ms,
    author: {
        url: formatOpenURL(track.artists[0].uri),
        name: track.artists[0].name
    },
    image: track.coverArt?.sources[0].url,
    async audio() {
        const video = await searchYouTube(`${this.title} ${this.author.name} audio`) as Track;
        video.announce = this.announce;
        return video.audio();
    }
});

const parse = async (url: string): Promise<Track | Playlist | null> => {
    if (!url.match(/^https:\/\/open\.spotify\.com\/(?:album|playlist|track)\/(?:.*)/i))
        return null; // Invalid url

    const data = await spotify(fetch).getData(url);
    console.log(data);
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
