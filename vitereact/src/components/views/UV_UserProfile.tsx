import React, { FC, useEffect, useState, ChangeEvent, FocusEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { RootState, set_current_user } from "@/store/main";
import { Link } from "react-router-dom";

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  activity_id: string;
  description: string;
  timestamp: string;
}

const UV_UserProfile: FC = () => {
  const dispatch = useDispatch();
  // Access global auth and current user from Redux store
  const auth_token = useSelector((state: RootState) => state.global.auth_token);
  const global_current_user = useSelector((state: RootState) => state.global.current_user);

  // Local state for the view as per datamap
  const [user_profile, setUserProfile] = useState<UserProfile>(
    global_current_user ? {
      uid: global_current_user.uid,
      name: global_current_user.name,
      email: global_current_user.email,
      avatar_url: global_current_user.avatar_url || "",
      created_at: global_current_user.created_at,
      updated_at: global_current_user.updated_at
    } : {
      uid: "",
      name: "",
      email: "",
      avatar_url: "",
      created_at: "",
      updated_at: ""
    }
  );
  const [profile_edit_mode, setProfileEditMode] = useState<boolean>(false);
  const [activity_log, setActivityLog] = useState<Activity[]>([]);
  const [password, setPassword] = useState<string>(""); // for password update

  // When global_current_user changes, update local state accordingly
  useEffect(() => {
    if (global_current_user) {
      setUserProfile({
        uid: global_current_user.uid,
        name: global_current_user.name,
        email: global_current_user.email,
        avatar_url: global_current_user.avatar_url || "",
        created_at: global_current_user.created_at,
        updated_at: global_current_user.updated_at
      });
    }
  }, [global_current_user]);

  // Dummy fetch for activity log (simulate with empty array or static sample)
  useEffect(() => {
    // Here we could call an API endpoint to retrieve activity log
    // For demo, we simulate with a dummy sample if none exists.
    // This sample activity log can be replaced with real API data.
    const sample_log: Activity[] = [
      {
        activity_id: "act1",
        description: "Profile updated",
        timestamp: "2023-10-01T12:00:00Z"
      },
      {
        activity_id: "act2",
        description: "Avatar changed",
        timestamp: "2023-09-28T09:30:00Z"
      }
    ];
    setActivityLog(sample_log);
  }, []);

  // Enable editing mode
  const enableProfileEdit = () => {
    setProfileEditMode(true);
  };

  // Cancel profile editing and revert unsaved changes
  const cancelProfileEdit = () => {
    if (global_current_user) {
      setUserProfile({
        uid: global_current_user.uid,
        name: global_current_user.name,
        email: global_current_user.email,
        avatar_url: global_current_user.avatar_url || "",
        created_at: global_current_user.created_at,
        updated_at: global_current_user.updated_at
      });
    }
    setPassword("");
    setProfileEditMode(false);
  };

  // Submit updated profile changes to the backend 
  const submitProfileChange = async () => {
    if (!user_profile.name || !user_profile.email) {
      alert("Name and email are required.");
      return;
    }
    try {
      // Construct updated data object. Password is sent only if provided.
      const updatedData: any = {
        name: user_profile.name,
        email: user_profile.email,
        avatar_url: user_profile.avatar_url
      };
      if (password) {
        updatedData.password = password;
      }
      // Call the backend PUT endpoint to update the user profile.
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${user_profile.uid}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${auth_token}` }
        }
      );
      // On success, update both global and local state.
      const updatedUser = response.data;
      dispatch(set_current_user(updatedUser));
      setUserProfile({
        uid: updatedUser.uid,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar_url: updatedUser.avatar_url || "",
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      });
      setPassword("");
      setProfileEditMode(false);
      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  // Handle avatar file selection and upload
  const uploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        // Call file upload endpoint (assuming /api/users/{uid}/upload-avatar)
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/${user_profile.uid}/upload-avatar`,
          formData,
          {
            headers: { 
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${auth_token}`
            }
          }
        );
        // Update local state with new avatar URL
        const new_avatar_url = response.data.avatar_url;
        setUserProfile(prev => ({ ...prev, avatar_url: new_avatar_url }));
      } catch (error) {
        console.error("Error uploading avatar:", error);
        alert("Avatar upload failed. Please try again.");
      }
    }
  };

  // Auto-save on blur for a given field (optional auto-save implementation)
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    // We can call submitProfileChange here if desired.
    // For this implementation, we simply do nothing.
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">User Profile &amp; Account Settings</h1>
        {!profile_edit_mode && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={user_profile.avatar_url || "https://picsum.photos/seed/profile/200"}
                alt="User Avatar"
                className="w-24 h-24 rounded-full object-cover border"
              />
              <div>
                <p className="text-xl font-semibold">{user_profile.name}</p>
                <p className="text-gray-600">{user_profile.email}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>Account Created: {new Date(user_profile.created_at).toLocaleString()}</p>
              <p>Last Updated: {new Date(user_profile.updated_at).toLocaleString()}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              {activity_log.length > 0 ? (
                <ul className="list-disc pl-5">
                  {activity_log.map(activity => (
                    <li key={activity.activity_id}>
                      <span>{activity.description} - </span>
                      <span className="text-gray-500 text-xs">{new Date(activity.timestamp).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No recent activity.</p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={enableProfileEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Profile
              </button>
              <Link to="/dashboard" className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
        {profile_edit_mode && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={user_profile.avatar_url || "https://picsum.photos/seed/profile/200"}
                alt="User Avatar"
                className="w-24 h-24 rounded-full object-cover border"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Change Avatar
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="mt-1 block"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={user_profile.name}
                  onChange={(e) => setUserProfile({ ...user_profile, name: e.target.value })}
                  onBlur={handleBlur}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={user_profile.email}
                  onChange={(e) => setUserProfile({ ...user_profile, email: e.target.value })}
                  onBlur={handleBlur}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handleBlur}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Leave blank if no change"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={submitProfileChange}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={cancelProfileEdit}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_UserProfile;