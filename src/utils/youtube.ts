import ytpl, { type Item as PlaylistVideo } from "ytpl";
import ytsr, { getFilters, type Video } from "ytsr";
import { type Playlist, type Track } from "../structs/Track";

const parsePlaylist = (url: string): string | null => {
    const results = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=([a-z0-9_-]*)/i);
    return results ? results[1] : null;
}

const isPlaylistVideo = (video: Video | PlaylistVideo): video is PlaylistVideo =>
    (video as PlaylistVideo).index !== undefined;

const toTrack = (video: Video | PlaylistVideo): Track => ({
    type: "track",
    url: video.url,
    title: video.title,
    duration: video.duration ?? "live",
    author: video.author && {
        url: video.author.url,
        name: video.author.name,
        image: !isPlaylistVideo(video) ?
            video.author.bestAvatar?.url :
            null
    },
    image: video.bestThumbnail.url
});

const search = async (query: string): Promise<Track | Playlist | null> => {
    const playlistId = parsePlaylist(query);
    if (!playlistId) {
        const filter = (await getFilters(query)).get("Type")!.get("Video")!;
        const results = await ytsr(filter.url!, { limit: 1 });
        if (results.items.length === 0)
            return null; // Failed to find a video

        const video = results.items[0] as Video;
        return toTrack(video);
    }

    const playlist = await ytpl(playlistId);

    return {
        type: "playlist",
        url: playlist.url,
        title: playlist.title,
        tracks: playlist.items.map(toTrack),
        author: playlist.author && {
            url: playlist.author.url,
            name: playlist.author.name,
            image: playlist.author.bestAvatar.url
        },
        image: playlist.bestThumbnail.url
    };
}

export default search;
