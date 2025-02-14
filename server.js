const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
console.log("Dotenv loaded");
const config = require('./config');
const ApiHelper = require('./src/utils/api-helper');


const app = express();
const port = config.serverApiUrl.substring(config.serverApiUrl.lastIndexOf(":") + 1);


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

console.log("Starting server...");
app.use(cors());
app.use(express.json());


const apiHelper = new ApiHelper(config);
apiHelper.setup();


app.get('/youtube/login', (req, res) => {
    res.redirect(apiHelper.generateYTAuthUrl());
});

app.get('/youtube/callback', (req, res) => {
    apiHelper.youtubeCredentials(req, res);
});


app.get('/spotify/login', (req, res) => {
    res.redirect(apiHelper.generateSpotifyAuthUrl());
});

app.get('/spotify/callback', (req, res) => {
    apiHelper.spotifyCredentials(req, res)
});

app.get('/playlists', (req, res) => {
    apiHelper.getSpotifyPlaylists(res);
});


app.get('/tracks', (req, res) => {
    apiHelper.getSpotifyTracks(req, res);
});

app.post('/transfer', async (req, res) => {
    var { playlistName, spotifyTracks, offset } = req.body;

    console.log("Starting transfer...");

    if (playlistName === undefined) {
        playlistName = "SpoTube Playlist";
    }

    try {
        let youtubePlaylistId;
        const existingPlaylist = await apiHelper.findExistingPlaylist(playlistName);

        if (existingPlaylist) {
            youtubePlaylistId = existingPlaylist.id;
            console.log('Using existing playlist: ', playlistName, " - ", existingPlaylist.id);
        } else {
            youtubePlaylistId = await apiHelper.createYoutubePlaylist(playlistName);
            console.log('Playlist created with name: ', playlistName);
        }
        if (offset > 0) {
            console.log("Skipping ", offset, " tracks.");
        }

        const maxOffset = spotifyTracks.length > 0 ? spotifyTracks.length - 1 : 0;
        offset = Math.max(0, Math.min(offset, maxOffset));

        for (let i = offset; i < spotifyTracks.length; i++) {
            const track = spotifyTracks[i];
            const query = `${track.track.name} - ${track.track.artists[0].name}`;
            const videoId = await apiHelper.searchYoutubeVideo(query);

            if (!videoId) {
                console.warn(`No video found for: ${query}. Skipping.`);
                continue;
            }

            await apiHelper.addVideoToPlaylist(youtubePlaylistId, videoId);
            await delay(2000); // Wait 2 seconds
            console.log('Added track: ', query);
        }
        console.log('Transfer complete!\n');
        res.json({ message: 'Transfer complete!' });
    } catch (error) {
        console.error('Transfer error log:', error);

        if (error.response && error.response.status === 403 &&
            error.response.data && error.response.data.error &&
            (
                (Array.isArray(error.response.data.error.errors) &&
                    error.response.data.error.errors.some(err => err.reason === 'quotaExceeded')) ||
                (typeof error.response.data.error === 'object' &&
                    error.response.data.error.reason === 'quotaExceeded')
            )) {
            return res.status(429).json({ error: "YouTube API quota exceeded. Please try again later." });
        }

        return res.status(500).json({ error: "A transfer error occurred." });
    }

});


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


console.log("Server setup complete");
app.listen(port, () => {
    console.log(`Server listening at ${config.serverApiUrl}`);
});
