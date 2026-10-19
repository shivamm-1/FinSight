import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const INACTIVITY_LIMIT = 10 * 60 * 1000;

function useInactivityLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");

    if (!token) {
      return;
    }

    let inactivityTimer;

    function logout() {
      localStorage.removeItem("finsight_token");
      toast("You have been logged out due to 10 minutes of inactivity.");
      navigate("/login", { replace: true });
    }

    function resetTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(logout, INACTIVITY_LIMIT);
    }

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [navigate]);
}

export default useInactivityLogout;
