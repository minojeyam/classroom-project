import API from "./axios";

export const getAuthHeader = () => {
  const tokens = localStorage.getItem("tokens");
  const jwt = tokens ? JSON.parse(tokens).accessToken : null;
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
};

// LOCATIONS
export const locationsAPI = {
  getLocations: async (token: string | undefined) => {
    const res = await API.get("/locations", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  },

  createLocation: async (data: any) => {
    const res = await API.post("/locations", data);
    return res.data;
  },

  updateLocation: async (id: string, data: any) => {
    const res = await API.put(`/locations/${id}`, data);
    return res.data;
  },

  deleteLocation: async (id: string) => {
    const res = await API.delete(`/locations/${id}`);
    return res.data;
  },



  /** ✅ NEW: Get Location Status Overview */
  locationOverview: async (token?: string) => {
    const res = await API.get("/locations/stats/overview", {
      headers: token ? { Authorization: `Bearer ${token}` } : getAuthHeader(),
    });
    return res.data;
  },

};

// CLASSES
export const classesAPI = {
  // getClasses: async (params = {}) => {
  //   const res = await API.get("/classes", { params });
  //   return res.data;
  // },

  getClasses: async (params = {}, token: string | undefined) => {
    const res = await API.get("/classes", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },


  // getClassById: async (id: string) => {
  //   const res = await API.get(`/classes/${id}`);
  //   return res.data;
  // },

  getClassById: async (id: string, token: string) => {
    const res = await API.get(`/classes/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },



  // createClass: async (data: any) => {
  //   const res = await API.post("/classes", data);
  //   return res.data;
  // },

  createClass: async (data: any, token: string) => {
    const res = await API.post(`/classes`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return res.data
  },

  // updateClass: async (id: string, data: any) => {
  //   const res = await API.put(`/classes/${id}`, data);
  //   return res.data;
  // },

  updateClass: async (id: string, data: any, token: string) => {
    const res = await API.put(`/classes/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },


  deleteClass: async (id: string, token: string) => {
    const res = await API.delete(`/classes/${id}`, {
      headers: {
        Authorization: `Brearer ${token}`
      }
    });
    return res.data;
  },

  enrollStudent: async (classId: string, studentId: string) => {
    const res = await API.post(`/classes/${classId}/enroll`, { studentId });
    return res.data;
  },

  getMaterials: async () => {
    const res = await API.get("/materials/student");
    return res.data;
  },

  /** ✅ NEW: Get Classes Status Overview */

  classOverview: async (token?: string) => {
    const res = await API.get("/classes/stats/overview", {
      headers: token ? { Authorization: `Bearer ${token}` } : getAuthHeader(),
    });
    return res.data;
  },
};

// USERS
export const usersAPI = {
  getUsers: async (params = {}, token?: string) => {
    const res = await API.get("/users", {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  getUserById: async (id: string) => {
    const res = await API.get(`/users/${id}`);
    return res.data;
  },

  approveUser: async (id: string) => {
    const res = await API.put(`/users/${id}/approve`, {});
    return res.data;
  },

  rejectUser: async (id: string) => {
    const res = await API.put(`/users/${id}/reject`, {});
    return res.data;
  },

  updateUser: async (id: string, data: any) => {
    const res = await API.put(`/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await API.delete(`/users/${id}`);
    return res.data;
  },

  /** NEW: Get Users Status Overview */
  getStatusOverview: async (token?: string) => {
    const res = await API.get("/users/stats/overview", {
      headers: token ? { Authorization: `Bearer ${token}` } : getAuthHeader(),
    });
    return res.data;
  },


  /** NEW: Get Pending Approvals Stats */
  getPendingApprovals: async (token?: string) => {
    const res = await API.get("/users/stats/pending-approvals", {
      headers: token ? { Authorization: `Bearer ${token}` } : getAuthHeader(),
    });
    return res.data;
  },

};

// NOTICES
export const noticesAPI = {
  getNotices: async () => {
    const res = await API.get("/notices");
    return res.data;
  },

  createNotice: async (data: any) => {
    const res = await API.post("/notices", data);
    return res.data;
  },

  updateNotice: async (id: string, data: any) => {
    const res = await API.put(`/notices/${id}`, data);
    return res.data;
  },

  deleteNotice: async (id: string) => {
    const res = await API.delete(`/notices/${id}`);
    return res.data;
  },

  acknowledgeNotice: async (id: string) => {
    const res = await API.post(`/notices/${id}/acknowledge`);
    return res.data;
  },
};

// FEES
export const feesAPI = {
  getStudentFees: async () => {
    const res = await API.get("/fees/student", {
      headers: getAuthHeader(),
    });
    return res.data.data;
  },
};

// MATERIALS
export const materials = {
  create: async (data: Record<string, any>) => {
    const res = await API.post("/materials", data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  getAll: async () => {
    const res = await API.get("/materials", {
      headers: {
        ...getAuthHeader(),
      },
    });
    return res.data;
  },

  update: async (id: string, data: Record<string, any>) => {
    const res = await API.put(`/materials/${id}`, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await API.delete(`/materials/${id}`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    return res.data;
  },
};

// SCHDULE CLASS
export const schedulesAPI = {
  create: async (data: Record<string, any>) => {
    const res = await API.post("/schedules", data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  getAll: async (params: Record<string, any> = {}) => {
    const res = await API.get("/schedules", {
      headers: {
        ...getAuthHeader(),
      },
      params,
    });
    return res.data;
  },

  update: async (id: string, data: Record<string, any>) => {
    const res = await API.put(`/schedules/${id}`, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await API.delete(`/schedules/${id}`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    return res.data;
  },
};
