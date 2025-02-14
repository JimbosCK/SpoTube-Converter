import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="container mx-auto flex justify-between">
                <div className="navbar-brand">SpoTube Converter</div>
                <ul className="navbar-links">
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                isActive ? "navbar-link-active" : "navbar-link"
                            }
                        >
                            Home
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/playlists"
                            className={({ isActive }) =>
                                isActive ? "navbar-link-active" : "navbar-link"
                            }
                        >
                            Playlists
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;