import React, { FC, useState, useEffect, DragEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/main";
import {
  set_active_modal
} from "@/store/main";

const UV_ProjectDetail: FC = () => {
  // Extract project_uid from the URL
  const { project_uid } = useParams<{ project_uid: string }>();
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();

  // Get auth token and current user from global store
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const current_user = useSelector((state: RootState) => state.global.current_user);

  // Local state variables
  const [project_data, set_project_data] = useState<any>({});
  const [tasks_list, set_tasks_list] = useState<any[]>([]);
  const [view_mode, set_view_mode] = useState<"list" | "board">("list");
  const [filters, set_filters] = useState<any>({});
  const [new_task_title, set_new_task_title] = useState<string>("");

  // Function to fetch project details and tasks on mount or when project_uid changes
  const fetchProjectDetails = async () => {
    if (!project_uid || !auth_token) return;
    try {
      // Fetch project detail
      const projectRes = await axios.get(`http://localhost:1337/api/projects/${project_uid}`, {
        headers: { Authorization: `Bearer ${auth_token}` },
      });
      set_project_data(projectRes.data);

      // Fetch tasks associated with the project.
      // Assuming an endpoint exists: GET /api/projects/{project_uid}/tasks
      const tasksRes = await axios.get(`http://localhost:1337/api/projects/${project_uid}/tasks`, {
        headers: { Authorization: `Bearer ${auth_token}` },
      });
      set_tasks_list(tasksRes.data);
    } catch (error) {
      console.error("Error fetching project details or tasks:", error);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    // We may want to refetch if auth_token or project_uid change.
  }, [project_uid, auth_token]);

  // Toggle view mode: list <-> board
  const toggleViewMode = () => {
    set_view_mode(prev => (prev === "list" ? "board" : "list"));
  };

  // Function to update task status by calling PATCH /api/tasks/{task_uid}/status
  const updateTaskStatus = async (task_uid: string, new_status: string) => {
    if (!auth_token) return;
    try {
      const res = await axios.patch(
        `http://localhost:1337/api/tasks/${task_uid}/status`,
        { status: new_status },
        { headers: { Authorization: `Bearer ${auth_token}` } }
      );
      // Update task data optimistically in tasks_list
      set_tasks_list(prev =>
        prev.map(task => (task.uid === task_uid ? { ...task, status: new_status } : task))
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Function for quick-add task functionality: inline add a new task
  const quickAddTask = async () => {
    if (!new_task_title.trim() || !project_uid || !auth_token) return;
    try {
      // Optimistic UI update: create a new task object locally
      const tempTask = {
        uid: "temp-" + Date.now(),
        project_uid: project_uid,
        title: new_task_title,
        description: "",
        due_date: "",
        priority: "normal",
        status: "to_do",
        created_by: current_user ? current_user.uid : "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set_tasks_list(prev => [tempTask, ...prev]);
      set_new_task_title("");

      // Call backend API to create a task. Assuming endpoint POST /api/tasks exists.
      const res = await axios.post(
        `http://localhost:1337/api/tasks`,
        { ...tempTask },
        { headers: { Authorization: `Bearer ${auth_token}` } }
      );
      // Replace temporary task with real task from server
      set_tasks_list(prev =>
        prev.map(task => (task.uid === tempTask.uid ? res.data : task))
      );
    } catch (error) {
      console.error("Error adding new task:", error);
    }
  };

  // Function to navigate to a task detail view when a task is clicked
  const navigateToTaskDetail = (task_uid: string) => {
    navigate(`/task/${task_uid}`);
  };

  // Drag and drop event handlers for Board view
  const onDragStart = (e: DragEvent<HTMLDivElement>, task_uid: string) => {
    e.dataTransfer.setData("task_uid", task_uid);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow a drop
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, new_status: string) => {
    e.preventDefault();
    const task_uid = e.dataTransfer.getData("task_uid");
    if (task_uid) {
      updateTaskStatus(task_uid, new_status);
    }
  };

  return (
    <>
      <div className="p-4">
        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">{project_data.title || "Project Title"}</h1>
            <p className="text-gray-600">{project_data.description || "Project description goes here."}</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => dispatch(set_active_modal("project_edit"))}
            >
              Edit
            </button>
            <button 
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              onClick={() => console.log("Archive action triggered")}
            >
              Archive
            </button>
            <button 
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              onClick={toggleViewMode}
            >
              {view_mode === "list" ? "Switch to Board View" : "Switch to List View"}
            </button>
          </div>
        </div>

        {/* Quick Add Task */}
        <div className="mb-6 flex items-center">
          <input 
            type="text" 
            placeholder="Quick add task..." 
            value={new_task_title}
            onChange={(e) => set_new_task_title(e.target.value)}
            className="border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
          />
          <button 
            onClick={quickAddTask}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-r"
          >
            Add Task
          </button>
        </div>

        {/* Task List or Board View */}
        {view_mode === "list" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Task Title</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Assignee</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Due Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Priority</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks_list.map(task => (
                  <tr key={task.uid} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigateToTaskDetail(task.uid)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">{task.title}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{task.assignee || "Unassigned"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{task.due_date || "-"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{task.priority || "normal"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateTaskStatus(task.uid, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="to_do">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Board (Kanban) View
          <div className="flex space-x-4">
            {["to_do", "in_progress", "done"].map(status => (
              <div 
                key={status}
                className="flex-1 bg-gray-100 p-4 rounded"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
              >
                <h2 className="text-xl font-semibold mb-4">
                  {status === "to_do" ? "To Do" : status === "in_progress" ? "In Progress" : "Done"}
                </h2>
                <div className="space-y-4">
                  {tasks_list.filter(task => task.status === status).map(task => (
                    <div 
                      key={task.uid}
                      draggable
                      onDragStart={(e) => onDragStart(e, task.uid)}
                      onClick={() => navigateToTaskDetail(task.uid)}
                      className="p-4 bg-white rounded shadow cursor-move hover:bg-gray-50"
                    >
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-sm text-gray-600">Priority: {task.priority || "normal"}</p>
                      <p className="text-sm text-gray-600">Due: {task.due_date || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UV_ProjectDetail;