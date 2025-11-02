// Chave para armazenar pedidos offline no IndexedDB
const DB_NAME = 'RepresentacaoComercialDB';
const DB_VERSION = 1;
const ORDERS_STORE = 'offlineOrders';
const PRODUCTS_STORE = 'products';

// Inicializa o IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store para pedidos offline
      if (!db.objectStoreNames.contains(ORDERS_STORE)) {
        const ordersStore = db.createObjectStore(ORDERS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        ordersStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store para produtos (cache)
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        const productsStore = db.createObjectStore(PRODUCTS_STORE, {
          keyPath: 'id',
        });
        productsStore.createIndex('company_id', 'company_id', { unique: false });
      }
    };
  });
};

// Salva um pedido offline
export const saveOfflineOrder = async (orderData) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([ORDERS_STORE], 'readwrite');
    const store = transaction.objectStore(ORDERS_STORE);

    const orderWithTimestamp = {
      ...orderData,
      timestamp: new Date().toISOString(),
      offline: true,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(orderWithTimestamp);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao salvar pedido offline:', error);
    throw error;
  }
};

// Busca todos os pedidos offline
export const getOfflineOrders = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([ORDERS_STORE], 'readonly');
    const store = transaction.objectStore(ORDERS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos offline:', error);
    return [];
  }
};

// Remove um pedido offline específico
export const removeOfflineOrder = async (orderId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([ORDERS_STORE], 'readwrite');
    const store = transaction.objectStore(ORDERS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(orderId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao remover pedido offline:', error);
    throw error;
  }
};

// Remove todos os pedidos offline
export const clearOfflineOrders = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([ORDERS_STORE], 'readwrite');
    const store = transaction.objectStore(ORDERS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao limpar pedidos offline:', error);
    throw error;
  }
};

// Salva produtos no cache local
export const cacheProducts = async (products) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);

    // Limpa produtos existentes
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Adiciona novos produtos
    const promises = products.map(product => {
      return new Promise((resolve, reject) => {
        const request = store.add(product);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Erro ao cachear produtos:', error);
    throw error;
  }
};

// Busca produtos do cache local
export const getCachedProducts = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([PRODUCTS_STORE], 'readonly');
    const store = transaction.objectStore(PRODUCTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao buscar produtos do cache:', error);
    return [];
  }
};

// Verifica se está online
export const isOnline = () => {
  return navigator.onLine;
};

