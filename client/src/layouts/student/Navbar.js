import React, { useEffect, useState, useRef } from "react";
import { Menu, message, Badge } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { ImProfile } from "react-icons/im";
import { IoSettingsOutline } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import "./Navbar.css";
import { setUserLogin } from "../../redux/slice/UserSlice";
import { useDispatch, useSelector } from "react-redux";
import { BellFilled } from "@ant-design/icons";
import NotificationDropdown from "../../pages/notification/NotificationDropdown";
import { AnimatePresence } from "framer-motion";
import { getAllNotification } from "../../api";
import { setNotificationData } from "../../redux/slice/NotificationSlice";
import io from "socket.io-client"; // Import Socket.IO client

const socket = io(BASE_URL);

const { SubMenu } = Menu;

const Navbar = () => {
  const [toggleCollapse, setToggleCollapse] = useState(false); // State for icon size toggle
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // State to open/close notification dropdown
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const { userLogin } = useSelector((state) => state.user);
  const notificationData = useSelector(
    (state) => state.notification.notificationData
  );

  const jwt = localStorage.getItem("jwt");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
      } catch (error) {
        console.error("Error fetching user data:", error);
        message.error("Lỗi khi tải thông tin người dùng.");
      }
    };

    if (jwt) {
      fetchUserData();
    }
  }, [dispatch, jwt]);

  // Fetch notifications and set up socket
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getAllNotification();
        dispatch(setNotificationData(response.data.notifications || []));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    if (userLogin && userLogin._id) {
      socket.emit("joinRoom", `user:${userLogin._id}`);

      socket.on("notification", (data) => {
        fetchNotifications();
      });

      return () => {
        socket.off("notification");
        socket.emit("leaveRoom", `user:${userLogin._id}`);
      };
    }
  }, [userLogin, dispatch]);

  // Toggle Notification Dropdown
  const toggleNotificationDropdown = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleLogout = () => {
    navigate("/");
    localStorage.removeItem("jwt");
    dispatch(setUserLogin(null)); // Reset user state
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest(".notification-bell-wrapper")
      ) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Lọc thông báo theo user role và filters
  const filteredNotifications = notificationData.filter((notification) => {
    const filters = notification.filters || {};
    if (userLogin.role === 4) {
      // Sinh viên: Chỉ hiển thị thông báo liên quan đến lớp hoặc nhóm
      return filters.classId || filters.groupId;
    } else if (userLogin.role === 2) {
      // Giáo viên: Chỉ hiển thị thông báo liên quan đến dự án
      return filters.groupId;
    }
    return false;
  });

  return (
    <div className="navbar">
      <div className="logo"></div>
      <Menu mode="horizontal" defaultSelectedKeys={["4"]} className="menu">
        <div style={{ position: "relative", left: "-190px" }}>
          <Menu.Item key="4">
            <Link style={{ textDecoration: "none", marginRight: "20px" }} to="">
              Trang chủ
            </Link>
          </Menu.Item>
          <Menu.Item key="5">
            <Link
              style={{ textDecoration: "none", margin: "0 20px" }}
              to="class"
            >
              Lớp của bạn
            </Link>
          </Menu.Item>
          <Menu.Item key="6">
            <Link
              style={{ textDecoration: "none", margin: "0 20px" }}
              to="group-detail"
            >
              Nhóm
            </Link>
          </Menu.Item>
          <Menu.Item key="7">
            <Link
              style={{
                textDecoration: "none",
                marginLeft: "20px",
                marginRight: 40,
              }}
              to="contact"
            >
              Liên hệ
            </Link>
          </Menu.Item>
        </div>
        <SubMenu
          key="sub1"
          title={
            <div
              style={{
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                padding: 5,
              }}
            >
              <FaUserCircle
                style={{ fontSize: "2rem", marginRight: "1rem" }}
                className="user-circle-icon"
              />
              <span style={{ lineHeight: "1.2rem", marginTop: 4 }}>
                Xin chào {userLogin.role === 4 ? "Sinh Viên" : "Giáo Viên"}!
                <br />
                {userLogin?.username}
              </span>
            </div>
          }
          style={{ margin: "0px", padding: "0px" }}
        >
          <Menu.Item key="1" icon={<ImProfile />}>
            <Link style={{ textDecoration: "none" }} to="/profile">
              Thông tin của bạn
            </Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<IoSettingsOutline />}>
            <Link style={{ textDecoration: "none" }} to="/settings">
              Cài đặt
            </Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<CiLogout />} onClick={handleLogout}>
            <span className="logout-text">Đăng xuất</span>
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="8" className="notification-menu-item">
          <div
            className="notification-bell-wrapper"
            onClick={toggleNotificationDropdown}
          >
            <Badge
              count={filteredNotifications.filter((n) => !n.isRead).length}
              overflowCount={99}
              style={{ marginTop: -8, left: 10, transform: "scale(0.8)" }}
            >
              <BellFilled
                style={{ fontSize: "1.5rem" }}
                className="bell-icon"
              />
            </Badge>
          </div>
          <div ref={dropdownRef} className="notification-dropdown-container">
            <AnimatePresence>
              {isNotificationOpen && (
                <NotificationDropdown
                  notifications={filteredNotifications}
                  onClose={() => setIsNotificationOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default Navbar;
