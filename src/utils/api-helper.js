const axios = require('axios'); 

class ApiHelper {
    constructor(config) {
        this.config = config;
    }

    async getSpotifyPlaylist(playlistId) {
        try {
            const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: {
                    Authorization: `Bearer ${this.config.spotifyAccessToken}`, 
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error getting Spotify playlist:", error);
            throw error; 
        }
    }

    async createYoutubePlaylist(playlistData) {
        try {
            const response = await axios.post('https://youtube.googleapis.com/youtube/v3/playlists?part=snippet%2Cstatus', playlistData, {
                headers: {
                    Authorization: `Bearer ${this.config.youtubeAccessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error creating Youtube Playlist:", error);
            throw error;
        }
    }

    // ... other API methods (addVideoToPlaylist, searchYoutube, etc.)
}

module.exports = ApiHelper;