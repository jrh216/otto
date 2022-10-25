import { createAudioResource } from "@discordjs/voice";
import { Readable } from "node:stream";
import Innertube from "youtubei.js";
import { ClientType } from "youtubei.js/dist/src/core/Session";
import YouTubePlaylist from "youtubei.js/dist/src/parser/classes/Playlist";
import YouTubePlaylistVideo from "youtubei.js/dist/src/parser/classes/PlaylistVideo";
import YouTubeVideo from "youtubei.js/dist/src/parser/classes/Video";
import { type Playlist, type Track } from "../structs/Track";

const asTrack = (YouTube: Innertube, video: YouTubeVideo | YouTubePlaylistVideo): Track => ({
    type: "track",
    url: `https://youtube.com/watch?v=${video.id}`,
    title: video.title.text,
    duration: video.duration.seconds,
    author: {
        url: video.author.url!,
        name: video.author.name,
        image: video.author.best_thumbnail?.url
    },
    image: video.thumbnails[0]?.url,
    async audio() {
        const stream = await YouTube.download(video.id, {
            type: "audio",
            quality: "bestefficiency"
        });

        return createAudioResource(
            Readable.from(stream),
            { metadata: this }
        );
    }
});

const search = async (query: string): Promise<Track | Playlist | null> => {
    query = query.replace(/^(https:\/\/)(m\.)(youtube\.com\/.*)$/i, "$1$3"); // `m.youtube.com` fix

    const YouTube = await Innertube.create({
        client_type: ClientType.WEB
    });

    const results = (await YouTube.search(query)).results
        ?.filter((result) =>
            result.is(YouTubeVideo) ?
                !isNaN(result.duration.seconds) :
                result.is(YouTubePlaylist)
        );

    if (!results || results.length === 0)
        return null;

    const result = results[0];
    if (result.is(YouTubeVideo)) {
        return asTrack(YouTube, result);
    } else if (result.is(YouTubePlaylist)) {
        const playlist = await YouTube.getPlaylist(result.id);
        const videos = playlist.videos.as(YouTubePlaylistVideo);

        return {
            type: "playlist",
            url: `https://youtube.com/playlist?list=${result.id}`,
            title: playlist.info.title,
            author: playlist.info.author ? {
                url: playlist.info.author.url!,
                name: playlist.info.author.name,
                image: playlist.info.author.best_thumbnail?.url
            } : undefined,
            image: playlist.info.thumbnails[0].url,
            tracks: videos.map(video => asTrack(YouTube, video))
        };
    }

    return null;
}

export default search;
