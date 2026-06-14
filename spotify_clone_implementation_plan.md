# Spotify Backend Clone: 100% Completion Plan

This plan outlines the architecture and logic required to take your Spotify backend from its current state (Authentication & Core Music) to a fully-featured Spotify clone. 

By reviewing this document, you will understand how the new models interact with your existing `user`, `music`, and `album` models.

## User Review Required

> [!IMPORTANT]
> Please review this plan carefully. Once you approve it, I will write the code and explain how each part works so you can learn from the logic.

## Proposed Changes

We will introduce 4 major feature blocks: Playlists, Liked Songs & History, Social Follows, and Search.

---

### 1. Database Schema Updates (User Model)

To support user-specific data like Liked Songs, History, and Followers, we need to add fields to the existing `user.model.js`.

#### [MODIFY] `src/models/user.model.js`
- **Add `likedSongs`**: An array of object IDs referencing the `music` model.
- **Add `followers` and `following`**: Arrays referencing other `user` models to build the social network.
- **Add `history`**: An array referencing the `music` model to track recently played songs.

---

### 2. Playlists

Playlists are a core feature of Spotify. We need a new model and dedicated routes.

#### [NEW] `src/models/playlist.model.js`
- `title` (String, required)
- `description` (String, optional)
- `owner` (ObjectId referencing `user`)
- `musics` (Array of ObjectIds referencing `music`)
- `isPublic` (Boolean, default: true)

#### [NEW] `src/controllers/playlist.controller.js`
Logic to:
- `createPlaylist`: Create a new playlist assigned to the logged-in user.
- `addMusicToPlaylist`: Push a music ID into the playlist's `musics` array.
- `removeMusicFromPlaylist`: Remove a music ID.
- `getUserPlaylists`: Fetch all playlists owned by the logged-in user.
- `getPlaylistById`: Fetch a playlist and populate its songs.

#### [NEW] `src/routes/playlist.routes.js`
- Express routes mapping to the playlist controller functions, protected by `auth.middleware.js`.

---

### 3. User Interactions (Likes, History, Follows)

We need endpoints to let users interact with the app. We will add a new controller for user actions.

#### [NEW] `src/controllers/userAction.controller.js`
Logic to:
- `toggleLikeMusic`: Add/remove a music ID from the user's `likedSongs` array.
- `getLikedSongs`: Return the user's populated `likedSongs`.
- `recordPlayHistory`: Add a music ID to the beginning of the user's `history` array.
- `getHistory`: Return the user's recently played songs.
- `toggleFollowUser`: Add/remove a user ID from the `following` array, and update the target user's `followers` array.

#### [NEW] `src/routes/userAction.routes.js`
- Express routes for `/like/:musicId`, `/history/:musicId`, and `/follow/:userId`.

---

### 4. Search Functionality

Users need a way to search for music and albums.

#### [NEW] `src/controllers/search.controller.js`
Logic to:
- `globalSearch`: Accept a `?q=searchterm` query parameter. Perform a Regex search on `musicModel.find({ title: { $regex: query } })` and `albumModel.find({ title: ... })` and return combined results.

#### [NEW] `src/routes/search.routes.js`
- Route: `GET /` pointing to `globalSearch`.

---

### 5. Application Integration

Finally, we must register all new routes in `app.js`.

#### [MODIFY] `src/app.js`
- Import and use `playlistRoutes`, `userActionRoutes`, and `searchRoutes`.

## Verification Plan

### Manual Verification
1. Start the server (`npm run dev`).
2. We will test the endpoints using Postman or ThunderClient to ensure we can:
   - Create a playlist and add songs to it.
   - "Like" a song and retrieve the liked songs list.
   - Search for a song by its title.
   - Record a song into the user's history.
