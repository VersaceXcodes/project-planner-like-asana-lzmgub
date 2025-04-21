import React, { FC, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { RootState, set_active_modal, set_global_search_query } from "@/store/main";

const UV_Dashboard: FC = () => {
  // Local states for the view
  const [projects_summary, setProjectsSummary] = useState<any[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
  const [filter_options, setFilterOptions] = useState<{ status?: string; due_date?: string }>({});

  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  // Access global state variables from store
  const globalSearchQuery = useSelector((state: RootState) => state.global.global_search_query);
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const realtime_updates = useSelector((state: RootState) => state.global.realtime_updates);
  const notifications = useSelector((state: RootState) => state.global.notifications);

  // Function: refreshDashboardData - fetches the dashboard data from backend
  const refreshDashboardData = async () => {
    try {
      // Construct the url using the VITE_API_BASE_URL environment variable
      const base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";
      // Assume an endpoint /api/dashboard-data returns { projects: [...], recent_activities: [...] }
      const response = await axios.get(`${base_url}/api/dashboard-data`, {
        headers: { Authorization: `Bearer ${auth_token}` }
      });
      // Set projects summary from the response (assuming response.data.projects exists)
      if (response.data && response.data.projects) {
        setProjectsSummary(response.data.projects);
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    }
  };

  // On mount, set search query from URL params and refresh dashboard data
  useEffect(() => {
    const queryFromUrl = searchParams.get("search") || "";
    setLocalSearchQuery(queryFromUrl);
    // Also update the global search query for synchronization
    dispatch(set_global_search_query(queryFromUrl));
    // Initial data load
    refreshDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On realtime updates (from websocket events) refresh the dashboard data
  useEffect(() => {
    // We can check if any realtime update arrays have new events
    if (realtime_updates.task_status_updated.length > 0 || realtime_updates.new_comment_added.length > 0) {
      refreshDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime_updates]);

  // Handler for quick-add button: triggers the quick-add modal view
  const handleQuickAdd = () => {
    dispatch(set_active_modal("quick_add"));
  };

  // Filtering projects based on the search query; for demonstration, we filter by title assumed in project object
  const filteredProjects = projects_summary.filter(project => {
    if (!localSearchQuery) return true;
    // Assuming each project has a "title" field
    return project.title.toLowerCase().includes(localSearchQuery.toLowerCase());
  });

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {/* Overview Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Projects Panel */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium">Total Projects</h2>
            <p className="text-3xl font-bold mt-2">{projects_summary.length}</p>
          </div>
          {/* Upcoming Deadlines Panel */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium">Upcoming Deadlines</h2>
            {/* Simulated upcoming deadlines: filter projects with a due_date in the future */}
            <ul className="mt-2">
              {projects_summary.filter(p => new Date(p.due_date) > new Date()).slice(0, 3).map((project: any) => (
                <li key={project.uid} className="text-sm">
                  {project.title} - <span className="font-medium">{new Date(project.due_date).toLocaleDateString()}</span>
                </li>
              ))}
              {projects_summary.filter(p => new Date(p.due_date) > new Date()).length === 0 && (
                <li className="text-sm text-gray-500">No upcoming deadlines</li>
              )}
            </ul>
          </div>
          {/* Recent Activity Feed Panel */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium">Recent Activity</h2>
            <ul className="mt-2">
              {/* Assuming each project might have an "activities" field; else, show project updates */}
              {projects_summary.map((project: any) => (
                project.activities && project.activities.slice(0, 2).map((activity: any, idx: number) => (
                  <li key={`${project.uid}-activity-${idx}`} className="text-sm">
                    {activity.description} <span className="text-xs text-gray-500">({new Date(activity.created_at).toLocaleTimeString()})</span>
                  </li>
                ))
              ))}
              {projects_summary.every((p: any) => !p.activities || p.activities.length === 0) && (
                <li className="text-sm text-gray-500">No recent activity</li>
              )}
            </ul>
          </div>
        </div>

        {/* Global Search Display (synchronized with global top nav) */}
        {globalSearchQuery && (
          <div className="mb-4">
            <span className="text-sm text-gray-600">Search Results for: </span>
            <span className="text-sm font-medium">{globalSearchQuery}</span>
          </div>
        )}

        {/* Projects List */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Projects</h2>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project: any) => (
                <Link key={project.uid} to={`/project/${project.uid}`} className="block bg-white shadow rounded-lg p-4 hover:shadow-lg transition">
                  <h3 className="text-lg font-medium">{project.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="font-semibold">Due:</span>
                    <span>{new Date(project.due_date).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No projects found.</p>
          )}
        </div>
      </div>

      {/* Floating Quick-add Button */}
      <button
        onClick={handleQuickAdd}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-16 w-16 flex items-center justify-center shadow-lg text-3xl"
      >
        +
      </button>
    </>
  );
};

export default UV_Dashboard;