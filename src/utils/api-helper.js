const { google } = require('googleapis');
const SpotifyWebApi = require('spotify-web-api-node');

class ApiHelper {
    constructor(config) {
        this.config = config;

    }

    setup() {
        this.spotifySetup();
        this.youtubeSetup();
    }

    youtubeSetup() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        this.youtube = google.youtube('v3');
        this.youtubeScopes = ['https://www.googleapis.com/auth/youtube']; // Add other scopes as needed
    }

    spotifySetup() {
        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: process.env.SPOTIFY_REDIRECT_URL
        });
    }

    // Sporify Methods
    generateSpotifyAuthUrl() {
        const scopes = ['user-read-private', 'playlist-read-private'];
        return this.spotifyApi.createAuthorizeURL(scopes);
    }

    spotifyCredentials(req, res) {
        const error = req.query.error;
        const code = req.query.code;

        if (error) {
            console.error("Error: ", error);
            res.send("Error: ${error}");
            return;
        }

        this.spotifyApi.authorizationCodeGrant(code).then(
            data => {
                const accessToken = data.body['access_token'];
                const refreshToken = data.body['refresh_token'];
                const expiresIn = data.body['expires_in'];

                this.spotifyApi.setAccessToken(accessToken);
                this.spotifyApi.setRefreshToken(refreshToken);

                res.redirect(this.config.homepageURL);

                setInterval(async () => {
                    console.log("REFRESHING TOKEN");
                    const data = await this.spotifyApi.refreshAccessToken();
                    const accessTokenRefreshed = data.body['access_token'];
                    this.spotifyApi.setAccessToken(accessTokenRefreshed);
                }, expiresIn / 2 * 1000);
                console.log
            }).catch(error => {
                console.error('Error', error);
                res.send('Error getting token');
            });
    }

    getSpotifyPlaylists(res) {
        this.spotifyApi.getUserPlaylists()
            .then(function (data) {
                res.json(data.body);
            }, function (err) {
                console.log('Error: Failed fetching playlists!', err);
                res.status(500).send('Error fetching playlists.');
            });
    }

    getSpotifyTracks(req, res) {
        const playlistId = req.query.playlistId;
        const offset = parseInt(req.query.offset) || 0;
        const limit = 100;
        this.spotifyApi.getPlaylistTracks(playlistId, {
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
    }

    // Youtube Methods
    generateYTAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Important for refresh tokens
            scope: this.youtubeScopes,

        });
    }

    youtubeCredentials(req, res) {
        const code = req.query.code;

        this.oauth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error getting YouTube tokens:', err);
                return res.status(500).send('Error getting tokens');
            }

            // (This is NOT secure for production)
            this.youtubeTokens = token;
            this.oauth2Client.setCredentials(token);

            res.redirect(this.config.homepageURL);
        });
    }

    async findExistingPlaylist(playlistName) {
        try {
            let nextPageToken;
            do {
                const response = await this.youtube.playlists.list({
                    auth: this.oauth2Client,
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

    async createYoutubePlaylist(playlistName) {
        const res = await this.youtube.playlists.insert({
            auth: this.oauth2Client,
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

    async searchYoutubeVideo(query) {
        const res = await this.youtube.search.list({
            auth: this.oauth2Client,
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: 1,
        });
        return res.data.items[0].id.videoId;
    }

    async addVideoToPlaylist(playlistId, videoId) {
        const res = await this.youtube.playlistItems.insert({
            auth: this.oauth2Client,
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

}

module.exports = ApiHelper;