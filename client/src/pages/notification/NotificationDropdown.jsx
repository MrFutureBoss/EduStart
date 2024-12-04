import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileTextOutlined,
  GroupOutlined,
  BookOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import "./Notification.css";
import { Badge, Dropdown, Menu, message } from "antd";
import {
  getAllNotification,
  readedAllNotification,
  readedNotification,
} from "../../api";
import { setNotificationData } from "../../redux/slice/NotificationSlice";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";

const NotificationDropdown = ({ notifications, onClose }) => {
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userLogin } = useSelector((state) => state.user);

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const markAllAsRead = async () => {
    try {
      await readedAllNotification(userLogin._id);
      const response = await getAllNotification();
      dispatch(setNotificationData(response.data.notifications || []));
      message.success("Đã đánh dấu tất cả thông báo là đã đọc.");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      message.error("Có lỗi xảy ra khi đánh dấu thông báo.");
    }
  };

  const handleMenuClick = async (e) => {
    if (e.key === "1") {
      await markAllAsRead();
    } else if (e.key === "2") {
      navigate("/settings");
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="1">Đánh dấu tất cả đã đọc</Menu.Item>
      <Menu.Item key="2">Cài đặt</Menu.Item>
    </Menu>
  );
  console.log();

  const getNotificationType = (filters) => {
    if (filters.groupId)
      return {
        label: "Nhóm",
        icon: <GroupOutlined />,
        navigateTo: `/group/${filters.groupId}`,
      };
    if (filters.classId)
      return {
        label: "Lớp",
        icon: <BookOutlined />,
        navigateTo: `/class/${filters.classId}`,
      };
    return {
      label: "Khác",
      icon: <FileTextOutlined />,
      navigateTo: `/notification`,
    };
  };

  const handleNotificationClick = async (notification) => {
    const filters = notification.filters || {};
    let navigateTo = "/notification";
    console.log("notification", notification);

    if (filters.groupId && userLogin?.role === 4) {
      navigateTo = `group-detail`;
    } else if (filters.classId) {
      navigateTo = `class`;
    } else if (
      filters.groupId &&
      userLogin?.role === 2 &&
      notification.type === "ProjectUpdate"
    ) {
      navigateTo = `project-request?tab=1`;
    } else if (
      filters.groupId &&
      userLogin?.role === 2 &&
      notification.type === "ProjectReUpdate"
    ) {
      navigateTo = `project-request?tab=2`;
    } else if (
      filters.groupId &&
      userLogin?.role === 3 &&
      notification.type === "MatchedNotification"
    ) {
      navigateTo = `managegroup?tab=pending`;
    } else if (
      userLogin?.role === 2 &&
      notification.type === "classAssignment"
    ) {
      navigateTo = `class`;
    } else if (
      userLogin?.role === 4 &&
      notification.type === "classAssignment"
    ) {
      navigateTo = `class`;
    }

    try {
      await readedNotification(notification._id);
      const response = await getAllNotification();
      dispatch(setNotificationData(response.data.notifications || []));
      navigate(navigateTo);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      message.error("Có lỗi xảy ra khi xử lý thông báo.");
    }
  };

  const classNotifications = notifications.filter((n) => n.filters?.classId);
  const groupNotifications = notifications.filter((n) => n.filters?.groupId);
  const otherNotifications = notifications.filter(
    (n) => !n.filters?.classId && !n.filters?.groupId
  );

  const filteredNotifications =
    filterType === "class"
      ? classNotifications
      : filterType === "group"
      ? groupNotifications
      : filterType === "other"
      ? otherNotifications
      : notifications;
  console.log("filteredNotifications", filteredNotifications);

  return (
    <motion.div
      className="notification-dropdown"
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Thanh filter */}
      <div className="main-header-notification">
        <h4 className="notification-header">Thông báo</h4>
        <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
          <button
            className="icon-notification-header"
            onClick={(e) => e.preventDefault()}
          >
            <EllipsisOutlined
              style={{
                fontSize: "25px",
                marginRight: 5,
                position: "relative",
                top: -3,
                right: 1,
              }}
            />
          </button>
        </Dropdown>
      </div>
      <div className="notification-filter">
        <button
          className={`filter-button ${filterType === "all" ? "active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          <p className="filter-button-text">Tất cả</p>
        </button>
        {userLogin.role === 2 && (
          <button
            className={`filter-button ${
              filterType === "class" ? "active" : ""
            }`}
            onClick={() => setFilterType("class")}
          >
            <p className="filter-button-text">Lớp</p>
          </button>
        )}
        {userLogin?.role === 4 && (
          <button
            className={`filter-button ${
              filterType === "class" ? "active" : ""
            }`}
            onClick={() => setFilterType("class")}
          >
            <p className="filter-button-text">Lớp</p>
          </button>
        )}
        <button
          className={`filter-button ${filterType === "group" ? "active" : ""}`}
          onClick={() => setFilterType("group")}
        >
          <p className="filter-button-text">Nhóm</p>
        </button>
        <button
          className={`filter-button ${filterType === "other" ? "active" : ""}`}
          onClick={() => setFilterType("other")}
        >
          <p className="filter-button-text">Hệ Thống</p>
        </button>
      </div>

      {/* Danh sách thông báo */}
      <div className="notification-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const { label, icon } = getNotificationType(
              notification.filters || {}
            );
            return (
              <div
                key={notification._id}
                className={`notification-item ${
                  notification.isRead ? "read" : "unread"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-type">
                  {icon}
                  <span className="title-notification">{label}</span>
                  {!notification.isRead && (
                    <Badge style={{ float: "right" }} color="#f50" dot />
                  )}
                </div>
                <p>{notification.message}</p>
                <p style={{ fontSize: 13 }}>
                  {moment(notification.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
                </p>
              </div>
            );
          })
        ) : (
          <div className="notification-item empty">
            <p>Chưa có thông báo.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationDropdown;
