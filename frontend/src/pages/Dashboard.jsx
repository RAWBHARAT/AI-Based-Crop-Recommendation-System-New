
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { useLang } from "../utils/useLang";

function Dashboard() {
  const t = useLang();
  const navigate = useNavigate();

  const name = localStorage.getItem("name") || "Farmer";
  const token = localStorage.getItem("token");

  // Dashboard data
  const [weather, setWeather] = useState(null);
  const [mandi, setMandi] = useState([]);
  const [history, setHistory] = useState([]);

  // Independent loading states
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [mandiLoading, setMandiLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Error states
  const [errors, setErrors] = useState({});

  // AI Assistant
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // ===============================
  // LOAD DASHBOARD DATA
  // ===============================

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    let active = true;

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // WEATHER
    async function fetchWeather() {
      try {
        const res = await fetch(
          apiUrl("/api/weather?location=Narsinghpur")
        );

        if (!res.ok) {
          throw new Error(`Weather API error: ${res.status}`);
        }

        const data = await res.json();

        if (active) {
          setWeather(data);
        }
      } catch (error) {
        console.error("Weather error:", error);

        if (active) {
          setErrors((prev) => ({
            ...prev,
            weather: "Weather data unavailable",
          }));
        }
      } finally {
        if (active) setWeatherLoading(false);
      }
    }

    // MANDI PRICES
    async function fetchMandi() {
      try {
        const res = await fetch(
          apiUrl("/api/mandi?location=Narsinghpur")
        );

        if (!res.ok) {
          throw new Error(`Mandi API error: ${res.status}`);
        }

        const data = await res.json();

        if (active) {
          setMandi(data.result || []);
        }
      } catch (error) {
        console.error("Mandi error:", error);

        if (active) {
          setErrors((prev) => ({
            ...prev,
            mandi: "Mandi prices unavailable",
          }));
        }
      } finally {
        if (active) setMandiLoading(false);
      }
    }

    // FARM HISTORY
    async function fetchHistory() {
      try {
        const res = await fetch(
          apiUrl("/api/farm-history"),
          { headers }
        );

        if (!res.ok) {
          throw new Error(`History API error: ${res.status}`);
        }

        const data = await res.json();

        if (active) {
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error("History error:", error);

        if (active) {
          setErrors((prev) => ({
            ...prev,
            history: "Farm history unavailable",
          }));
        }
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    // Run all three requests independently
    fetchWeather();
    fetchMandi();
    fetchHistory();

    return () => {
      active = false;
    };
  }, [token, navigate]);

  // ===============================
  // AI CHAT
  // ===============================

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
        throw new Error(`Chat API error: ${res.status}`);
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

  // ===============================
  // LOGOUT
  // ===============================

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Latest saved recommendation
  const latestRecommendation =
    history.length > 0 ? history[history.length - 1] : null;

  const getRecommendationName = (record) => {
    if (!record) return "No recommendations yet";

    const recommendations = record.recommendations;

    if (Array.isArray(recommendations) && recommendations.length > 0) {
      return recommendations
        .slice(0, 3)
        .map((item) => item.crop || item.name || "Crop")
        .join(", ");
    }

    return (
      record.crop ||
      record.recommendation ||
      record.prediction ||
      "Saved farm record"
    );
  };

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
              {t.welcome || "Welcome back"}, {name} 👋
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Your agricultural overview
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

          {/* WEATHER CARD */}
          <div className="bg-blue-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-blue-800">
              🌤️ Current Weather
            </h2>

            {weatherLoading ? (
              <p className="mt-4 text-blue-700">
                Loading weather...
              </p>
            ) : errors.weather ? (
              <p className="mt-4 text-red-600">
                {errors.weather}
              </p>
            ) : weather ? (
              <div className="mt-4 text-blue-900 space-y-2">
                <p className="text-4xl font-bold">
                  {weather.temperature ?? "--"}°C
                </p>

                <p className="capitalize">
                  {weather.weather || "Condition unavailable"}
                </p>

                <p>
                  Humidity: {weather.humidity ?? "--"}%
                </p>

                <p>
                  Wind: {weather.wind ?? "--"} m/s
                </p>

                <p>
                  Location: {weather.city || "Narsinghpur"}
                </p>

                <p className="text-xs text-blue-700">
                  Updated: {weather.updatedAt || "Latest data"}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-blue-700">
                No weather data available.
              </p>
            )}

            <button
              onClick={() => navigate("/weather")}
              className="mt-5 text-blue-800 font-semibold hover:underline"
            >
              View Weather →
            </button>
          </div>

          {/* MANDI CARD */}
          <div className="bg-yellow-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-yellow-800">
              💰 Latest Mandi Prices
            </h2>

            {mandiLoading ? (
              <p className="mt-4 text-yellow-800">
                Loading mandi prices...
              </p>
            ) : errors.mandi ? (
              <p className="mt-4 text-red-600">
                {errors.mandi}
              </p>
            ) : mandi.length > 0 ? (
              <div className="mt-4 space-y-3">
                {mandi.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="border-b border-yellow-300 pb-2"
                  >
                    <p className="font-semibold text-yellow-900">
                      {item.crop || "Crop"}
                    </p>

                    <p className="text-yellow-800 font-medium">
                      ₹{item.price ?? "N/A"}
                    </p>

                    <p className="text-sm text-yellow-700">
                      {item.market || item.district || "Market unavailable"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-yellow-800">
                No mandi prices available for this location.
              </p>
            )}

            <button
              onClick={() => navigate("/mandi")}
              className="mt-5 text-yellow-900 font-semibold hover:underline"
            >
              View Mandi Prices →
            </button>
          </div>

          {/* RECOMMENDATION CARD */}
          <div className="bg-green-100 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-green-800">
              🌱 Recent Recommendation
            </h2>

            {historyLoading ? (
              <p className="mt-4 text-green-700">
                Loading recommendations...
              </p>
            ) : errors.history ? (
              <p className="mt-4 text-red-600">
                {errors.history}
              </p>
            ) : latestRecommendation ? (
              <div className="mt-4 text-green-900">
                <p className="font-bold text-xl">
                  {getRecommendationName(latestRecommendation)}
                </p>

                <p className="text-sm mt-2">
                  Latest saved farm recommendation
                </p>

                {latestRecommendation.createdAt && (
                  <p className="text-xs mt-2">
                    {latestRecommendation.createdAt}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-green-800">
                No recommendations saved yet.
              </p>
            )}

            <button
              onClick={() => navigate("/recommendation")}
              className="mt-5 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
            >
              Get Crop Recommendation
            </button>
          </div>
        </div>

        {/* FARM ACTIVITY */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              📋 Recent Activity & Recommendations
            </h2>

            <button
              onClick={() => navigate("/farm")}
              className="text-green-700 font-semibold hover:underline"
            >
              View All →
            </button>
          </div>

          {historyLoading ? (
            <p className="text-gray-500">
              Loading farm activity...
            </p>
          ) : errors.history ? (
            <p className="text-red-600">
              {errors.history}
            </p>
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {[...history].reverse().slice(0, 5).map((item, index) => (
                <div
                  key={item.id || item._id || index}
                  className="bg-green-50 border border-green-100 p-4 rounded-lg"
                >
                  <p className="font-semibold text-green-800">
                    🌾 {getRecommendationName(item)}
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    {item.createdAt || item.date || "Saved farm record"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <p>No recent activity found.</p>

              <button
                onClick={() => navigate("/recommendation")}
                className="mt-3 text-green-700 font-semibold hover:underline"
              >
                Generate your first crop recommendation →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI ASSISTANT */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white shadow-2xl rounded-xl p-4 z-50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">
              🤖 AI Agriculture Assistant
            </h2>

            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-red-600"
            >
              ✖
            </button>
          </div>

          <div className="h-64 overflow-y-auto mb-3 border rounded-lg p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-gray-500">
                Ask me about crops, fertilizers, soil health or farming.
              </p>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.sender === "user"
                    ? "text-right"
                    : "text-left"
                }
              >
                <span className="inline-block bg-gray-100 rounded-lg px-3 py-2 text-sm max-w-full break-words">
                  {msg.text}
                </span>
              </div>
            ))}

            {chatLoading && (
              <p className="text-sm text-gray-500">
                AI is thinking...
              </p>
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
            disabled={chatLoading || !input.trim()}
            className="bg-green-700 text-white w-full py-2 rounded-lg hover:bg-green-800 disabled:opacity-50"
          >
            {chatLoading ? "Sending..." : "Send"}
          </button>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-green-700 text-white p-4 rounded-full shadow-lg z-50 hover:bg-green-800"
          title="Open AI Assistant"
        >
          🤖
        </button>
      )}
    </div>
  );
}

export default Dashboard;
