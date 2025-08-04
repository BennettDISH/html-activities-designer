const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

class ActivityService {
  constructor() {
    this.authService = null;
  }

  setAuthService(authService) {
    this.authService = authService;
  }

  getAuthHeaders() {
    return this.authService?.getAuthHeaders() || {};
  }

  async getActivities() {
    const response = await fetch(`${API_BASE}/api/activities`, {
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch activities');
    }

    return data;
  }

  async getActivity(slug) {
    const response = await fetch(`${API_BASE}/api/activities/${slug}`, {
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch activity');
    }

    return data;
  }

  async createActivity(activityData) {
    const response = await fetch(`${API_BASE}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(activityData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create activity');
    }

    return data;
  }

  async updateActivity(id, activityData) {
    const response = await fetch(`${API_BASE}/api/activities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(activityData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update activity');
    }

    return data;
  }

  async deleteActivity(id) {
    const response = await fetch(`${API_BASE}/api/activities/${id}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete activity');
    }

    return data;
  }

  async getTemplates() {
    const response = await fetch(`${API_BASE}/api/activities/templates/list`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch templates');
    }

    return data;
  }

  // Public endpoint for embedding (no auth required)
  async getPublicActivity(slug) {
    const response = await fetch(`${API_BASE}/api/embed/${slug}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch activity');
    }

    return data;
  }
}

export default new ActivityService();