"use client";
import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  socketId: string;
  message: string;
}

export function Room() {
  const [rooms, setRooms] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ [roomId: string]: Message[] }>({});
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const [currentRoomId, setCurrentRoomId] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:8081", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      newSocket.close();
    });

    newSocket.on("rooms", (data: string[]) => {
      setRooms(data);
    });

    newSocket.on(
      "newMessage",
      (data: { roomId: string; socketId: string; message: string }) => {
        console.log("New message:", data);
        setMessages((prevMessages) => {
          const roomMessages = prevMessages[data.roomId] || [];
          return {
            ...prevMessages,
            [data.roomId]: [
              ...roomMessages,
              { socketId: data.socketId, message: data.message },
            ],
          };
        });
      }
    );

    newSocket.on("activeUsers", (data: string[]) => {
      setActiveUsers(data);
    });

    newSocket.on("error", (data: { message: string }) => {
      alert(data.message);
    });

    setSocket(newSocket);

    // Clean up event listeners on component unmount
    return () => {
      console.log("Component unmounted, cleaning up WebSocket connection");
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("rooms");
      newSocket.off("newMessage");
      newSocket.off("activeUsers");
      newSocket.off("error");
      newSocket.close();
    };
  }, []);

  const createRoom = () => {
    if (socket && currentRoomId) {
      console.log("Creating room:", currentRoomId);
      socket.emit("createRoom", { roomId: currentRoomId });
      setCurrentRoomId("");
    } else {
      console.log("Socket or roomId is missing");
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket) {
      console.log("Joining room:", roomId);
      socket.emit("joinRoom", { roomId });
      setCurrentRoomId(roomId);
    } else {
      console.log("Socket is missing");
    }
  };

  const sendMessage = () => {
    if (socket && currentRoomId) {
      const messageData = { roomId: currentRoomId, message: input };
      console.log("Sending message:", messageData);
      socket.emit("newMessage", messageData);
      setInput("");
    } else {
      console.log("Socket or roomId is missing");
    }
  };

  console.log("Rooms:", messages);

  return (
    <div className="w-[100%]">
      <div className="flex">
        <input
          className="rounded-md border border-gray-300 px-2 py-1 text-color-black"
          type="text"
          placeholder="Enter room name"
          onChange={(e) => setCurrentRoomId(e.target.value)}
          value={currentRoomId}
        />
        <button
          className="ml-2 border border-gray-300 rounded-md px-2 py-1"
          onClick={createRoom}
        >
          Create Room
        </button>
      </div>
      <div className="flex">
        <p>Available Rooms:</p>
        <ul>
          {rooms.map((room, index) => (
            <li key={index}>
              {room}{" "}
              <button
                className="ml-2 border border-gray-300 rounded-md px-2 py-1"
                onClick={() => joinRoom(room)}
              >
                Join
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex">
        <input
          className="rounded-md border border-gray-300 px-2 py-1 text-color-black"
          type="textarea"
          placeholder="Enter message"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <button
          className="ml-2 border border-gray-300 rounded-md px-2 py-1"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
      <div className="flex">
        <p>Active Users: {activeUsers.length}</p>
      </div>
      <p>Messages:</p>
      <ul>
        {(messages[currentRoomId] || []).map((msg, index) => (
          <li key={`${index}_${msg.socketId}`}>
            {msg.socketId === socket?.id
              ? "You: "
              : `${msg.socketId.substring(0, 2)}: `}{" "}
            {msg.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
