import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const getAuthHeader = (token?: string) => {
  const jwt = token || localStorage.getItem("token");
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
};

// Locations API
export const locationsAPI = {
  getLocations: async (token?: string) => {
    const res = await axios.get(`${API_BASE_URL}/locations`, {
      headers: getAuthHeader(token),
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

// Classes API
export const classesAPI = {
  getClasses: async (params = {}, token?: string) => {
    const res = await axios.get(`${API_BASE_URL}/classes`, {
      params,
      headers: {
        ...getAuthHeader(token),
      },
    });
    return res.data;
  },

  getClassById: async (id: string, token?: string) => {
    const res = await axios.get(`${API_BASE_URL}/classes/${id}`, {
      headers: {
        ...getAuthHeader(token),
      },
    });
    return res.data;
  },

  createClass: async (data: any, token?: string) => {
    const res = await axios.post(`${API_BASE_URL}/classes`, data, {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  updateClass: async (id: string, data: any, token?: string) => {
    const res = await axios.put(`${API_BASE_URL}/classes/${id}`, data, {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  deleteClass: async (id: string, token?: string) => {
    const res = await axios.delete(`${API_BASE_URL}/classes/${id}`, {
      headers: {
        ...getAuthHeader(token),
      },
    });
    return res.data;
  },

  enrollStudent: async (classId: string, studentId: string, token?: string) => {
    const res = await axios.post(
      `${API_BASE_URL}/classes/${classId}/enroll`,
      { studentId },
      {
        headers: {
          ...getAuthHeader(token),
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params = {}, token?: string) => {
    const res = await axios.get(`${API_BASE_URL}/users`, {
      params,
      headers: getAuthHeader(token),
    });
    return res.data;
  },

  getUserById: async (id: string) => {
    const res = await axios.get(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  approveUser: async (id: string) => {
    const res = await axios.put(
      `${API_BASE_URL}/users/${id}/approve`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return res.data;
  },

  rejectUser: async (id: string) => {
    const res = await axios.put(
      `${API_BASE_URL}/users/${id}/reject`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return res.data;
  },

  updateUser: async (id: string, data: any) => {
    const res = await axios.put(`${API_BASE_URL}/users/${id}`, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await axios.delete(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },
};
