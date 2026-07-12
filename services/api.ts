import axios from "axios";

const api = axios.create({
  baseURL: "http://54.89.159.148/api",
});

export default api;