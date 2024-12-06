import React, { useEffect, useState, useRef, useMemo } from "react";
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
import { setGroup } from "../../redux/slice/GroupSlice";

const socket = io(BASE_URL);

const { SubMenu } = Menu;

const StudentHeader = () => {
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
      socket.emit("joinRoom", `${userLogin._id}`);

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
    localStorage.clear();
    dispatch(setUserLogin(null)); // Reset user state
    dispatch(setGroup([]));
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

  const filteredNotifications = useMemo(() => {
    if (!userLogin) return []; // Nếu userLogin chưa sẵn sàng, trả về mảng rỗng

    return notificationData.filter((notification) => {
      console.log(notification);
      const filters = notification.filters || {}; // Đảm bảo filters không phải undefined/null
      if (userLogin?.role === 4) {
        // Sinh viên: Chỉ hiển thị thông báo liên quan đến lớp hoặc nhóm
        return (
          filters.classId ||
          filters.groupId != null ||
          notification.type === "classAssignment"
        );
      }
      return false;
    });
  }, [notificationData, userLogin]);

  const getLastName = (fullName) => {
    if (!fullName || typeof fullName !== "string") {
      return "N/A"; // Trả về mặc định nếu không hợp lệ
    }
    const nameParts = fullName.trim().split(" ");
    return nameParts[nameParts.length - 1]; // Lấy phần cuối của mảng
  };
  const clickLogo = () => {
    navigate("/student/dashboard");
  };
  return (
    <div className="navbar">
      <div onClick={clickLogo} className="logo">
        <p className="logo-title">EduStart</p>
      </div>
      <Menu mode="horizontal" defaultSelectedKeys={["4"]} className="menu">
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
                Chào Sinh Viên!
                <br />
                {userLogin?.username ? getLastName(userLogin.username) : "N/A"}
              </span>
            </div>
          }
          style={{ margin: "0px", padding: "0px" }}
        >
          <Menu.Item key="1" icon={<ImProfile />}>
            <Link style={{ textDecoration: "none" }} to="profile">
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

export default StudentHeader;
