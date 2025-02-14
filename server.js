const express = require('express');
const bodyParser = require('body-parser');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
const { google } = require('googleapis');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); 
console.log("Dotenv loaded");
const config = require('./config');


const app = express();
const port = config.serverApiUrl.substring(config.serverApiUrl.lastIndexOf(":") + 1);

app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

console.log("Starting server...");
app.use(cors());
app.use(express.json());

const youtube = google.youtube('v3');

const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);
const youtubeScopes = ['https://www.googleapis.com/auth/youtube']; // Add other scopes as needed

app.get('/youtube/login', (req, res) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Important for refresh tokens
        scope: youtubeScopes,

    });
    res.redirect(authorizeUrl);
});

app.get('/youtube/callback', (req, res) => {
    const code = req.query.code;

    oauth2Client.getToken(code, (err, token) => {
        if (err) {
            console.error('Error getting YouTube tokens:', err);
            return res.status(500).send('Error getting tokens');
        }

        // (This is NOT secure for production)
        youtubeTokens = token;
        oauth2Client.setCredentials(token);

        res.redirect(config.homepageURL);
    });
});


const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URL
});


app.get('/spotify/login', (req, res) => {
    const scopes = ['user-read-private', 'playlist-read-private'];
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/spotify/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;

    if (error) {
        console.error("Error: ", error);
        res.send("Error: ${error}");
        return;
    }

    spotifyApi.authorizationCodeGrant(code).then(
        data => {
            const accessToken = data.body['access_token'];
            const refreshToken = data.body['refresh_token'];
            const expiresIn = data.body['expires_in'];

            spotifyApi.setAccessToken(accessToken);
            spotifyApi.setRefreshToken(refreshToken);

            res.redirect(config.homepageURL);

            setInterval(async () => {
                console.log("REFRESHING TOKEN");
                const data = await spotifyApi.refreshAccessToken();
                const accessTokenRefreshed = data.body['access_token'];
                spotifyApi.setAccessToken(accessTokenRefreshed);
            }, expiresIn / 2 * 1000);
            console.log
        }).catch(error => {
            console.error('Error', error);
            res.send('Error getting token');
        });
});

app.get('/playlists', (req, res) => {

    spotifyApi.getUserPlaylists()
        .then(function (data) {
            res.json(data.body);
        }, function (err) {
            console.log('Error: Failed fetching playlists!', err);
            res.status(500).send('Error fetching playlists.');
        });
});


app.get('/tracks', (req, res) => {
    const playlistId = req.query.playlistId;
    const offset = parseInt(req.query.offset) || 0;
    const limit = 100;
    spotifyApi.getPlaylistTracks(playlistId, {
        fields: 'items',
        limit: limit,
        offset: offset * limit

    })
        .then(
            function (data) {
                res.json(data.body);
            },
            function (err) {
                console.log('Error: Failed fetching tracks!', err);
                res.status(500).send('Error fetching tracks.');
            }
        );
});

app.post('/transfer', async (req, res) => {
    var { playlistName, spotifyTracks, offset } = req.body;
    const auth = oauth2Client;
    console.log("Starting transfer...");

    if (playlistName === undefined) {
        playlistName = "SpoTube Playlist";
    }

    try {
        let youtubePlaylistId;
        const existingPlaylist = await findExistingPlaylist(auth, playlistName);

        if (existingPlaylist) {
            youtubePlaylistId = existingPlaylist.id;
            console.log('Using existing playlist: ', playlistName, " - ", existingPlaylist.id);
        } else {
            youtubePlaylistId = await createYoutubePlaylist(auth, playlistName);
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
            const videoId = await searchYoutubeVideo(auth, query);

            if (!videoId) {
                console.warn(`No video found for: ${query}. Skipping.`);
                continue;
            }

            await addVideoToPlaylist(auth, youtubePlaylistId, videoId);
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

async function findExistingPlaylist(auth, playlistName) {
    try {
        let nextPageToken;
        do {
            const response = await youtube.playlists.list({
                auth: auth,
                part: 'id,snippet',
                mine: true,
                pageToken: nextPageToken 
            });

            if (response.data.items) {
                for (const playlist of response.data.items) {
                    if (playlist.snippet.title === playlistName) { 
                        return playlist; 
                    }
                }
            }

            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken); 

        return null;

    } catch (error) {
        console.error("Error finding existing playlist.");
        return null;
    }
}

async function createYoutubePlaylist(auth, playlistName) {
    const res = await youtube.playlists.insert({
        auth: auth,
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title: playlistName,
                description: 'Playlist created by SpoTube Converter',
            },
            status: {
                privacyStatus: 'private',
            },
        },
    });
    return res.data.id;
}

async function searchYoutubeVideo(auth, query) {
    const res = await youtube.search.list({
        auth: auth,
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 1,
    });
    return res.data.items[0].id.videoId;
}

async function addVideoToPlaylist(auth, playlistId, videoId) {
    const res = await youtube.playlistItems.insert({
        auth: auth,
        part: 'snippet',
        requestBody: {
            snippet: {
                playlistId: playlistId,
                resourceId: {
                    videoId: videoId,
                    kind: 'youtube#video'
                }
            }
        }
    });
    return res.data;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


console.log("Server setup complete");
app.listen(port, () => {
    console.log(`Server listening at ${config.serverApiUrl}`);
});
