const API_BASE_URL = 'http://180.235.121.253:8147'; // ✅ backend URL (NO /api)

export const apiClient = {
  async post<T>(endpoint: string, body: any): Promise<T> {
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    console.log(`[API] calling POST ${fullUrl}`, body);

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text || response.statusText };
      }

      if (!response.ok) {
        console.error(`[API] Error ${response.status}:`, data);
        const detail = data.error ? ` (${data.error})` : '';
        const errorMessage = (data.message || `Request failed with status ${response.status}`) + detail;
        throw new Error(errorMessage);
      }

      return data as T;

    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error("[API] Network error - please check if the backend is running at:", API_BASE_URL);
        throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please check your connection.`);
      }
      console.error("[API] Exception:", error);
      throw error;
    }
  },
};