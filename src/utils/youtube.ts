import { Client, LiveVideo, Playlist as YouTubePlaylist, Video, VideoCompact } from "youtubei";
import { type Playlist, type Track } from "../structures/Track.js";

const YouTube = new Client();

const toTrack = (video: Video | LiveVideo | VideoCompact): Track => ({
    type: "track",
    url: `https://youtube.com/watch?v=${video.id}`,
    title: video.title,
    duration: video instanceof LiveVideo ?
        null :
        video.duration,
    artist: video.channel ? {
        url: video.channel.url,
        name: video.channel.name,
        image: video.channel.thumbnails?.best
    } : null,
    image: video.thumbnails.best,
    live: video instanceof LiveVideo
});

const parseQuery = (query: string): readonly [string, string] | null => {
    const results = query.match(/^https:\/\/(?:www\.)?youtube.com\/(?:watch\?v=([a-z0-9_-]*))?(?:playlist)?(?:(?:\?|&)list=([a-z0-9_-]*))?/i);
    if (results) {
        const [_, videoId, playlistId] = results;
        return [videoId, playlistId];
    }

    return null;
}

const getData = async (query: string): Promise<Track | Playlist | null> => {
    const ids = parseQuery(query);
    if (ids) {
        const [videoId, playlistId] = ids;
        if (videoId) {
            const video = await YouTube.getVideo(videoId);
            return video ? toTrack(video) : null;
        } else if (playlistId) {
            const playlist = await YouTube.getPlaylist(playlistId);
            if (playlist) {
                const videos = playlist instanceof YouTubePlaylist ?
                    playlist.videos.items :
                    playlist.videos;

                return {
                    type: "playlist",
                    url: `https://youtube.com/playlist?list=${playlist.id}`,
                    name: playlist.title,
                    owner: playlist instanceof YouTubePlaylist && playlist.channel ? {
                        url: playlist.channel.url,
                        name: playlist.channel.name,
                        image: playlist.channel.thumbnails?.best
                    } : null,
                    tracks: videos.map(toTrack),
                    image: videos[0].thumbnails.best
                } as Playlist;
            }

            return null;
        }
    }

    const video = await YouTube.findOne(query, { type: "video" });
    return video ? toTrack(video) : null;
}

export default getData;
