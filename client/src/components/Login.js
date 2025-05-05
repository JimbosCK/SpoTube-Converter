import React from "react";
import './Login.css';
import config from '../config';

function Login() {
    const handleSpotifyLogin = () => {
        window.location.href = `${config.serverApiUrl}/spotify/login`;
    };

    const handleYoutubeLogin = () => {
        window.location.href = `${config.serverApiUrl}/youtube/login`;
    };

    return (
        <div className="login-container">
            <div className="intro-text">
                <h1>SpoTube Converter</h1>
                <p>Effortlessly transfer your Spotify playlists to YouTube.</p>
                <p>Log in with your Spotify and YouTube accounts to begin.</p> 
            </div>
            <div className="login-buttons">
                <button
                    onClick={handleSpotifyLogin}
                    className="spotify-button"
                >
                    Login to Spotify
                </button>
                <button
                    onClick={handleYoutubeLogin}
                    className="youtube-button" 
                >
                    Login to YouTube
                </button>
            </div>
        </div>
    );
}

export default Login;
