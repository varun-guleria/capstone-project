import { predictQuestions } from './predictionEngine.js';
import axios from 'axios';

const dummyData = [
    { id: "1", question: "What is a firewall?", year: 2021 },
    { id: "2", question: "Explain the concept of a firewall.", year: 2022 },
    { id: "3", question: "What is the full form of USB?", year: 2023 }
];

async function run() {
    try {
        const result = await predictQuestions(dummyData, 2024);
        console.log("Success! Predictions:", result.predictions.length);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
