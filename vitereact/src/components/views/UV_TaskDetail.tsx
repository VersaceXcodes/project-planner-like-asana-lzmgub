import React, { FC, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState, set_active_modal } from "@/store/main";
import { useDispatch } from "react-redux";

interface SubTask {
  uid: string;
  title: string;
  completed: boolean;
}

interface Comment {
  uid: string;
  user_uid: string;
  content: string;
  created_at: string;
}

interface TaskDetailType {
  uid: string;
  title: string;
  description: string;
  due_date: string;
  priority: string;
  status: string;
  attachments?: string[];
  sub_tasks?: SubTask[];
  comments?: Comment[];
  project_uid?: string;
}

const UV_TaskDetail: FC = () => {
  // Extract task_uid from url slugs
  const { task_uid } = useParams<{ task_uid: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Global auth token and current_user from redux store
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const current_user = useSelector((state: RootState) => state.global.current_user);

  // Local state for task details
  const [taskDetail, setTaskDetail] = useState<TaskDetailType | null>(null);
  // edit_mode for inline editing
  const [editMode, setEditMode] = useState<boolean>(false);
  // flag to toggle sub-tasks visibility
  const [showSubtasks, setShowSubtasks] = useState<boolean>(false);
  // comment text input state
  const [commentText, setCommentText] = useState<string>("");
  // simple save confirmation message
  const [saveMsg, setSaveMsg] = useState<string>("");
  // loading state
  const [loading, setLoading] = useState<boolean>(true);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";

  // Fetch task detail on mount and when task_uid changes
  useEffect(() => {
    const fetchTaskDetail = async () => {
      try {
        const response = await axios.get(`${apiBase}/api/tasks/${task_uid}`, {
          headers: {
            Authorization: `Bearer ${auth_token}`,
          },
        });
        setTaskDetail(response.data);
      } catch (error) {
        console.error("Error fetching task details:", error);
      } finally {
        setLoading(false);
      }
    };
    if (task_uid && auth_token) {
      fetchTaskDetail();
    }
  }, [task_uid, auth_token, apiBase]);

  // Function to set edit mode
  const enableInlineEditing = () => {
    setEditMode(true);
  };

  // Function to update task detail field on blur (auto-save)
  const handleFieldBlur = async (field: string, value: string) => {
    if (!taskDetail) return;
    // Only update if value changed
    if ((taskDetail as any)[field] === value) return;
    const updatedTask = { ...taskDetail, [field]: value };
    setTaskDetail(updatedTask);
    try {
      // Call PATCH /api/tasks/{task_uid} to update task details
      const response = await axios.patch(`${apiBase}/api/tasks/${task_uid}`, { [field]: value }, {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      });
      setTaskDetail(response.data);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Function to delete task
  const deleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`${apiBase}/api/tasks/${task_uid}`, {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      });
      // After deletion, navigate back to project detail view preserving context
      if (taskDetail && taskDetail.project_uid) {
        navigate(`/project/${taskDetail.project_uid}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Function to mark task complete
  const markTaskComplete = async () => {
    try {
      const response = await axios.patch(`${apiBase}/api/tasks/${task_uid}/status`, { status: "completed" }, {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      });
      setTaskDetail(response.data);
      setSaveMsg("Task marked as complete!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (error) {
      console.error("Error marking task complete:", error);
    }
  };

  // Function to add a new comment
  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const response = await axios.post(`${apiBase}/api/tasks/${task_uid}/comments`, { content: commentText }, {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      });
      // Append new comment to taskDetail.comments array
      if (taskDetail) {
        setTaskDetail({
          ...taskDetail,
          comments: taskDetail.comments ? [response.data, ...taskDetail.comments] : [response.data],
        });
      }
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Toggle display of sub-tasks list
  const toggleSubtasksVisibility = () => {
    setShowSubtasks(!showSubtasks);
  };

  return (
    <>
      {loading ? (
        <div className="p-4 text-center">Loading task details...</div>
      ) : !taskDetail ? (
        <div className="p-4 text-center text-red-500">Task not found.</div>
      ) : (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded">
          {/* Header with Back Link */}
          <div className="flex justify-between items-center mb-4">
            <Link to={taskDetail.project_uid ? `/project/${taskDetail.project_uid}` : "/dashboard"} className="text-blue-500 hover:underline">
              ← Back to Project
            </Link>
            <div className="flex space-x-2">
              <button onClick={enableInlineEditing} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
              <button onClick={deleteTask} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
              <button onClick={markTaskComplete} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Mark as Complete</button>
            </div>
          </div>
          {/* Save Confirmation Message */}
          {saveMsg && <div className="mb-2 text-green-600">{saveMsg}</div>}
          {/* Task Detail Fields */}
          <div className="space-y-4">
            <div>
              <label className="font-bold">Title:</label>
              {editMode ? (
                <input
                  type="text"
                  value={taskDetail.title}
                  onChange={(e) => setTaskDetail({ ...taskDetail, title: e.target.value })}
                  onBlur={(e) => handleFieldBlur("title", e.target.value)}
                  className="w-full border px-2 py-1"
                  onDoubleClick={enableInlineEditing}
                />
              ) : (
                <p onDoubleClick={enableInlineEditing} className="px-2 py-1">{taskDetail.title}</p>
              )}
            </div>
            <div>
              <label className="font-bold">Description:</label>
              {editMode ? (
                <textarea
                  value={taskDetail.description}
                  onChange={(e) => setTaskDetail({ ...taskDetail, description: e.target.value })}
                  onBlur={(e) => handleFieldBlur("description", e.target.value)}
                  className="w-full border px-2 py-1"
                  onDoubleClick={enableInlineEditing}
                />
              ) : (
                <p onDoubleClick={enableInlineEditing} className="px-2 py-1">{taskDetail.description}</p>
              )}
            </div>
            <div>
              <label className="font-bold">Due Date/Time:</label>
              {editMode ? (
                <input
                  type="datetime-local"
                  value={taskDetail.due_date}
                  onChange={(e) => setTaskDetail({ ...taskDetail, due_date: e.target.value })}
                  onBlur={(e) => handleFieldBlur("due_date", e.target.value)}
                  className="w-full border px-2 py-1"
                  onDoubleClick={enableInlineEditing}
                />
              ) : (
                <p onDoubleClick={enableInlineEditing} className="px-2 py-1">{new Date(taskDetail.due_date).toLocaleString()}</p>
              )}
            </div>
            <div>
              <label className="font-bold">Priority:</label>
              {editMode ? (
                <select
                  value={taskDetail.priority}
                  onChange={(e) => setTaskDetail({ ...taskDetail, priority: e.target.value })}
                  onBlur={(e) => handleFieldBlur("priority", e.target.value)}
                  className="w-full border px-2 py-1"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <p onDoubleClick={enableInlineEditing} className="px-2 py-1">{taskDetail.priority}</p>
              )}
            </div>
            <div>
              <label className="font-bold">Status:</label>
              {editMode ? (
                <input
                  type="text"
                  value={taskDetail.status}
                  onChange={(e) => setTaskDetail({ ...taskDetail, status: e.target.value })}
                  onBlur={(e) => handleFieldBlur("status", e.target.value)}
                  className="w-full border px-2 py-1"
                  onDoubleClick={enableInlineEditing}
                />
              ) : (
                <p onDoubleClick={enableInlineEditing} className="px-2 py-1">{taskDetail.status}</p>
              )}
            </div>
          </div>
          {/* Sub-Tasks Section */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={toggleSubtasksVisibility}>
              <h2 className="font-bold">Sub-Tasks</h2>
              <span className="text-blue-500">{showSubtasks ? "Hide" : "Show"}</span>
            </div>
            {showSubtasks && taskDetail.sub_tasks && taskDetail.sub_tasks.length > 0 ? (
              <ul className="mt-2 list-disc list-inside">
                {taskDetail.sub_tasks.map((subtask) => (
                  <li key={subtask.uid} className="flex items-center">
                    <input type="checkbox" checked={subtask.completed} readOnly className="mr-2" />
                    <span>{subtask.title}</span>
                  </li>
                ))}
              </ul>
            ) : showSubtasks ? (
              <p className="mt-2 text-gray-500">No sub-tasks available.</p>
            ) : null}
          </div>
          {/* Comments Section */}
          <div className="mt-6 border-t pt-4">
            <h2 className="font-bold mb-2">Comments</h2>
            <form onSubmit={addComment} className="mb-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full border px-2 py-1"
              />
              <button type="submit" className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Submit Comment
              </button>
            </form>
            {taskDetail.comments && taskDetail.comments.length > 0 ? (
              <ul className="space-y-3">
                {taskDetail.comments.map((comm) => (
                  <li key={comm.uid} className="border p-2 rounded">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{comm.user_uid}</span>
                      <span>{new Date(comm.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-gray-800">{comm.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No comments yet.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UV_TaskDetail;