import { useEffect, useState } from 'react';
import './App.css';
import Countdown from 'react-countdown';
import { createSnow, showSnow } from "pure-snow.js";
const { DateTime } = require('luxon');

const arrival = DateTime.fromObject(
  { year: 2025, month: 12, day: 26, hour: 8, minute: 0 },
  { zone: "CET" } // Set timezone to CET
);

function App() {
  createSnow();
  showSnow(true);

  return (
    <div className={"App"}>
      <div className={"background"}></div>
      <div className="snow" id="snow"></div>
      <Countdown date={arrival} className={"colored"}/>
      <div className="header">
        {"Welcome back to New Years in Sweden!"}
      </div>
      <div className="text">
        {"Looking forward to you coming here again :) Lets (try) to have a relaxing week, eat good food, go for nice walkies and watch some darts! (Lets go MVG!)"}
      </div>
      <div className="text">
        {"See you soon!" }
      </div>
      <div className="footer">
        Love, Tom ❤️
      </div>
    </div>
  );
}

export default App;
