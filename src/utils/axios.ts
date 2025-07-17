import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      const token = parsedUser.tokens?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Token sent:", token);
      } else {
        console.log("No accessToken found in user.tokens");
      }
    } else {
      console.log("No user found in localStorage");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
