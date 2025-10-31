import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/*
  By default the client tries to connect to http://localhost:5000
  If your backend is hosted elsewhere, set REACT_APP_SOCKET_URL before starting frontend:
    REACT_APP_SOCKET_URL=https://your-backend.com
*/

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

function App() {
  const [socket, setSocket] = useState(null);
  const [name, setName] = useState("");
  const [enteredName, setEnteredName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { autoConnect: false, transports: ['websocket','polling'] });
    setSocket(s);

    // cleanup on unmount
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // When any chat message arrives
    socket.on("chat message", (payload) => {
      setMessages((prev) => [...prev, payload]);
    });

    // Connect the socket once handlers are attached
    socket.connect();

    return () => {
      socket.off("chat message");
    };
  }, [socket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Set user name and notify server
  const handleSetName = () => {
    if (!name.trim()) return;
    setEnteredName(name.trim());
    socket.emit("join", name.trim());
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    socket.emit("chat message", message.trim());
    setMessage("");
  };

  return (
    <div className="page">
      <h1>Real-Time Chat</h1>

      <div className="chat-wrapper">
        <div className="chat-panel">
          <input
            className="name-input"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSetName();
            }}
          />
          <button onClick={handleSetName}>Set Name</button>

          <div className="message-box" ref={messagesRef}>
            {messages.map((m, i) => (
              <div className="message" key={i}>
                <b>{m.name}</b> <span className="time">[{m.time}]</span>: {m.message}
              </div>
            ))}
          </div>

          <form className="send-form" onSubmit={handleSend}>
            <input
              className="msg-input"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="send-btn">Send</button>
          </form>
        </div>
      </div>

      <div className="footer">
        <small>
          {enteredName ? `You are: ${enteredName}` : "Set your name to join the chat"}
        </small>
      </div>
    </div>
  );
}

export default App;
