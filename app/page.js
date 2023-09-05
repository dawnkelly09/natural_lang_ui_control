"use client";
// 0. Install required packages: pnpm i pusher-js chart.js react-chartjs-2

// 1. Import React and required hooks
import React, { useEffect, useState } from "react";

// 2. Import Pusher for real-time communication
import Pusher from "pusher-js";

// 3. Import required elements and scales for Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// 4. Register elements and scales with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 5. Import Skeleton from Material-UI for loading states

// 6. Import Line chart component from react-chartjs-2
import { Line } from "react-chartjs-2";

// 7. Define the main App component
export default function App() {
  // 8. Define states for chart data, input value, message, ticker, and loading states
  const [chartData, setChartData] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState(null);
  const [ticker, setTicker] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [tickerLoading, setTickerLoading] = useState(false);

  // 9. Define input change handler
  function handleInputChange(event) {
    setInputValue(event.target.value);
  }

  // 10. Define key press handler for sending messages on Enter key
  function handleKeyPress(event) {
    if (event.key === "Enter") {
      sendMessageToServer(inputValue);
      setInputValue("");
    }
  }

  // 11. Define effect to initialize Pusher and set up channels and bindings
  useEffect(() => {
    const pusher = new Pusher("130958e68427c40cd24b", {
      cluster: "us2",
      appId: "1664932",
    });
    const channel = pusher.subscribe("natural_lang_ui_control");

    // 12. Handle received chart data
    channel.bind("chart", (data) => {
      console.log("Received chart data:", data);
      setChartData({
        labels: data.map((item) => item.date),
        timestamp: new Date(),
        datasets: [
          {
            label: "Historic Price",
            data: data.map((item) => item.value),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 1,
          },
        ],
      });
      setChartLoading(false);
    });

    // 13. Handle received message
    channel.bind("message", (message) => {
      console.log("Received message:", message);
      setMessage(message);
      setMessageLoading(false);
    });

    // 14. Handle received ticker
    channel.bind("ticker", (message) => {
      console.log("Received ticker:", message);
      setTicker(message);
      setTickerLoading(false);
    });

    // 15. Cleanup by unbinding and unsubscribing
    return () => {
      channel.unbind("chart");
      channel.unbind("message");
      pusher.unsubscribe("natural_lang_ui_control");
    };
  }, []);

  // 16. Define function to send messages to the server
  async function sendMessageToServer(message) {
    setChartLoading(true);
    setChartData(null);
    setMessageLoading(true);
    setMessage(null);
    setTickerLoading(true);
    setTicker(null);
    try {
      // 17. Send request to server
      const response = await fetch("/api/stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (response.ok) {
        console.log("Message sent successfully");
      } else {
        console.error("Error sending message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  // 18. Define and return JSX for rendering the component
  return (
    <div className="">
      <div className="">
        {/* 19. Ticker section, displaying a loading skeleton or the ticker */}
        <div className="">
          {tickerLoading ? (
            <div className=""></div>
          ) : (
            ticker && <h1 className="">{ticker}</h1>
          )}
        </div>
        {/* 20. Chart section, displaying a loading skeleton or the Line chart */}
        <div className="">
          {chartLoading ? (
            <div className=""></div>
          ) : (
            chartData && <Line data={chartData} />
          )}
        </div>
        {/* 21. Message section, displaying a loading skeleton or the received message */}
        <div className="">
          {messageLoading ? (
            <div className=""></div>
          ) : (
            message && <h3 className="">{message}</h3>
          )}
        </div>
        {/* 22. Input section with a text input field and submit button */}
        <div className="">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className=""
          />
          <button
            onClick={() => sendMessageToServer(inputValue)}
            className=""
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}