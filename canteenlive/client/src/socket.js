import { io } from 'socket.io-client';
import { API_URL } from './api.js';

// One shared live connection for the whole app.
export const socket = io(API_URL);
