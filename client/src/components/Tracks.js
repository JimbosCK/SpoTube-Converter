import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import './Tracks.css';
import config from '../config';

function Tracks() {
    const toPlaylists = () => {
        console.log(config.homepageURL);
        window.location.href = `${config.homepageURL}/playlists`;
    };

    const [offset, setOffset] = useState(0);
    const [paginationOffset, setPaginationOffset] = useState(0);
    const [hasMoreTracks, setHasMoreTracks] = useState(false);

    const { playlistId } = useParams();
    const [tracks, setTracks] = useState([]);
    const location = useLocation();

    const playlistName = location.state?.playlistName || "Unknown Playlist";

    const handleOffsetChange = (event) => {
        let value = parseInt(event.target.value, 10);
        if (isNaN(value)) {
            value = 0;
        }

        // Keep offset within the valid range (0 to tracks.length -1)
        const maxOffset = tracks.length > 0 ? tracks.length - 1 : 0;
        value = Math.min(value, maxOffset); // Ensure offset is not greater than max
        value = Math.max(value, 0) // Ensure offset is not smaller than 0

        setOffset(value);
    };

    useEffect(() => {
        fetchTracks();
    }, [playlistId, paginationOffset]);

    const fetchTracks = () => {
        axios
            .get(`${config.serverApiUrl}/tracks?playlistId=${playlistId}&offset=${paginationOffset}`)
            .then((response) => {
                setTracks(response.data.items);
                setHasMoreTracks(response.data.items.length === 100);
            })
            .catch((error) => {
                console.error("Error fetching tracks:", error);
            });
    };

    const handleNextPage = () => {
        setOffset(0);
        setPaginationOffset(paginationOffset + 1);
    };

    const handlePrevPage = () => {
        setOffset(0);
        setPaginationOffset(paginationOffset - 1);
    };

    const handleTransfer = async () => {
        const confirmTransfer = window.confirm("Are you sure you want to transfer this playlist to YouTube?");
        if (confirmTransfer) {
            try {
                const response = await axios.post(`${config.serverApiUrl}/transfer`, {
                    playlistName: playlistName,
                    spotifyTracks: tracks,
                    offset: offset
                });
                alert(response.data.message);
            } catch (error) {
                alert(error.response.data.error);
                console.error(error);
            }
        }
    };

    return (
        <div className="tracks-container">
            <div className='tracks-buttons'>
                <button
                    onClick={toPlaylists}
                    className="back-button"
                >
                    Back to playlist list
                </button>
                <button
                    onClick={handleTransfer}
                    className="transfer-button"
                >Transfer to YouTube</button>
            </div>
            <div className="offset-container">
                <label htmlFor="offset-input">Skip ahead by this many tracks:</label>
                <input
                    type="number"
                    id="offset-input"
                    value={offset}
                    onChange={handleOffsetChange}
                    className="offset-input"
                    min="0"
                    placeholder="e.g., 10"
                />
            </div>
            <h1 className="tracks-title">{playlistName}</h1>
            <h2 className="tracks-title">({tracks.length})</h2>
            <div className="pagination-buttons"> {/* Pagination buttons container */}
                <button onClick={handlePrevPage} disabled={paginationOffset === 0}>
                    Previous Page
                </button>
                <button onClick={handleNextPage} disabled={!hasMoreTracks}>
                    Next Page
                </button>
            </div>
            <ol className="tracks-list">
                {tracks.map((track, index) => (
                    <li key={index} className="track-item">
                        {index + 1}. {/* Add the number here */}
                        <span className="track-name">{track.track.name}</span> -&nbsp;
                        <span className="track-artist"> {track.track.artists[0].name}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export default Tracks;
