"use client";
import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export function Message({
  activeUsers,
  currentRoomId,
  socket,
}: {
  activeUsers: string[];
  currentRoomId: string;
  socket: Socket | null;
}) {
  const [messages, setMessages] = useState<{
    [key: string]: { socketId: string; message: string }[];
  }>({});
  const [input, setInput] = useState<string>("");

  useEffect(() => {
    if (socket) {
      socket.on(
        "newMessage",
        (data: { currentRoomId: string; message: string }) => {
          if (socket.id) {
            const newMessages = messages[data.currentRoomId]
              ? [
                  ...messages[data.currentRoomId],
                  { socketId: socket.id, message: data.message },
                ]
              : [{ socketId: socket.id, message: data.message }];
            setMessages({ ...messages, [data.currentRoomId]: newMessages });
          }
        }
      );

      return () => {
        socket.off("newMessage");
      };
    }
  }, [socket, messages]);

  const sendMessage = () => {
    if (socket) {
      const messageData = { currentRoomId, message: input };
      socket.emit("newMessage", messageData);
      setInput("");
    }
  };

  return (
    <div className="w-[100%]">
      <div className="flex">
        <p>Active Users: {activeUsers.length}</p>
      </div>
      <p>Messages:</p>
      <ul>
        {messages[currentRoomId]?.map((msg, index) => (
          <li key={`${index}_${msg.socketId}`}>
            {msg.socketId === socket?.id
              ? "You: "
              : `${msg.socketId.substring(0, 2)}: `}{" "}
            {msg.message}
          </li>
        ))}
      </ul>
      <div className="flex">
        <input
          className="rounded-md border border-gray-300 px-2 py-1 text-color-black"
          type="textarea"
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
    </div>
  );
}
