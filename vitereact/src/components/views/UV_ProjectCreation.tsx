import React, { FC, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";
import { useNavigate, Link } from "react-router-dom";

const UV_ProjectCreation: FC = () => {
  // Get the auth token from the global state store
  const authToken = useSelector((state: RootState) => state.global.auth_token);
  
  // useNavigate hook for navigation
  const navigate = useNavigate();

  // local state for project form
  const [projectForm, setProjectForm] = useState<{
    title: string;
    description: string;
    due_date: string;
    priority: string;
    tags: string[];
    team_members: string[];
    // for editing mode, we might add uid and archived flag but default creation mode here.
    uid?: string;
    archived?: boolean;
  }>({
    title: "",
    description: "",
    due_date: "",
    priority: "",
    tags: [],
    team_members: []
  });

  // local state for form errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Sample team member suggestions (in real apps, would be fetched dynamically)
  const availableTeamMembers = ["alice@example.com", "bob@example.com", "charlie@example.com"];
  
  // Sample priority options
  const priorityOptions = ["High", "Medium", "Low"];

  // Determine if editing mode from projectForm.uid existence
  const isEditing = !!projectForm.uid;

  // Validation function: updates the formErrors state object
  const validateForm = (field?: string, value?: string | string[]) => {
    // make a copy of current errors
    const errors: { [key: string]: string } = { ...formErrors };

    // fields: title, description, due_date, priority are required.
    const requiredFields = ["title", "description", "due_date", "priority"];
    if (field) { 
      // validate single field
      if (requiredFields.includes(field)) {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors[field] = `${field.replace("_", " ")} is required`;
        } else {
          delete errors[field];
        }
      }
    } else {
      // validate entire form if no specific field passed
      requiredFields.forEach((f) => {
        const fieldValue = (projectForm as any)[f];
        if (!fieldValue || (typeof fieldValue === "string" && fieldValue.trim() === "")) {
          errors[f] = `${f.replace("_", " ")} is required`;
        } else {
          delete errors[f];
        }
      });
    }
    setFormErrors(errors);
    // return true if no errors
    return Object.keys(errors).length === 0;
  };

  // Handler for input changes (for text inputs)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectForm((prev) => ({ ...prev, [name]: value }));
    validateForm(name, value);
  };

  // Handler for tags input (comma separated)
  const handleTagsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // split by comma and filter out empty strings
    const tagsArray = value.split(",").map(tag => tag.trim()).filter(tag => tag !== "");
    setProjectForm((prev) => ({ ...prev, tags: tagsArray }));
  };

  // Handler for multi-select for team members
  const handleTeamMembersChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setProjectForm((prev) => ({ ...prev, team_members: options }));
  };

  // Toggle archive/unarchive for editing mode (if applicable)
  const handleArchiveToggle = () => {
    setProjectForm((prev) => ({ ...prev, archived: !prev.archived }));
  };

  // Function to handle form submission
  const submitProject = async (e: FormEvent) => {
    e.preventDefault();
    // validate entire form
    if (!validateForm()) {
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL + "/api/projects";
      // Call the backend to create the project.
      const response = await axios.post(apiUrl, projectForm, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      // On success, navigate to project detail with the created project uid
      const createdProject = response.data;
      navigate(`/project/${createdProject.uid}`);
    } catch (error: any) {
      console.error("Failed to submit project:", error);
      // Optionally set an error message at the form level
      setFormErrors((prev) => ({ ...prev, submit: "Unable to submit project. Please try again." }));
    }
  };

  // Function to cancel project creation and return to previous view
  const cancelProjectCreation = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">
          {isEditing ? "Edit Project" : "Create New Project"}
        </h1>
        <form onSubmit={submitProject} className="space-y-4">
          {/* Project Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input 
              type="text"
              name="title"
              id="title"
              value={projectForm.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Enter project title"
              required
            />
            {formErrors.title && <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>}
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea 
              name="description"
              id="description"
              value={projectForm.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Enter project description"
              rows={4}
              required
            />
            {formErrors.description && <p className="text-red-600 text-sm mt-1">{formErrors.description}</p>}
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input 
              type="date"
              name="due_date"
              id="due_date"
              value={projectForm.due_date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
            {formErrors.due_date && <p className="text-red-600 text-sm mt-1">{formErrors.due_date}</p>}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <select 
              name="priority"
              id="priority"
              value={projectForm.priority}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            >
              <option value="">Select Priority</option>
              {priorityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {formErrors.priority && <p className="text-red-600 text-sm mt-1">{formErrors.priority}</p>}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              id="tags"
              onChange={handleTagsChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="e.g., design, ui, marketing"
            />
          </div>

          {/* Team Members - multi-select auto-suggestions */}
          <div>
            <label htmlFor="team_members" className="block text-sm font-medium text-gray-700">Team Members</label>
            <select
              name="team_members"
              id="team_members"
              multiple
              value={projectForm.team_members}
              onChange={handleTeamMembersChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {availableTeamMembers.map((member) => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>

          {/* Archive/Unarchive toggle for editing mode */}
          {isEditing && (
            <div className="flex items-center">
              <label htmlFor="archiveToggle" className="mr-2 text-sm font-medium text-gray-700">
                {projectForm.archived ? "Unarchive Project" : "Archive Project"}
              </label>
              <button
                type="button"
                id="archiveToggle"
                onClick={handleArchiveToggle}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                {projectForm.archived ? "Unarchive" : "Archive"}
              </button>
            </div>
          )}

          {/* Error message for submission */}
          {formErrors.submit && <p className="text-red-600 text-sm">{formErrors.submit}</p>}

          {/* Action buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? "Save Changes" : "Create Project"}
            </button>
            <button
              type="button"
              onClick={cancelProjectCreation}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
        {/* Link back to Dashboard */}
        <div className="mt-4">
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_ProjectCreation;