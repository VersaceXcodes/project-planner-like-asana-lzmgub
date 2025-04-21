import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/main";

const GV_HamburgerMenu: React.FC = () => {
  // Local state for toggling the menu open/close
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Get current user from global store to optionally enable certain menu items
  const current_user = useSelector((state: RootState) => state.global.current_user);

  // Toggle the hamburger menu open and closed
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // When a menu item is selected, close the menu
  const selectMenuItemFromHamburger = () => {
    setIsMenuOpen(false);
  };

  // Define the menu items that mirror the Sidebar options
  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Projects", path: "/project/create" },
    { name: "Tasks", path: "/task/create" },
    { name: "Calendar", path: "/calendar" },
    { name: "Profile", path: "/profile" }
  ];
  
  // Optionally include Team if the current user is an admin (or if applicable)
  if (current_user && current_user.role === "admin") {
    menuItems.push({ name: "Team", path: "/team" });
  }

  return (
    <>
      {/* Hamburger icon button, visible only on small viewports */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMenu}
          className="p-2 bg-gray-800 text-white rounded focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Slide-out Hamburger Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop overlay to close the menu when clicked */}
          <div
            onClick={toggleMenu}
            className="fixed inset-0 bg-black opacity-50 z-40"
          ></div>
          {/* Menu panel */}
          <div
            className="fixed top-0 left-0 w-64 h-full bg-white shadow z-50 transform transition-transform duration-300"
            style={{ transform: isMenuOpen ? "translateX(0)" : "translateX(-100%)" }}
          >
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Menu</h2>
              <ul>
                {menuItems.map((item) => (
                  <li key={item.name} className="mb-2">
                    <Link
                      to={item.path}
                      onClick={selectMenuItemFromHamburger}
                      className="block p-2 rounded hover:bg-gray-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GV_HamburgerMenu;