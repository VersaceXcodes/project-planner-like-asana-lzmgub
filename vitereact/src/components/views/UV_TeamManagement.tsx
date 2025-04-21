import React, { FC, useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";
import { Link } from "react-router-dom";

const UV_TeamManagement: FC = () => {
  // Access global state variables
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const current_user = useSelector((state: RootState) => state.global.current_user);
  
  // Local state variables for teamMembers and invite_status
  const [team_members, setTeamMembers] = useState<Array<{ uid: string; name: string; role: string; avatar_url?: string }>>([]);
  const [invite_status, setInviteStatus] = useState<string>("idle");
  
  // Local state for the add member form
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberRole, setNewMemberRole] = useState<string>("Member");
  const [newMemberAvatarUrl, setNewMemberAvatarUrl] = useState<string>("");

  // Check if current user is allowed to access team management (admin or manager)
  const isAuthorized = current_user && (current_user.role === "admin" || current_user.role === "manager");

  // Function to fetch team members from backend
  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/team/members`, {
        headers: { Authorization: `Bearer ${auth_token}` }
      });
      setTeamMembers(response.data);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  useEffect(() => {
    // Only fetch team members if the user is authorized and authenticated.
    if (auth_token && isAuthorized) {
      fetchTeamMembers();
    }
  }, [auth_token, isAuthorized]);

  // Function to add a new team member
  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      alert("Member name is required");
      return;
    }
    // Build the payload as per backend expectations.
    const payload = {
      name: newMemberName,
      role: newMemberRole,
      avatar_url: newMemberAvatarUrl || `https://picsum.photos/seed/${encodeURIComponent(newMemberName)}/50/50`
    };
    setInviteStatus("loading");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/team/members`,
        payload,
        { headers: { Authorization: `Bearer ${auth_token}` } }
      );
      // Update the team_members list with the new member returned from the backend.
      setTeamMembers(prev => [...prev, response.data]);
      setInviteStatus("idle");
      setNewMemberName("");
      setNewMemberRole("Member");
      setNewMemberAvatarUrl("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding team member:", error);
      setInviteStatus("idle");
      alert("Failed to add team member");
    }
  };

  // Function to remove an existing team member
  const handleRemoveMember = async (member_uid: string) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/team/members/${member_uid}`,
        { headers: { Authorization: `Bearer ${auth_token}` } }
      );
      // Remove from local state
      setTeamMembers(prev => prev.filter(member => member.uid !== member_uid));
    } catch (error) {
      console.error("Error removing team member:", error);
      alert("Failed to remove team member");
    }
  };

  // Function to update the role of an existing team member
  const handleUpdateRole = async (member_uid: string, newRole: string) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/team/members/${member_uid}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${auth_token}` } }
      );
      // Update local team member list with the updated role
      setTeamMembers(prev =>
        prev.map(member =>
          member.uid === member_uid ? { ...member, role: response.data.role } : member
        )
      );
    } catch (error) {
      console.error("Error updating member role:", error);
      alert("Failed to update role");
    }
  };

  return (
    <>
      {isAuthorized ? (
        <div className="p-4 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Team Management</h1>
          {/* Add Member Section */}
          <div className="mb-6">
            {showAddForm ? (
              <form onSubmit={handleAddMember} className="bg-gray-100 p-4 rounded shadow">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMemberName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                    placeholder="Member name"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewMemberRole(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Avatar URL (optional)</label>
                  <input
                    type="text"
                    value={newMemberAvatarUrl}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMemberAvatarUrl(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded p-2"
                    placeholder="https://"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={invite_status === "loading"}
                  >
                    {invite_status === "loading" ? "Adding..." : "Add Member"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Member
              </button>
            )}
          </div>
          {/* Team Members List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {team_members.map(member => (
              <div key={member.uid} className="flex items-center bg-white shadow rounded p-4">
                <img
                  src={member.avatar_url || `https://picsum.photos/seed/${member.uid}/50/50`}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div className="flex-1">
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-gray-500">Role: {member.role}</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <select
                    value={member.role}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleUpdateRole(member.uid, e.target.value)}
                    className="border border-gray-300 rounded p-1 text-sm"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Member">Member</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.uid)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {team_members.length === 0 && (
              <p className="col-span-full text-center text-gray-600">No team members found.</p>
            )}
          </div>
          {/* Link to Dashboard for navigation example */}
          <div className="mt-6">
            <Link to="/dashboard" className="text-blue-600 hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-red-600">
          <p>Access Denied. You do not have the necessary permissions to view this page.</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      )}
    </>
  );
};

export default UV_TeamManagement;