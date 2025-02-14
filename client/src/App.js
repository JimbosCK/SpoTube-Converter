import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Playlists from "./components/Playlists";
import Tracks from "./components/Tracks";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/tracks/:playlistId" element={<Tracks />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
