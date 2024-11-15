import React, { useEffect, useState } from "react";
import { notification } from "antd";

const Notification = ({
  type = "info",
  title = "Notification Title",
  description = "This is the content of the notification.",
  triggerNotification,
  showProgress = false,
  pauseOnHover = true,
  onClose,
}) => {
  const [api, contextHolder] = notification.useNotification();
  const [notificationTriggered, setNotificationTriggered] = useState(false);

  const openNotification = (
    notificationType = type,
    notificationTitle = title,
    notificationDescription = description
  ) => {
    api[notificationType]({
      message: notificationTitle,
      description: notificationDescription,
      duration: showProgress ? 8 : null, 
      onClose: () => {
        setNotificationTriggered(false); // Reset trigger
        if (onClose) onClose(); 
      },
      style: {
        transition: pauseOnHover ? "none" : "",
      },
    });
  };

  useEffect(() => {
    if (triggerNotification && !notificationTriggered) {
      openNotification(type, title, description);
      setNotificationTriggered(true); // Mark as triggered
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNotification, notificationTriggered, type, title, description]);

  return <>{contextHolder}</>;
};

export default Notification;
