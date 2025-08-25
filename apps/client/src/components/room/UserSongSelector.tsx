import React, { useState, useEffect } from "react";
import { useRoomStore } from "../../store/room";
import { SongInfo } from "@beatsync/shared/types/room";
import { useGlobalStore } from "../../store/global";
import { sendWSRequest } from "../../utils/ws";

export const UserSongSelector: React.FC = () => {
  const { perUserPlaybackEnabled, setMySong, username, userPlayback, roomId } =
    useRoomStore();
  const { socket, audioSources, connectedClients } = useGlobalStore();
  const [selectedSongUrl, setSelectedSongUrl] = useState<string>("");

  useEffect(() => {
    if (!socket) return;
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data?.type === "ROOM_EVENT" &&
          data.event?.type === "SET_USER_PLAYBACK"
        ) {
          setMySong(data.event.userPlayback[username]);
        }
      } catch {}
    };
  }, [socket, setMySong, username]);

  if (!perUserPlaybackEnabled) return null;

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = e.target.value;
    const audio = audioSources.find((a) => a.url === url);
    if (audio && socket && roomId && username) {
      setSelectedSongUrl(url);
      const song: SongInfo = {
        songId: url,
        url,
        title: url.split("/").pop() || url,
      };
      setMySong(song);
      sendWSRequest({
        ws: socket,
        request: {
          type: "SET_USER_PLAYBACK",
          roomId,
          clientId: username,
          song,
        },
      });
    }
  };

  return (
    <div>
      <h3>Select Your Song</h3>
      <select value={selectedSongUrl} onChange={handleSelect}>
        <option value="">Choose a song...</option>
        {audioSources.map((audio) => (
          <option key={audio.url} value={audio.url}>
            {audio.url.split("/").pop() || audio.url}
          </option>
        ))}
      </select>
      <div style={{ marginTop: 16 }}>
        <h4>Current Songs in Room:</h4>
        <ul>
          {connectedClients.map((client) => {
            const song = userPlayback[client.username];
            return (
              <li key={client.username}>
                <strong>{client.username}:</strong>{" "}
                {song ? song.title : "No song selected"}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
