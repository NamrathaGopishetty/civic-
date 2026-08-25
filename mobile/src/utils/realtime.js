import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/api';

const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');

let socket = null;
let currentUserId = null;
const listeners = new Set();

const ensureSocket = () => {
  if (socket) return;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
  });

  socket.on('issue-update', (payload) => {
    listeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.warn('[realtime] listener error:', err.message);
      }
    });
  });

  socket.on('connect_error', (err) => {
    console.warn('[realtime] connect error:', err.message);
  });
};

export const connectRealtime = (user) => {
  const userId = user?.id || user?._id;
  if (!userId) return;

  currentUserId = userId;
  ensureSocket();

  if (!socket.connected) {
    socket.connect();
  }

  socket.emit('register-user', userId);
};

export const subscribeToIssueEvents = (callback) => {
  if (typeof callback !== 'function') return () => {};
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const disconnectRealtime = () => {
  currentUserId = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

