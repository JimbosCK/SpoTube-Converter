import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Playlists.css';
import config from '../config';

function Playlists() {
    const [playlists, setPlaylists] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios
            .get(`${config.serverApiUrl}/playlists`)
            .then((response) => {
                setPlaylists(response.data.items);
            })
            .catch((error) => {
                console.error("Error fetching playlists:", error);
            });
    }, []);

    const handleSelectPlaylist = (playlistId, playlistName) => {
        navigate(`/tracks/${playlistId}`, { state: { playlistName } });
    };

    return (
        <div className="playlists-container"> 
            <h1 className="playlists-title">Your Playlists</h1>
            <ul className="playlists-list"> 
                {playlists.map((playlist) => (
                    <li
                        key={playlist.id}
                        className="playlist-item"
                        onClick={() => handleSelectPlaylist(playlist.id, playlist.name)}
                    >
                        {playlist.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Playlists;
