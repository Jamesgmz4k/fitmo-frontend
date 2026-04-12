// lib/apiClient.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Opcional: Manejo global de errores para que no falle silenciosamente
    if (!response.ok) {
      console.error(`Error en API [${endpoint}]:`, response.statusText);
    }
    
    return response;
  } catch (error) {
    console.error(`Fallo de conexión en [${endpoint}]:`, error);
    throw error;
  }
};