import './App.css';
import Countdown from 'react-countdown';
const { DateTime } = require('luxon');

const arrival = DateTime.fromObject(
  { year: 2024, month: 12, day: 19, hour: 8, minute: 0 },
  { zone: "CET" } // Set timezone to CET
);

const Completionist = () => <span>She's Here!</span>;

function App() {
  return (
    <div className="App">
      <div className="background"></div>
      <div className="header">🌲❤️ Liri goes to Sweden! ❤️🌲</div>
      <Countdown date={arrival}>
        <Completionist />
      </Countdown>
    </div>
  );
}

export default App;
