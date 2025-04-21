import React, { FC, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "@/store/main";
import { set_global_search_query, set_active_modal } from "@/store/main";

const GV_TopNav: FC = () => {
  const dispatch = useDispatch();

  // Local state for the search input, focus and responsive mode.
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [responsiveMode, setResponsiveMode] = useState<string>("desktop");

  // Access global state variables from the Redux store.
  const unread_count = useSelector((state: RootState) => state.global.unread_count);
  const global_search_query = useSelector((state: RootState) => state.global.global_search_query);
  const is_authenticated = useSelector((state: RootState) => state.global.is_authenticated);
  const current_user = useSelector((state: RootState) => state.global.current_user);

  // Update responsive mode based on window size.
  useEffect(() => {
    const handleResize = () => {
      setResponsiveMode(window.innerWidth < 768 ? "mobile" : "desktop");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle input changes in the search bar.
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    dispatch(set_global_search_query(value));
  };

  // Handle focus and blur events for search input.
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    // Optionally, an API call for autocomplete suggestions can be made here.
  };

  // Open notifications panel by dispatching the active modal action.
  const openNotificationsPanel = () => {
    dispatch(set_active_modal("notifications_panel"));
  };

  return (
    <>
      <nav className="w-full fixed top-0 z-50 bg-white shadow flex items-center px-4 py-2">
        {is_authenticated ? (
          <>
            {responsiveMode === "desktop" ? (
              <>
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    placeholder="Search..."
                    className="w-full border rounded px-3 py-1 focus:outline-none focus:ring"
                  />
                </div>
                <div className="flex items-center ml-4 space-x-4">
                  <button onClick={openNotificationsPanel} className="relative focus:outline-none">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    {unread_count > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unread_count}
                      </span>
                    )}
                  </button>
                  <Link to="/profile" className="focus:outline-none">
                    <img
                      src={current_user?.avatar_url || "https://picsum.photos/seed/profile/40/40"}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    placeholder="Search..."
                    className="w-full border rounded px-2 py-1 focus:outline-none focus:ring text-sm"
                  />
                </div>
                <div className="flex items-center ml-2 space-x-2">
                  <button onClick={openNotificationsPanel} className="relative focus:outline-none">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    {unread_count > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unread_count}
                      </span>
                    )}
                  </button>
                  <Link to="/profile" className="focus:outline-none">
                    <img
                      src={current_user?.avatar_url || "https://picsum.photos/seed/profile/40/40"}
                      alt="Profile"
                      className="w-7 h-7 rounded-full"
                    />
                  </Link>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex-1">
              <h1 className="text-xl font-bold">ProjectPlanner</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-blue-600 hover:underline">Login</Link>
              <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
            </div>
          </>
        )}
      </nav>
    </>
  );
};

export default GV_TopNav;