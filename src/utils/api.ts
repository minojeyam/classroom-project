import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const locationsAPI = {
  getLocations: async () => {
    const res = await axios.get(`${API_BASE_URL}/locations`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  createLocation: async (data: any) => {
    const res = await axios.post(`${API_BASE_URL}/locations`, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  updateLocation: async (id: string, data: any) => {
    const res = await axios.put(`${API_BASE_URL}/locations/${id}`, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  deleteLocation: async (id: string) => {
    const res = await axios.delete(`${API_BASE_URL}/locations/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },
};

export const classesAPI = {
  getClasses: async (params = {}) => {
    const res = await axios.get(API_BASE_URL, {
      params,
      headers: getAuthHeader(),
    });
    return res.data;
  },

  getClassById: async (id: string) => {
    const res = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  createClass: async (data: any) => {
    const res = await axios.post(API_BASE_URL, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  updateClass: async (id: string, data: any) => {
    const res = await axios.put(`${API_BASE_URL}/${id}`, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  deleteClass: async (id: string) => {
    const res = await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  enrollStudent: async (classId: string, studentId: string) => {
    const res = await axios.post(
      `${API_BASE_URL}/${classId}/enroll`,
      { studentId },
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  },
};

export const usersAPI = {
  getUsers: async (params = {}) => {
    const res = await axios.get(API_BASE_URL, {
      params,
      headers: getAuthHeader(),
    });
    return res.data;
  },

  getUserById: async (id: string) => {
    const res = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  approveUser: async (id: string) => {
    const res = await axios.put(
      `${API_BASE_URL}/${id}/approve`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return res.data;
  },

  rejectUser: async (id: string) => {
    const res = await axios.put(
      `${API_BASE_URL}/${id}/reject`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return res.data;
  },

  updateUser: async (id: string, data: any) => {
    const res = await axios.put(`${API_BASE_URL}/${id}`, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },
};
