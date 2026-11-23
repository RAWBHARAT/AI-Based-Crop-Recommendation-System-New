
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { useLang } from "../utils/useLang";

function Dashboard() {
  const t = useLang();
  const navigate = useNavigate();

  const name = localStorage.getItem("name") || "Farmer";
  const token = localStorage.getItem("token");

  const [weather, setWeather] = useState(null);
  const [mandi, setMandi] = useState([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!token) {
        navigate("/");
        return;
      }

      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const nextErrors = {};

      // WEATHER
      try {
        const res = await fetch(
          apiUrl("/api/weather?location=Narsinghpur"),
          { headers }
        );

        if (!res.ok) {
          throw new Error(`Weather API returned ${res.status}`);
        }

        const data = await res.json();

        if (active) setWeather(data);
      } catch (error) {
        nextErrors.weather = "Weather data unavailable";
        console.error("Weather error:", error);
      }

      // MANDI PRICES
      try {
        const res = await fetch(
          apiUrl("/api/mandi?location=Narsinghpur"),
          { headers }
        );

        if (!res.ok) {
          throw new Error(`Mandi API returned ${res.status}`);
        }

        const data = await res.json();

        if (active) setMandi(data.result || []);
      } catch (error) {
        nextErrors.mandi = "Mandi prices unavailable";
        console.error("Mandi error:", error);
      }

      // FARM HISTORY
      try {
        const res = await fetch(
          apiUrl("/api/farm-history"),
          { headers }
        );

        if (!res.ok) {
          throw new Error(`History API returned ${res.status}`);
        }

        const data = await res.json();

        if (active) setHistory(data.history || []);
      } catch (error) {
        nextErrors.history = "Farm history unavailable";
        console.error("History error:", error);
      }

      if (active) {
        setErrors(nextErrors);
        setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [token, navigate]);

  // AI CHAT
  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const message = input.trim();

    setMessages((prev) => [
      ...prev,
      { text: message, sender: "user" },
    ]);

    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error(`Chat API returned ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          text: data.reply || "No response received.",
          sender: "bot",
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          text: "AI assistant is unavailable. Please try again.",
          sender: "bot",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const latestRecommendation = history.length
    ? history[0]
    : null;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-700">
              📊 {t.dashboard || "Dashboard"}
            </h1>
            <p className="text-gray-600 mt-2">
              {t.welcome || "Welcome"}, {name} 👋
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-100 text-red-700 px-5 py-2 rounded-lg hover:bg-red-200"
          >
            Logout
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* WEATHER */}
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-blue-800">
              🌤️ Current Weather
            </h2>

            {loading ? (
              <p className="mt-3 text-blue-700">Loading weather...</p>
            ) : errors.weather ? (
              <p className="mt-3 text-red-600">{errors.weather}</p>
            ) : weather ? (
              <div className="mt-3 text-blue-900 space-y-2">
                <p className="text-3xl font-bold">
                  {weather.temperature ?? "--"}°C
                </p>
                <p>{weather.weather ?? "Condition unavailable"}</p>
                <p>Humidity: {weather.humidity ?? "--"}%</p>
                <p>Wind: {weather.wind ?? "--"}</p>
                <p className="text-sm">
                  Location: {weather.city || "Narsinghpur"}
                </p>
              </div>
            ) : (
              <p className="mt-3">No weather data available.</p>
            )}
          </div>

          {/* MANDI */}
          <div className="bg-yellow-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-yellow-800">
              💰 Latest Mandi Prices
            </h2>

            {loading ? (
              <p className="mt-3">Loading mandi prices...</p>
            ) : errors.mandi ? (
              <p className="mt-3 text-red-600">{errors.mandi}</p>
            ) : mandi.length > 0 ? (
              <div className="mt-3 space-y-3">
                {mandi.slice(0, 3).map((item, index) => (
                  <div key={index} className="border-b border-yellow-300 pb-2">
                    <p className="font-semibold text-yellow-900">
                      {item.crop || "Crop"}
                    </p>
                    <p className="text-yellow-800">
                      ₹{item.price ?? "N/A"}
                    </p>
                    <p className="text-sm text-yellow-700">
                      {item.market || "Market unavailable"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-yellow-800">
                No mandi prices available.
              </p>
            )}
          </div>

          {/* RECOMMENDATION */}
          <div className="bg-green-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-green-800">
              🌱 Recent Recommendation
            </h2>

            {loading ? (
              <p className="mt-3">Loading recommendation...</p>
            ) : errors.history ? (
              <p className="mt-3 text-red-600">{errors.history}</p>
            ) : latestRecommendation ? (
              <div className="mt-3 text-green-900">
                <p className="font-semibold">
                  {latestRecommendation.crop ||
                    latestRecommendation.recommendation ||
                    latestRecommendation.prediction ||
                    "Saved farm record"}
                </p>
                <p className="text-sm mt-2">
                  Latest saved farm record
                </p>
              </div>
            ) : (
              <p className="mt-3 text-green-800">
                No recommendations saved yet.
              </p>
            )}

            <button
              onClick={() => navigate("/recommendation")}
              className="mt-4 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
            >
              Get Crop Recommendation
            </button>
          </div>
        </div>

        {/* FARM HISTORY */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              📋 Recent Farm Activity
            </h2>

            <button
              onClick={() => navigate("/farm-history")}
              className="text-green-700 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading farm history...</p>
          ) : errors.history ? (
            <p className="text-red-600">{errors.history}</p>
          ) : history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="p-3">Crop / Recommendation</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((item, index) => (
                    <tr key={item._id || index} className="border-b">
                      <td className="p-3 font-medium">
                        {item.crop ||
                          item.recommendation ||
                          item.prediction ||
                          "Farm record"}
                      </td>
                      <td className="p-3 text-gray-600">
                        {item.date
                          ? new Date(item.date).toLocaleDateString()
                          : "Saved record"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No farm activity recorded yet.</p>
              <button
                onClick={() => navigate("/recommendation")}
                className="mt-3 text-green-700 font-semibold hover:underline"
              >
                Generate your first crop recommendation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white shadow-2xl rounded-xl p-4 z-50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">🤖 AI Assistant</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500"
            >
              ✖
            </button>
          </div>

          <div className="h-64 overflow-y-auto mb-3 border rounded-lg p-3 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.sender === "user" ? "text-right" : "text-left"
                }
              >
                <span className="inline-block bg-gray-100 rounded-lg px-3 py-2 text-sm">
                  {msg.text}
                </span>
              </div>
            ))}

            {chatLoading && (
              <p className="text-sm text-gray-500">Thinking...</p>
            )}
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about crops..."
            className="border p-2 w-full mb-2 rounded-lg"
          />

          <button
            onClick={sendMessage}
            disabled={chatLoading}
            className="bg-green-700 text-white w-full py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-green-700 text-white p-4 rounded-full shadow-lg z-50"
        >
          🤖
        </button>
      )}
    </div>
  );
}

export default Dashboard;
