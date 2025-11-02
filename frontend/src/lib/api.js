import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Configuração do axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Para enviar cookies de sessão
  headers: {
    'Content-Type': 'application/json',
  },
});



// Serviços de autenticação
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  selectCompany: async (companyId) => {
    const response = await api.post('/auth/select-company', { company_id: companyId });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Serviços do dashboard
export const dashboardService = {
  getMetrics: async () => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  getPendingOrdersCount: async () => {
    const response = await api.get('/dashboard/pending-orders-count');
    return response.data;
  },
};

// Serviços de CNPJ
export const cnpjService = {
  consultar: async (cnpj) => {
    const response = await api.post('/cnpj/consultar', { cnpj });
    return response.data;
  },
};

// Serviços de pedidos
export const ordersService = {
  getOrders: async () => {
    const response = await api.get('/orders/');
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await api.post('/orders/', orderData);
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  syncOrders: async (orders) => {
    const response = await api.post('/orders/sync', { orders });
    return response.data;
  },
};

// Serviços do catálogo
export const catalogService = {
  getProducts: async () => {
    const response = await api.get('/catalog/products');
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/catalog/products', productData);
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/catalog/payment-methods');
    return response.data;
  },

  createPaymentMethod: async (paymentMethodData) => {
    const response = await api.post('/catalog/payment-methods', paymentMethodData);
    return response.data;
  },
};

export default api;

