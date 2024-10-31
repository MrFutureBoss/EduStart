import React from "react";
import { notification } from "antd";

const TeacherNotification = ({
  type = "info",
  title = "Notification Title",
  description = "This is the content of the notification.",
  triggerNotification,
}) => {
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (
    notificationType = type,
    notificationTitle = title,
    notificationDescription = description
  ) => {
    api[notificationType]({
      message: notificationTitle,
      description: notificationDescription,
    });
  };

  React.useEffect(() => {
    if (triggerNotification) {
      openNotification(type, title, description);
    }
  }, [triggerNotification, type, title, description]);

  return <>{contextHolder}</>;
};

export default TeacherNotification;
