import { useEffect, useState } from 'react';
import './App.css';
import Countdown from 'react-countdown';
import { createSnow, showSnow } from "pure-snow.js";
const { DateTime } = require('luxon');

const arrival = DateTime.fromObject(
  { year: 2024, month: 12, day: 19, hour: 8, minute: 0 },
  { zone: "CET" } // Set timezone to CET
);

function isWithinHours(targetDate, hours) {
  const now = DateTime.now();
  const timeDifference = targetDate.diff(now, ["hours", "minutes", "seconds"]).toObject();
  return timeDifference.hours < hours && timeDifference.hours >= 0;
}

function App() {
  const [version, setVersion] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isWithinHours(arrival, 35)) {
        if (version < 2) {
          createSnow();
          showSnow(true);
          setVersion(2);
        }
      }
    }, 1000);

      return () => clearInterval(interval);
    }, [version]);

  return (
    <div className={"App " + (version === 2 ? "background2" : "")}>
      <div className={"background " + (version === 2 ? "dark" : "")}></div>
      <div className="snow" id="snow"></div>
      <Countdown date={arrival}/>
      <div className="header">
        {version === 1 ? "🌲 Welcome back Anna! 🌲" : "🇦🇹 Thanks for showing me Austria! 🇦🇹"}
      </div>
      <div className="text">
        {version === 1 ? "I'm so excited to spend Christmas and New Year's together with you (and the cats ;). I'm looking forward to some peaceful days filled with relaxation, fresh air, and you!" : "I had a great time in Austria. I loved exploring Altenberg and Linz, eating delicious food, and spending time with you and your family. Thank you for showing me around and making me feel at home."}
      </div>
      <div className="text">
        {version === 1 ? "I hope you have a safe trip and I can't wait to see you again!" : "I hope you have a safe trip to Sweden and I can't wait to see you again!"}
      </div>
      <div className="footer">
        Love, Tom ❤️
      </div>
    </div>
  );
}

export default App;
