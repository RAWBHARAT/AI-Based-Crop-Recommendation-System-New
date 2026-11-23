
import { apiUrl } from "../utils/api";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../utils/useLang";

function Dashboard() {
  const t = useLang();
  const navigate = useNavigate();
  const name = localStorage.getItem("name");
  const token = localStorage.getItem("token");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [weather, setWeather] = useState("Loading...");
  const [mandi, setMandi] = useState("Loading...");
  const [recommendation, setRecommendation] = useState("Loading...");


useEffect(() => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  async function loadDashboard() {
    // Weather
    try {
      const res = await fetch(
        apiUrl("/api/weather?location=Narsinghpur"),
        { headers }
      );

      if (!res.ok) throw new Error("Weather unavailable");

      const data = await res.json();

      setWeather(
        `${data.temperature}°C | ${data.weather} | Humidity: ${data.humidity}%`
      );
    } catch (err) {
      setWeather("Weather unavailable");
      console.error("Weather error:", err);
    }

    // Mandi prices
    try {
      const res = await fetch(
        apiUrl("/api/mandi?location=Narsinghpur"),
        { headers }
      );

      if (!res.ok) throw new Error("Mandi unavailable");

      const data = await res.json();
      const prices = data.result || [];

      setMandi(
        prices.length
          ? prices.slice(0, 3).map(
              (item) => `${item.crop}: ₹${item.price} (${item.market})`
            ).join(" | ")
          : "No mandi prices available"
      );
    } catch (err) {
      setMandi("Mandi prices unavailable");
      console.error("Mandi error:", err);
    }

    // Recent recommendation / farm history
    try {
      const res = await fetch(
        apiUrl("/api/farm-history"),
        { headers }
      );

      if (!res.ok) throw new Error("History unavailable");

      const data = await res.json();
      const history = data.history || [];

      setRecommendation(
        history.length
          ? JSON.stringify(history[0])
          : "No recommendations yet"
      );
    } catch (err) {
      setRecommendation("Recommendations unavailable");
      console.error("History error:", err);
    }
  }

  loadDashboard();
}, [token]);
     { headers }
    
  const sendMessage = async () => {
    if (!input.trim()) return;

    const message = input;
    setMessages((prev) => [
      ...prev,
      { text: message, sender: "user" },
    ]);

    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { text: data.reply || "No response received", sender: "bot" },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "AI assistant is unavailable.", sender: "bot" },
      ]);
    }

    setInput("");
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">
            📊 {t.dashboard}
          </h1>
          <div>
            <p className="text-gray-600">
              {t.welcome} {name} 👋
            </p>
            <button onClick={logout} className="text-red-600 text-sm">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-blue-700">
              Current Weather
            </h2>
            <p className="text-blue-600 mt-2 break-words">{weather}</p>
          </div>

          <div className="bg-yellow-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-yellow-700">
              Latest Mandi Prices
            </h2>
            <p className="text-yellow-700 mt-2 break-words">{mandi}</p>
          </div>

          <div className="bg-green-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-green-700">
              Recent Recommendation
            </h2>
            <p className="text-green-700 mt-2 break-words">
              {recommendation}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">
            Recent Activity & Recommendations
          </h2>
          <div className="min-h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 p-4">
            {recommendation}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-white shadow-xl rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold">🤖 AI Assistant</h2>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="h-40 overflow-y-auto mb-2 border p-2 rounded">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-1 ${
                  msg.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <span className="px-2 py-1 rounded bg-gray-200">
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about crops..."
            className="border p-2 w-full mb-2 rounded"
          />

          <button
            onClick={sendMessage}
            className="bg-green-600 text-white w-full py-2 rounded"
          >
            Send
          </button>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg"
        >
          🤖
        </button>
      )}
    </div>
  );
}

export default Dashboard;
