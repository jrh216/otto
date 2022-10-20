import { createAudioResource } from "@discordjs/voice";
import { Readable } from "node:stream";
import { Innertube, UniversalCache } from "youtubei.js";
import YouTubePlaylist from "youtubei.js/dist/src/parser/classes/Playlist";
import YouTubePlaylistVideo from "youtubei.js/dist/src/parser/classes/PlaylistVideo";
import YouTubeVideo from "youtubei.js/dist/src/parser/classes/Video";
import { type Playlist, type Track } from "../structs/Track";

const YouTube = Innertube.create({
    cache: new UniversalCache()
});

const asTrack = (video: YouTubeVideo | YouTubePlaylistVideo): Track => ({
    type: "track",
    url: `https://youtube.com/watch?v=${video.id}`,
    title: video.title.text,
    duration: isNaN(video.duration.seconds) ? "live" : video.duration.seconds,
    author: {
        url: video.author.url!,
        name: video.author.name,
        image: video.author.best_thumbnail?.url
    },
    image: video.thumbnails[0]?.url,
    async audio() {
        const stream = await (await YouTube).download(video.id, {
            type: "audio",
            quality: "bestefficiency",
            format: "opus"
        });

        const readable = Readable.from(stream);
        return createAudioResource(readable, { metadata: this });
    }
});

const search = async (query: string): Promise<Track | Playlist | null> => {
    const results = (await (await YouTube).search(query)).results
        ?.filterType(YouTubeVideo, YouTubePlaylist);
    if (!results || results.length === 0)
        return null;

    const type = results[0].type;
    switch (type) {
        case "Video":
            return asTrack(results[0].as(YouTubeVideo));
        case "Playlist":
            const id = results[0].as(YouTubePlaylist).id;
            const playlist = await (await YouTube).getPlaylist(id);
            return {
                type: "playlist",
                url: `https://youtube.com/playlist?list=${id}`,
                title: playlist.info.title,
                author: playlist.info.author ? {
                    url: playlist.info.author.url!,
                    name: playlist.info.author.name,
                    image: playlist.info.author.best_thumbnail?.url
                } : undefined,
                image: playlist.info.thumbnails[0].url,
                tracks: playlist.videos.map(video => asTrack(video.as(YouTubePlaylistVideo)))
            };
        default:
            return null;
    }
}

export default search;
