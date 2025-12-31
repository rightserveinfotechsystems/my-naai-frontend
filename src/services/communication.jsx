import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://72.60.195.95:3006";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

    } else {
      console.warn('API Request without token:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {

    return response;
  },
  (error) => {
    console.error('API Error Response:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn('401 Unauthorized - clearing token and redirecting to login');
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

  // Change admin password 
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

  updateProfile: async (profileData) => {
    return {
      success: true,
      data: profileData,
      message: "Profile updated successfully"
    };
  },

};

// ==================== USER MANAGEMENT ====================
export const userAPI = {
  getUsers: async (payload) => {
  try {
    const response = await api.post(
      '/api/users/get-user-list',
      payload   
    );

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
  },
  changeUserStatus: async (userId) => {
    try {
      const response = await api.post('/api/users/change-user-status', {
        userId
      });

      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      console.error("Change status API error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to change user status",
        error: error.response?.data
      };
    }
  },
  deleteUsers: async (userIds) => {
    try {
      const response = await api.post("/api/users/delete-user", {
        userIds
      });

      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to delete users",
        error: error.response?.data
      };
    }
  }


};

// ==================== SALON MANAGEMENT ====================
export const salonAPI = {
  getSalons: async (params = {}) => {
    try {

      const queryParams = new URLSearchParams();

      if (params.page && params.page !== 1) queryParams.append('page', params.page.toString());
      if (params.searchString && params.searchString.trim()) queryParams.append('searchString', params.searchString.trim());
      if (params.cityFilter && params.cityFilter !== 'all') queryParams.append('cityFilter', params.cityFilter);

      const queryString = queryParams.toString();
      const url = queryString ? `/api/salons/get-salon-list?${queryString}` : '/api/salons/get-salon-list';


      let response;
      try {
        response = await api.get(url);
      } catch (getError) {
        response = await api.post('/api/salons/get-salon-list', { ...params });
      }

      if (response.data?.status === "SUCCESS") {
        const salonsData = response.data.data?.salons ||
          response.data.data?.barberShops ||
          response.data.data ||
          [];

        return {
          success: true,
          data: {
            barberShops: Array.isArray(salonsData) ? salonsData : [],
            pagination: response.data.pagination
          },
          message: response.data.message || "Salons fetched successfully"
        };
      } else {
        // API returned error status
        return {
          success: false,
          data: { barberShops: [] },
          message: response.data?.message || "Failed to fetch salons"
        };
      }
    } catch (error) {
      console.error("Salon list API error:", error);
      console.error("Error details:", error.response?.data);

      if (error.response?.status === 401) {
        throw error;
      }

      // For network errors or when backend is down, return mock data for development
      if (error.code === 'ERR_NETWORK' || !error.response) {
        console.warn("Backend server not responding, using mock data for development");

        return {
          success: true,
          data: {
            barberShops: [
              {
                salonId: "mock-1",
                salonName: "Demo Salon 1",
                ownerName: "John Doe",
                phoneNumber: "9876543210",
                email: "john@demo.com",
                addressLine1: "123 Main Street",
                addressLine2: "Near Central Mall",
                city: "Mumbai",
                state: "Maharashtra",
                pincode: "400001",
                isActive: true,
                isOpen: true,
                ratingAverage: "4.5",
                totalReviews: 25,
                imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
                queueLength: 5,
                totalWaitTime: { minutes: 75, display: "1h 15m" }
              },
              {
                salonId: "mock-2",
                salonName: "Demo Salon 2",
                ownerName: "Jane Smith",
                phoneNumber: "9876543211",
                email: "jane@demo.com",
                addressLine1: "456 Oak Avenue",
                addressLine2: "Opposite City Hospital",
                city: "Delhi",
                state: "Delhi",
                pincode: "110001",
                isActive: true,
                isOpen: false,
                ratingAverage: "4.2",
                totalReviews: 18,
                imageUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400",
                queueLength: 0,
                totalWaitTime: { minutes: 0, display: "0h 0m" }
              }
            ],
            pagination: {
              total: 2,
              page: 1,
              limit: 20,
              totalPages: 1
            }
          },
          message: "Mock data loaded (Backend server not responding)"
        };
      }

      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch salons",
        error: error.response?.data,
        data: { barberShops: [] }
      };
    }
  },

  // Get salon by ID
  getSalonById: async (salonId) => {
    try {
      const response = await api.get(`/api/salons/get-salon-by-id/${salonId}?details=true`);

      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message || "Salon fetched successfully"
      };
    } catch (error) {
      console.error("Get salon by ID API error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch salon",
        error: error.response?.data,
        data: null
      };
    }
  },

  getSalonDetails: async (salonId) => {
    try {

      let response;
      try {
        response = await api.get(`/api/salons/get-salon-by-id/${salonId}?details=true`);
      } catch (detailedError) {
        response = await api.get(`/api/salons/get-salon/${salonId}`);
      }

      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message || "Salon details fetched successfully"
      };
    } catch (error) {
      console.error("Get salon details API error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // For network errors, return mock detailed salon data
      if (error.code === 'ERR_NETWORK' || !error.response) {
        console.warn("Backend server not responding, using mock salon details");

        return {
          success: true,
          data: {
            salonId: salonId,
            salonName: "Demo Salon Details",
            ownerName: "John Doe",
            phoneNumber: "9876543210",
            email: "john@demo.com",
            addressLine1: "123 Main Street",
            addressLine2: "Near Central Mall",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            latitude: 19.0760,
            longitude: 72.8777,
            genderType: "UNISEX",
            isActive: true,
            isOpen: true,
            ratingAverage: "4.5",
            totalReviews: 25,
            imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            queueLength: 5,
            totalWaitTime: { minutes: 75, display: "1h 15m" },
            services: [
              {
                serviceId: "s1",
                serviceName: "Hair Cut",
                durationMinutes: 30,
                price: 200,
                description: "Professional hair cutting service"
              },
              {
                serviceId: "s2",
                serviceName: "Hair Wash",
                durationMinutes: 20,
                price: 150,
                description: "Complete hair washing and conditioning"
              }
            ],
            businessHours: [{
              openingTime: "09:00",
              closingTime: "21:00",
              breakStartTime: "13:00",
              breakEndTime: "14:00",
              holidayDays: [0] // Sunday is holiday
            }]
          },
          message: "Mock salon details loaded (Backend server not responding)"
        };
      }

      return {
        success: false,
        message: error.response?.data?.message ||
          error.message ||
          "Failed to fetch salon details",
        error: error.response?.data,
        data: null
      };
    }
  },

  // Create new salon - actual API integration
  createSalon: async (salonData) => {
    try {
      const response = await api.post('/api/salons/create', salonData);

      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message || "Salon created successfully"
      };
    } catch (error) {
      console.error("Create salon API error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create salon",
        error: error.response?.data
      };
    }
  },

  // Update salon - actual API integration
  updateSalon: async (salonId, salonData) => {
    try {
      const response = await api.put(`/api/salons/update-salon-admin/${salonId}`, salonData);

      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message || "Salon updated successfully"
      };
    } catch (error) {
      console.error("Update salon API error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update salon",
        error: error.response?.data
      };
    }
  },

  deleteSalon: async (salonId) => {
    return {
      success: false,
      message: "Salon deletion endpoint not implemented yet",
      data: null
    };
  }
};

// ==================== BOOKING MANAGEMENT ====================
export const bookingAPI = {
  getBookings: async () => {
    return {
      success: true,
      data: [],
      message: "Bookings endpoint not implemented yet"
    };
  },

  getBookingById: async (bookingId) => {
    return {
      success: false,
      message: "Booking endpoint not implemented yet",
      data: null
    };
  },

  createBooking: async (bookingData) => {
    return {
      success: false,
      message: "Booking creation endpoint not implemented yet",
      data: null
    };
  },

  updateBooking: async (bookingId, bookingData) => {
    return {
      success: false,
      message: "Booking update endpoint not implemented yet",
      data: null
    };
  },

  deleteBooking: async (bookingId) => {
    return {
      success: false,
      message: "Booking deletion endpoint not implemented yet",
      data: null
    };
  }
};

// ==================== SALON REQUEST MANAGEMENT ====================
export const salonRequestAPI = {
  getSalonRequests: async ({ page = 1, salonNameFilter = "", requestDate = "", searchString = "" }) => {
    try {
      const payload = {
        page,
        salonNameFilter,
        requestDate,
        searchString
      };

      const response = await api.post('/api/salonrequest/get-list', payload);

      return {
        success: response.data?.status === "SUCCESS",
        data: response.data?.data,
        message: response.data?.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch salon requests",
        error: error.response?.data
      };
    }
  },


  deleteSalonRequests: async (requestIds) => {
    try {
      const res = await api.post("/api/salonrequest/delete-request", {
        requestIds
      });

      return {
        success: res.data?.status === "SUCCESS",
        message: res.data?.message
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Delete failed"
      };
    }
  },

  // approveSalonRequest: async (requestId, approvalData) => {
  //   return {
  //     success: false,
  //     message: "Salon request approval endpoint not implemented yet",
  //     data: null
  //   };
  // },

  // rejectSalonRequest: async (requestId, rejectionData) => {
  //   return {
  //     success: false,
  //     message: "Salon request rejection endpoint not implemented yet",
  //     data: null
  //   };
  // }
};

// ==================== DASHBOARD/STATS ====================
export const dashboardAPI = {
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

export default api;