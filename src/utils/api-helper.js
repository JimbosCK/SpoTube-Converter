const { google } = require('googleapis');

class ApiHelper {
    constructor(config) {
        this.config = config;

    }

    setup(){
        this.spotifySetup();
        this.youtubeSetup();
    }

    youtubeSetup(){
        this.oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        this.youtube = google.youtube('v3');
        this.youtubeScopes = ['https://www.googleapis.com/auth/youtube']; // Add other scopes as needed
    }

    spotifySetup(){
        console.log("soit");
    }

    // Sporify Methods


    // Youtube Methods
    youtubeCredentials(req, res){
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

    generateYTAuthUrl(){
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Important for refresh tokens
            scope: this.youtubeScopes,
    
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