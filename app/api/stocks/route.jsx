// 0. Install required packages: pnpm i pusher-js chart.js react-chartjs-2

// 1. Import modules
import { NextApiRequest, NextApiResponse } from "next"
const { ChatOpenAI } = require('langchain/chat_models/openai')
import { DynamicStructuredTool } from 'langchain/tools'
import { initializeAgentExecutorWithOptions } from 'langchain/agents'
import z from 'zod'
import Pusher from "pusher"

//instantiate ChatOpenAI model with streaming set to true
  const model = new ChatOpenAI({ temperature: 0, streaming: true })

//initialize Pusher using env config
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
})

//handle incoming POST request
export async function POST(req) {
  // parse JSON content from the request body
  const { message } = await req.json()
  //define a tool for fetching historical stock data
  const fetchHistoricalData = new DynamicStructuredTool ({
    name: "fetchHistoricalData",
    description: "Triggers stock data based on their ticker",
    schema: z.object({
        ticker: z.string(),
    }),
    func: async ({ ticker }) => {
    //API key for accessing stock data
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}`;
      const res = await fetch(url)
      const jsonResponse = await res.json()
    // extract and format stock data
      const data = jsonResponse["Time Series (Daily)"]
      const chartData = Object.entries(data).map(([date, values]) => ({
        date,
        value: parseFloat(values["4. close"]),
      }))
    //Trigger Pusher events for stock data
      pusher.trigger("natural_lang_ui_control", "chart", chartData);
      pusher.trigger("natural_lang_ui_control", "ticker", ticker);

      // Return the latest stock data
      return JSON.stringify(chartData[chartData.length - 1]);
    }
  })
  // Initialize agent executor with tools and model
    const tools = [fetchHistoricalData];
    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "openai-functions",
    });
    //Run the executor with the received message
    const result = await executor.run(message)
    //trigger a pusher event with with execution result
    pusher.trigger("natural_lang_ui_control", "message", result)
}