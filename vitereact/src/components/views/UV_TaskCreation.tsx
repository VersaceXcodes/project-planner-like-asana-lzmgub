import React, { useState, KeyboardEvent, ChangeEvent, MouseEvent, FC } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/main";

const UV_TaskCreation: FC = () => {
  // Local state variables
  const [new_task_title, setNewTaskTitle] = useState<string>("");
  const [submission_status, setSubmissionStatus] = useState<string>("idle");
  const [error_message, setErrorMessage] = useState<string>("");

  // Get global state: auth token and current user
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const current_user = useSelector((state: RootState) => state.global.current_user);
  const dispatch = useDispatch();

  // Function to create a new task
  const createTask = async () => {
    // Input validation: task title must not be empty
    if (new_task_title.trim() === "") {
      setErrorMessage("Task title cannot be empty.");
      return;
    }
    setErrorMessage("");
    setSubmissionStatus("pending");

    try {
      // Construct API URL from environment variable
      const api_base_url = import.meta.env.VITE_API_BASE_URL;
      // POST request to create a new task using optimistic UI update
      const response = await axios.post(
        `${api_base_url}/api/tasks`,
        {
          title: new_task_title.trim(),
          // Additional fields can be added as necessary, e.g., status, created_by, etc.
          status: "to_do", // default status for new task
          created_by: current_user ? current_user.uid : "",
          // Optionally, project_uid could be provided if available through context
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth_token}`,
          },
        }
      );
      if (response.status === 201 || response.status === 200) {
        // Optimistically assume that the parent component will update the task list.
        // Here we clear the input field and update submission status.
        setNewTaskTitle("");
        setSubmissionStatus("success");
        // Optionally, dispatch an event or update local/global state to insert the new task into the list.
      } else {
        setSubmissionStatus("error");
        setErrorMessage("Failed to create task. Please try again.");
      }
    } catch (error: any) {
      setSubmissionStatus("error");
      setErrorMessage(
        error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : "An error occurred while creating the task."
      );
    }
  };

  // Handler for key press in input field (Enter key triggers task creation)
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createTask();
    }
  };

  // Handler for input field change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewTaskTitle(e.target.value);
    if (error_message) {
      setErrorMessage("");
    }
  };

  // Handler for button click
  const handleButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    createTask();
  };

  return (
    <>
      <div className="max-w-md mx-auto bg-white shadow-md rounded p-4">
        <h2 className="text-xl font-bold mb-4">Quick Add Task</h2>
        <div className="mb-2">
          <input
            type="text"
            value={new_task_title}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter task title..."
            className="w-full border border-gray-300 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submission_status === "pending"}
          />
        </div>
        {error_message && (
          <div className="mb-2 text-red-500 text-sm">{error_message}</div>
        )}
        {submission_status === "success" && (
          <div className="mb-2 text-green-500 text-sm">
            Task created successfully!
          </div>
        )}
        <div>
          <button
            onClick={handleButtonClick}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            disabled={submission_status === "pending"}
          >
            {submission_status === "pending" ? "Adding..." : "Add Task"}
          </button>
        </div>
      </div>
    </>
  );
};

export default UV_TaskCreation;