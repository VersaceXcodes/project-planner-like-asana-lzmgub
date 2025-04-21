import React, { FC, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/main";
import { toggle_sidebar } from "@/store/main";

const GV_Sidebar: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.global.is_authenticated);
  const isCollapsed = useSelector((state: RootState) => state.global.is_sidebar_collapsed);
  
  // Local state for selected menu item with default "dashboard"
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("dashboard");

  // Menu item definitions with labels, keys and links.
  const menuItems = [
    { label: "Dashboard", key: "dashboard", link: "/dashboard", icon: "🏠" },
    { label: "Projects", key: "projects", link: "/dashboard?filter=projects", icon: "📁" },
    { label: "Tasks", key: "tasks", link: "/dashboard?filter=tasks", icon: "✅" },
    { label: "Calendar", key: "calendar", link: "/calendar", icon: "📅" },
    { label: "Profile", key: "profile", link: "/profile", icon: "👤" }
  ];

  // Handle menu item click: update local state selectedMenuItem and navigate.
  const handleMenuItemClick = (key: string, link: string) => {
    setSelectedMenuItem(key);
    navigate(link);
  };

  // Handle collapse/expand button click: dispatch toggle_sidebar action.
  const handleToggleSidebar = () => {
    dispatch(toggle_sidebar());
  };

  // Responsive behavior: collapse sidebar on small screens (<768px) and expand on larger screens.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        dispatch(toggle_sidebar());
      } else if (window.innerWidth >= 768 && isCollapsed) {
        dispatch(toggle_sidebar());
      }
    };

    window.addEventListener("resize", handleResize);
    // Cleanup on unmount.
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch, isCollapsed]);

  // Do not render sidebar if user is not authenticated.
  if (!isAuthenticated) return null;

  return (
    <>
      <div className={`fixed top-16 left-0 h-full bg-gray-800 text-white overflow-y-auto transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {!isCollapsed && <span className="font-bold text-lg">ProjectPlanner</span>}
          <button 
            onClick={handleToggleSidebar} 
            className="focus:outline-none hover:text-gray-300"
          >
            {isCollapsed ? "➡️" : "⬅️"}
          </button>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <div key={item.key} 
              onClick={() => handleMenuItemClick(item.key, item.link)}
              className={`flex items-center cursor-pointer px-4 py-2 hover:bg-gray-700 transition-colors duration-200 ${selectedMenuItem === item.key ? "bg-gray-700" : ""}`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="ml-4">{item.label}</span>}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default GV_Sidebar;