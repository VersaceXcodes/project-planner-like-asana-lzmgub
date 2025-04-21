// store/main.tsx

import { configureStore, combineReducers, createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

// Define types for User and Notification
interface User {
  uid: string;
  name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  uid: string;
  user_uid: string;
  notification_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface RealtimeUpdates {
  task_status_updated: any[]; // each payload follows backend spec
  new_comment_added: any[];
}

interface GlobalState {
  auth_token: string;
  current_user: User | null;
  is_authenticated: boolean;
  notifications: Notification[];
  unread_count: number;
  socket_connected: boolean;
  realtime_updates: RealtimeUpdates;
  is_sidebar_collapsed: boolean;
  global_search_query: string;
  active_modal: string;
}

// Initial state based on app architecture
const initial_state: GlobalState = {
  auth_token: "",
  current_user: null,
  is_authenticated: false,
  notifications: [],
  unread_count: 0,
  socket_connected: false,
  realtime_updates: {
    task_status_updated: [],
    new_comment_added: []
  },
  is_sidebar_collapsed: false,
  global_search_query: "",
  active_modal: ""
};

let socket_client: Socket | null = null;

// Async thunk to setup socket connection
export const setup_socket = createAsyncThunk(
  'global/setup_socket',
  async (token: string, { dispatch }) => {
    // Return a promise that resolves when socket is connected.
    return new Promise<Socket>((resolve, reject) => {
      // Ensure the VITE_API_BASE_URL env variable is used for the socket url.
      socket_client = io(import.meta.env.VITE_API_BASE_URL as string, {
        query: {
          token: token
        }
      });
      socket_client.on("connect", () => {
        dispatch(set_socket_connected(true));
        resolve(socket_client as Socket);
      });
      socket_client.on("task_status_updated", (data: any) => {
        // data expected to have task_uid, status, updated_at
        dispatch(add_realtime_update({ event_type: 'task_status_updated', payload: data }));
      });
      socket_client.on("new_comment_added", (data: any) => {
        // data expected to have comment_uid, task_uid, user_uid, content, created_at
        dispatch(add_realtime_update({ event_type: 'new_comment_added', payload: data }));
      });
      socket_client.on("notification_created", (data: any) => {
        // data expected to have uid, user_uid, notification_type, content, is_read, created_at
        dispatch(add_notification(data));
      });
      socket_client.on("disconnect", () => {
        dispatch(set_socket_connected(false));
      });
      // In case of connection error, reject the promise.
      socket_client.on("connect_error", (err: any) => {
        reject(err);
      });
    });
  }
);

// Global slice for managing the global state variables
const globalSlice = createSlice({
  name: 'global',
  initialState: initial_state,
  reducers: {
    set_auth_token(state, action: PayloadAction<string>) {
      state.auth_token = action.payload;
    },
    set_current_user(state, action: PayloadAction<User>) {
      state.current_user = action.payload;
    },
    set_is_authenticated(state, action: PayloadAction<boolean>) {
      state.is_authenticated = action.payload;
    },
    set_notifications(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload;
      // Update unread_count based on notifications not read
      state.unread_count = action.payload.filter((n) => !n.is_read).length;
    },
    add_notification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unread_count += 1;
      }
    },
    mark_notification_read(state, action: PayloadAction<string>) {
      // action.payload is notification uid
      const notif = state.notifications.find(n => n.uid === action.payload);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unread_count = state.notifications.filter(n => !n.is_read).length;
      }
    },
    set_socket_connected(state, action: PayloadAction<boolean>) {
      state.socket_connected = action.payload;
    },
    add_realtime_update(state, action: PayloadAction<{ event_type: string; payload: any }>) {
      // Add the realtime update event payload under appropriate type
      if (action.payload.event_type === 'task_status_updated') {
        state.realtime_updates.task_status_updated.push(action.payload.payload);
      } else if (action.payload.event_type === 'new_comment_added') {
        state.realtime_updates.new_comment_added.push(action.payload.payload);
      }
    },
    clear_realtime_updates(state, action: PayloadAction<{ event_type: string }>) {
      if (action.payload.event_type === 'task_status_updated') {
        state.realtime_updates.task_status_updated = [];
      } else if (action.payload.event_type === 'new_comment_added') {
        state.realtime_updates.new_comment_added = [];
      }
    },
    toggle_sidebar(state) {
      state.is_sidebar_collapsed = !state.is_sidebar_collapsed;
    },
    set_global_search_query(state, action: PayloadAction<string>) {
      state.global_search_query = action.payload;
    },
    set_active_modal(state, action: PayloadAction<string>) {
      state.active_modal = action.payload;
    },
    reset_auth(state) {
      state.auth_token = "";
      state.current_user = null;
      state.is_authenticated = false;
      state.notifications = [];
      state.unread_count = 0;
      // Optionally, disconnect the socket if connected
      if (socket_client) {
        socket_client.disconnect();
        socket_client = null;
      }
      state.socket_connected = false;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setup_socket.fulfilled, (state, action) => {
      // Socket setup successful; nothing more to do here as the events are handled by dispatch.
    });
    builder.addCase(setup_socket.rejected, (state, action) => {
      state.socket_connected = false;
    });
  }
});

// Export actions for use in components
export const {
  set_auth_token,
  set_current_user,
  set_is_authenticated,
  set_notifications,
  add_notification,
  mark_notification_read,
  set_socket_connected,
  add_realtime_update,
  clear_realtime_updates,
  toggle_sidebar,
  set_global_search_query,
  set_active_modal,
  reset_auth
} = globalSlice.actions;

// Setup persist config for the global state
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth_token', 'current_user', 'is_authenticated', 'notifications', 'unread_count', 'is_sidebar_collapsed', 'global_search_query', 'active_modal']
};

const rootReducer = combineReducers({
  global: globalSlice.reducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the Redux store
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false // needed for redux-persist and socket instances
    })
});

// Export the store as default and also export RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;