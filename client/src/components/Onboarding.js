// src/components/Tutorial.js
import introJs from "intro.js";
import "intro.js/introjs.css";

const startTutorial = () => {
  introJs().start();
};

const Tutorial = () => <button onClick={startTutorial}>Start Tutorial</button>;

export default Tutorial;
