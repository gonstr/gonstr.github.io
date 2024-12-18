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
    const setVersionInternal = () => {
      if (isWithinHours(arrival, 35)) {
        if (version < 2) {
          createSnow();
          showSnow(true);
          setVersion(2);
        }
      }
  
      if (isWithinHours(arrival, 14)) {
        if (version < 3) {
          setVersion(3);
        }
      }
    }

    const interval = setInterval(() => {
      setVersionInternal();
    }, 1000);

    setVersionInternal()

    return () => clearInterval(interval);
  }, [version]);

  return (
    <div className={"App " + (version === 2 ? "background2" : version === 3 ? "background3" : "")}>
      <div className={"background " + (version === 2 ? "dark" : "")}></div>
      <div className="snow" id="snow"></div>
      <Countdown date={arrival} className={version === 3 ? "colored" : ""}/>
      <div className="header">
        {version === 1 ? "🌲 Welcome back Anna! 🌲" : version === 2 ? "Thanks for showing me Austria!" : "✈️ Time to get going! ✈️"}
      </div>
      <div className="text">
        {version === 1 ?
          "I'm so excited to spend Christmas and New Year's together with you (and the cats ;). I'm looking forward to some peaceful days filled with relaxation, fresh air, and you!" : version === 2 ?
          "I had a great time in Austria and can't wait to go back. I loved exploring your home town and Linz, eating delicious food, and spending time with you and your family. Thank you for making me feel at home." :
          "Adventure time! Pack those final things and get on the train! I'm looking forward to making new memories with you in Sweden!"}
      </div>
      <div className="text">
        {version === 1 ? "I hope you have a safe trip and I can't wait to see you again!" : version === 2 ? "I hope you have a safe trip to Sweden and I can't wait to see you again!" : "Have a safe trip and see you at Arlanda very soon!" }
      </div>
      <div className="footer">
        Love, Tom ❤️
      </div>
    </div>
  );
}

export default App;
