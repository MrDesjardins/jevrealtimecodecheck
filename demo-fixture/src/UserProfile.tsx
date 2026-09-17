import { useEffect, useState } from "react";

export function UserProfile({ userId }: { userId: string }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setOnline(navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  return (
    <div>
      <p>
        User {userId} is {online ? "online" : "offline"}.
      </p>
    </div>
  );
}
