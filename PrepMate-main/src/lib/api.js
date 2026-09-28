import axios from 'axios';

// Get the API URL from environment variables. Vite exposes variables from
// .env files through `import.meta.env` with the `VITE_` prefix.
//
// - For local development, this will be 'http://localhost:5000' from your .env file.
// - For production, this will be the URL of your deployed backend, set in Netlify.
const API_URL = import.meta.env.VITE_API_URL;

// Create a reusable Axios instance with the base URL pre-configured.
const api = axios.create({
  baseURL: API_URL,
});

export default api;