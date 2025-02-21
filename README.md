# SpoTube Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A tool to transfer your Spotify playlists to YouTube.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)

## Introduction

Have you ever wished you could easily move your carefully curated Spotify playlists over to YouTube?  SpoTube Converter makes this process seamless!  This application allows you to transfer your Spotify playlists, complete with track names and artist information, to YouTube, creating new playlists or adding to existing ones.

## Features

- **Playlist Transfer:** Effortlessly transfer entire Spotify playlists to YouTube.
- **Playlist Creation:** Create new YouTube playlists based on your Spotify data.
- **Existing Playlist Addition:** Add tracks from your Spotify playlists to existing YouTube playlists.
- **Track Metadata:** Transfers track names and artist information for accurate YouTube searches.
- **Offset/Skip Tracks:** Start the transfer from a specific track number using the offset feature.
- **User-Friendly Interface:** Simple and intuitive to use.

## Installation

1. **Clone the repository:**

   ```bash
    git clone [https://github.com/JimbosCK/SpoTube-Converter.git](https://github.com/JimbosCK/SpoTube-Converter.git)
   
2. **Navigate to the project directory:**

    ```Bash
    cd SpoTube-Converter
    
3. **Install server-side dependencies:**
    
    ```Bash
    cd server
    npm install

4. **Install client-side dependencies:**

    ```Bash
    cd ../client
    npm install

5. **Set up environment variables (see next section).**

## Usage
1. **Start the development server:**

    ```Bash
    cd server
    npm start  // or node server.js

2. **In a new terminal, start the React development server:**

    ```Bash
    cd ../client
    npm start
    
3. **Open the application in your browser:**

The application should be running at http://localhost:3000 by default.
You can change server and client URLs from the config.js files (remeber to change both the one in root and client directory).

4. **Connect your Spotify and YouTube accounts:**

Follow the on-screen instructions to authorize the application to access your Spotify and YouTube data.

5. **Select a Spotify playlist:**

Choose the Spotify playlist you wish to transfer.

6. **Transfer the playlist:**

If needed you can chose to skip a number of tracks from the list.

The name of the Youtube list that will be created is the same as the one selected from Spotify. If the name already exists in your playlists, it will use this instead (this has to happen so you can add more tracks to your existing playlists).

<b>Click the "Transfer to YouTube" button.</b>

## Environment Variables
Create a .env file in the root directory of your project and add the following environment variables:   
    
    YOUTUBE_CLIENT_ID=<your_youtube_client_id>
    YOUTUBE_CLIENT_SECRET=<your_youtube_client_secret>
    YOUTUBE_REDIRECT_URI=http://localhost:8888/callback  (or your redirect URI)
    SPOTIFY_CLIENT_ID=<your_spotify_client_id>
    SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret>
    SPOTIFY_REDIRECT_URI=http://localhost:8888/callback (or your redirect URI)
    HOMEPAGE_URL=http://localhost:3000
You will need to obtain these credentials from the YouTube Developer Console and the Spotify Developer Dashboard.
