import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api', // or your deployed backend
  withCredentials: true, // if using cookies
});
