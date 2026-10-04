import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, useNotifications } from '../store';
import { notificationAPI } from '../services/api';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { markNotificationRead, markAllNotificationsRead } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    notificationAPI.getNotifications().then((res) => {
      if (res && res.notifications) {
        // Sync with local store
        res.notifications.forEach((n: any) => {
          useAppStore.getState().addNotification({
            id: n._id,
            title: n.title,
            message: n.message,
            read: n.read,
            timestamp: new Date(n.createdAt),
            type: n.type || 'info',
          });
        });
      }
    }).catch(() => {});
  }, []);

  const handleMarkAllRead = async () => {
    markAllNotificationsRead();
    try {
      await notificationAPI.markAllRead();
    } catch (e) {}
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const toggle = () => setShowDropdown((s) => !s);

  return (
    <div ref={wrapperRef} className="relative z-40">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative group inline-flex items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-xl border-2 border-gray-100 shadow-lg shadow-gray-200/60 hover:shadow-xl hover:shadow-pink-200/60 hover:border-pink-300 transition-all duration-300"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-pink-600 transition-colors" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-[20px] h-5 sm:min-w-[22px] sm:h-[22px] bg-gradient-to-br from-rose-500 via-pink-500 to-red-500 text-white text-[10px] sm:text-xs font-black rounded-full flex items-center justify-center shadow-lg shadow-rose-300/60 px-1 border-2 border-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount > 9 ? `${unreadCount}+` : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="absolute right-0 top-full mt-3 w-[min(92vw,380px)] bg-white rounded-3xl shadow-2xl shadow-black/20 border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-2 bg-gradient-to-r from-pink-50/70 via-white to-purple-50/70">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-pink-500" />
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">
                    {unreadCount} unread
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors"
                    aria-label="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">All read</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-10 sm:p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-bold text-gray-700 mb-1">No notifications yet</p>
                  <p className="text-sm text-gray-500">
                    You're all caught up. New alerts will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {notifications.map((notification) => {
                    const isUnread = !notification.read;
                    return (
                      <li key={notification.id}>
                        <button
                          onClick={() => {
                            if (isUnread) markNotificationRead(notification.id);
                            setShowDropdown(false);
                          }}
                          className={`w-full text-left p-4 sm:p-4.5 transition-all ${
                            isUnread
                              ? 'bg-gradient-to-r from-pink-50/90 via-white to-purple-50/70 hover:from-pink-100 hover:to-purple-100'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-bold sm:font-extrabold leading-snug ${
                                  isUnread ? 'text-gray-900' : 'text-gray-700'
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-[11px] sm:text-xs font-semibold text-gray-400 mt-2">
                                {new Date(notification.timestamp).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            {isUnread && (
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 mt-2 flex-shrink-0 shadow shadow-rose-300" />
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50/60">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/notifications');
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
