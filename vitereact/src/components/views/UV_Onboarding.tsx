import React, { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

const UV_Onboarding: FC = () => {
  const navigate = useNavigate();
  // State variables based on the provided datamap
  const [current_step, setCurrentStep] = useState<number>(0);
  const [is_skipped, setIsSkipped] = useState<boolean>(false);

  // Define the onboarding steps array with title and description for each step
  const onboarding_steps = [
    {
      title: "Welcome to ProjectPlanner",
      description:
        "Get started with a quick overview of your dashboard and main features. Learn how to navigate and manage your projects efficiently."
    },
    {
      title: "Project Creation",
      description:
        "Create and manage projects effortlessly. Use our intuitive project creation interface to set up your projects with ease."
    },
    {
      title: "Task Management",
      description:
        "Manage tasks easily, assign them to your team, and update their statuses. Drag and drop tasks to update their progress in real-time."
    }
  ];

  // Action: moves to the next step; if it is the final step, finish the tour
  const nextStep = () => {
    if (current_step < onboarding_steps.length - 1) {
      setCurrentStep(current_step + 1);
    } else {
      finishTour();
    }
  };

  // Action: skip the tour and navigate to the Dashboard
  const skipTour = () => {
    setIsSkipped(true);
    // Optionally, log the skip event via a backend call:
    // fetch(`${import.meta.env.VITE_API_BASE_URL}/api/log-onboarding-skip`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skipped: true, timestamp: new Date().toISOString() }) });
    navigate("/dashboard");
  };

  // Action: complete the tour and navigate to the Dashboard
  const finishTour = () => {
    // Optionally, log the finish event via a backend call
    // fetch(`${import.meta.env.VITE_API_BASE_URL}/api/log-onboarding-finish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ finished: true, timestamp: new Date().toISOString() }) });
    navigate("/dashboard");
  };

  // Render all HTML nodes in one big fragment as per requirements.
  return (
    <>
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 w-11/12 md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">
            {onboarding_steps[current_step].title}
          </h2>
          <p className="mb-6">
            {onboarding_steps[current_step].description}
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={skipTour}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Skip Tour
            </button>
            {current_step < onboarding_steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Next
              </button>
            ) : (
              <button
                onClick={finishTour}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Onboarding;