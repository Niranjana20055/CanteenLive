import { io } from 'socket.io-client';
import { API_URL } from './api.js';
import { onSocketUpdate, offSocketUpdate } from './mockStore.js';

let realSocket = null;
try {
  realSocket = io(API_URL, { timeout: 1000, autoConnect: false });
} catch (e) {}

export const socket = {
  on: (event, handler) => {
    if (event === 'queue:update') {
      onSocketUpdate(handler);
    }
    if (realSocket) realSocket.on(event, handler);
  },
  off: (event, handler) => {
    if (event === 'queue:update') {
      offSocketUpdate(handler);
    }
    if (realSocket) realSocket.off(event, handler);
  },
  emit: (event, ...args) => {
    if (realSocket) realSocket.emit(event, ...args);
  },
};
