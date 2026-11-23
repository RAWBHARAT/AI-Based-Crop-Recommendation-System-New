
import React, { useEffect, useState } from "react";
import { apiUrl } from "../utils/api";

function Recommendation() {
  const [soil, setSoil] = useState(null);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    let active = true;

    async function generateRecommendation() {
      if (!token) {
        setError("Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setStatus("Fetching your latest soil report...");

        // STEP 1: FETCH SAVED SOIL DATA
        const soilResponse = await fetch(apiUrl("/api/soil"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const soilData = await soilResponse.json();

        if (!soilResponse.ok) {
          throw new Error(
            soilData.message || "Unable to fetch soil report."
          );
        }

        if (!Array.isArray(soilData) || soilData.length === 0) {
          throw new Error(
            "No soil report found. Please submit your soil details first."
          );
        }

        const latestSoil = soilData[soilData.length - 1];

        if (active) setSoil(latestSoil);

        // STEP 2: PREPARE ML INPUT
        const payload = {
          nitrogen: Number(latestSoil.nitrogen),
          phosphorus: Number(latestSoil.phosphorus),
          potassium: Number(latestSoil.potassium),
          temperature: Number(latestSoil.temperature || 25),
          humidity: Number(latestSoil.humidity || 60),
          ph: Number(latestSoil.ph),
          rainfall: Number(latestSoil.rainfall || 100),
        };

        const requiredFields = [
          "nitrogen",
          "phosphorus",
          "potassium",
          "temperature",
          "humidity",
          "ph",
          "rainfall",
        ];

        for (const field of requiredFields) {
          if (!Number.isFinite(payload[field])) {
            throw new Error(
              `Invalid soil value: ${field}. Please update your soil report.`
            );
          }
        }

        setStatus("Analyzing soil parameters with the ML model...");

        // STEP 3: CALL NODE API -> PYTHON ML SERVICE
        const predictionResponse = await fetch(
          apiUrl("/api/recommend"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const predictionData = await predictionResponse.json();

        console.log("ML INPUT:", payload);
        console.log("ML RESPONSE:", predictionData);

        if (!predictionResponse.ok) {
          throw new Error(
            predictionData.message ||
            predictionData.error ||
            `Prediction failed (${predictionResponse.status})`
          );
        }

        const crops = predictionData.recommendations;

        if (!Array.isArray(crops) || crops.length === 0) {
          throw new Error(
            "The ML service returned no crop recommendations."
          );
        }

        if (active) {
          setResult(crops);
          setStatus("Crop prediction completed successfully.");
        }

        // STEP 4: SAVE RESULT TO FARM HISTORY
        try {
          const historyResponse = await fetch(
            apiUrl("/api/farm-history"),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                soil: latestSoil,
                recommendations: crops,
              }),
            }
          );

          const historyData = await historyResponse.json();

          if (!historyResponse.ok) {
            console.error("History save failed:", historyData);
          } else {
            console.log("Farm history saved:", historyData);
          }
        } catch (historyError) {
          console.error("History save error:", historyError);
        }

      } catch (err) {
        console.error("Recommendation error:", err);

        if (active) {
          setError(err.message || "Unable to generate crop prediction.");
          setResult([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    generateRecommendation();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 p-5 md:p-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-700">
            🌿 AI Crop Recommendation
          </h1>
          <p className="text-gray-600 mt-2">
            Intelligent crop predictions based on your soil parameters.
          </p>
        </div>

        {/* SOIL PARAMETERS */}
        {soil && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🧪 Your Soil Parameters
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["Nitrogen", soil.nitrogen],
                ["Phosphorus", soil.phosphorus],
                ["Potassium", soil.potassium],
                ["pH", soil.ph],
                ["Temperature", soil.temperature],
                ["Humidity", soil.humidity],
                ["Rainfall", soil.rainfall],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-green-50 p-4 rounded-lg"
                >
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className="text-xl font-bold text-green-800">
                    {value ?? "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="bg-blue-50 p-6 rounded-xl mb-6">
            <p className="text-blue-800 font-semibold">
              ⏳ {status || "Generating crop predictions..."}
            </p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 border border-red-300 p-5 rounded-xl mb-6">
            <h2 className="font-bold text-red-800">
              Prediction failed
            </h2>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        )}

        {/* RESULTS */}
        {result.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-green-800">
                🌾 Recommended Crops
              </h2>
              <span className="text-sm text-green-700">
                {result.length} predictions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {result.map((item, index) => (
                <div
                  key={index}
                  className="bg-green-50 border border-green-200 p-5 rounded-xl"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-green-800 capitalize">
                      🌱 {item.crop || item.name || "Recommended crop"}
                    </h3>

                    <span className="bg-green-200 text-green-900 px-3 py-1 rounded-full text-sm">
                      #{index + 1}
                    </span>
                  </div>

                  {item.confidence !== undefined && (
                    <p className="mt-3 text-gray-700">
                      Confidence: {item.confidence}%
                    </p>
                  )}

                  {item.probability !== undefined && (
                    <p className="mt-2 text-gray-700">
                      Probability: {item.probability}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-5">
              Predictions are based on the submitted soil and environmental
              parameters. Verify recommendations with local agricultural
              experts before making cultivation decisions.
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && result.length === 0 && (
          <div className="bg-white p-6 rounded-xl text-center shadow">
            No crop predictions available.
          </div>
        )}

        {status && !loading && !error && (
          <p className="text-green-700 mt-4 font-medium">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

export default Recommendation;
