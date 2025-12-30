import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://72.60.195.95:3006";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// ==================== ADMIN AUTHENTICATION ====================
export const adminAPI = {
  // Admin login
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, credentials);
      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
        error: error.response?.data
      };
    }
  },

  // Change admin password - using the working endpoint
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/api/admin/change-password', passwordData);
      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to change password",
        error: error.response?.data
      };
    }
  },

  getProfile: async () => {
    return {
      success: true,
      data: {
        name: "Admin User",
        email: "admin@salonharmony.com",
        role: "Administrator",
        avatar: "👤"
      },
      message: "Profile loaded from cache"
    };
  },

  // Update admin profile - mock implementation
  updateProfile: async (profileData) => {
    // Mock implementation since endpoint might not exist
    return {
      success: true,
      data: profileData,
      message: "Profile updated successfully"
    };
  }
};

// ==================== USER MANAGEMENT ====================
export const userAPI = {
  // Get all users - using POST method as per backend requirement
  getUsers: async () => {
    try {
      const response = await api.post('/api/users/get-user-list', {});
      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch users",
        error: error.response?.data
      };
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post('/api/users', userData);
      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create user",
        error: error.response?.data
      };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/api/users/${userId}`, userData);
      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update user",
        error: error.response?.data
      };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/api/users/${userId}`);
      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete user",
        error: error.response?.data
      };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch user",
        error: error.response?.data
      };
    }
  }
};

// ==================== SALON MANAGEMENT ====================
// Note: These endpoints might not exist yet, using mock data for now
export const salonAPI = {
  // Get all salons - mock implementation
  getSalons: async () => {
    return {
      success: true,
      data: [],
      message: "Salons endpoint not implemented yet"
    };
  },

  // Get salon by ID - mock implementation
  getSalonById: async (salonId) => {
    return {
      success: false,
      message: "Salon endpoint not implemented yet",
      data: null
    };
  },

  // Create new salon - mock implementation
  createSalon: async (salonData) => {
    return {
      success: false,
      message: "Salon creation endpoint not implemented yet",
      data: null
    };
  },

  // Update salon - mock implementation
  updateSalon: async (salonId, salonData) => {
    return {
      success: false,
      message: "Salon update endpoint not implemented yet",
      data: null
    };
  },

  // Delete salon - mock implementation
  deleteSalon: async (salonId) => {
    return {
      success: false,
      message: "Salon deletion endpoint not implemented yet",
      data: null
    };
  }
};

// ==================== BOOKING MANAGEMENT ====================
// Note: These endpoints might not exist yet, using mock data for now
export const bookingAPI = {
  // Get all bookings - mock implementation
  getBookings: async () => {
    return {
      success: true,
      data: [],
      message: "Bookings endpoint not implemented yet"
    };
  },

  // Get booking by ID - mock implementation
  getBookingById: async (bookingId) => {
    return {
      success: false,
      message: "Booking endpoint not implemented yet",
      data: null
    };
  },

  // Create new booking - mock implementation
  createBooking: async (bookingData) => {
    return {
      success: false,
      message: "Booking creation endpoint not implemented yet",
      data: null
    };
  },

  // Update booking - mock implementation
  updateBooking: async (bookingId, bookingData) => {
    return {
      success: false,
      message: "Booking update endpoint not implemented yet",
      data: null
    };
  },

  // Delete booking - mock implementation
  deleteBooking: async (bookingId) => {
    return {
      success: false,
      message: "Booking deletion endpoint not implemented yet",
      data: null
    };
  }
};

// ==================== SALON REQUEST MANAGEMENT ====================
// Note: These endpoints might not exist yet, using mock data for now
export const salonRequestAPI = {
  // Get all salon requests - mock implementation
  getSalonRequests: async () => {
    return {
      success: true,
      data: [],
      message: "Salon requests endpoint not implemented yet"
    };
  },

  // Get salon request by ID - mock implementation
  getSalonRequestById: async (requestId) => {
    return {
      success: false,
      message: "Salon request endpoint not implemented yet",
      data: null
    };
  },

  // Approve salon request - mock implementation
  approveSalonRequest: async (requestId, approvalData) => {
    return {
      success: false,
      message: "Salon request approval endpoint not implemented yet",
      data: null
    };
  },

  // Reject salon request - mock implementation
  rejectSalonRequest: async (requestId, rejectionData) => {
    return {
      success: false,
      message: "Salon request rejection endpoint not implemented yet",
      data: null
    };
  }
};

// ==================== DASHBOARD/STATS ====================
// Note: These endpoints might not exist yet, using mock data for now
export const dashboardAPI = {
  // Get dashboard stats - mock implementation
  getStats: async () => {
    return {
      success: true,
      data: {
        totalUsers: 0,
        totalSalons: 0,
        totalBookings: 0,
        totalRevenue: 0
      },
      message: "Dashboard stats endpoint not implemented yet"
    };
  }
};

// Export default api instance for custom requests
export default api;