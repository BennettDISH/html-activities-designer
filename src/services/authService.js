const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async register(userData) {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    this.setToken(data.token);
    return data;
  }

  async login(credentials) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    this.setToken(data.token);
    return data;
  }

  async getProfile() {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get profile');
    }

    return data;
  }

  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    return data;
  }

  logout() {
    this.setToken(null);
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export default new AuthService();