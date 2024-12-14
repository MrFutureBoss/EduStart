// src/components/layout/AppHeader.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Layout, Menu, message, Tooltip } from "antd";
import SubMenu from "antd/es/menu/SubMenu";
import { FaUserCircle } from "react-icons/fa";
import { setLoading } from "../../redux/slice/semesterSlide";
import { setTeacherData } from "../../redux/slice/ClassManagementSlice";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ImProfile } from "react-icons/im";
import { IoSettingsOutline } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";
import { BellFilled } from "@ant-design/icons";
import { setUserLogin } from "../../redux/slice/UserSlice";
import io from "socket.io-client"; // Import Socket.IO client
import { setNotificationData } from "../../redux/slice/NotificationSlice";
import { getAllNotification } from "../../api";
import NotificationDropdown from "../../pages/notification/NotificationDropdown";
import { AnimatePresence } from "framer-motion";

const socket = io(BASE_URL);
const { Header } = Layout;

const MentorHeader = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.user.userLogin);
  const notificationData = useSelector(
    (state) => state.notification.notificationData
  );
  const dropdownRef = useRef(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // State to open/close notification dropdown

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );
  console.log(userLogin);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        message.error("Lỗi khi tải thông tin người dùng.");
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    navigate("/");
    localStorage.clear();
  };

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
      const filters = notification.filters || {};
      if (userLogin.role === 4) {
        // Sinh viên: Chỉ hiển thị thông báo liên quan đến lớp hoặc nhóm
        return filters.classId || filters.groupId;
      } else if (userLogin.role === 2) {
        // Giáo viên: Chỉ hiển thị thông báo liên quan đến dự án
        return filters.groupId;
      } else if (userLogin.role === 3) {
        // Giáo viên: Chỉ hiển thị thông báo liên quan đến dự án
        return filters.groupId;
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
    navigate("/mentor/managegroup");
  };
  return (
    <div className="navbar">
      <div onClick={clickLogo} className="logo">
        <p className="logo-title">EduStart</p>
      </div>
      <Menu mode="horizontal" className="menu" style={{ height: "100%" }}>
        <SubMenu
          key="sub1"
          title={
            <div
              style={{
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                margin: "0.6rem",
              }}
            >
              <FaUserCircle
                style={{ fontSize: "2rem", marginRight: "1rem" }}
                className="user-circle-icon"
              />
              <span style={{ lineHeight: "1rem" }}>
                Xin chào Mentor!
                <br />{" "}
                {userLogin?.username ? getLastName(userLogin.username) : "N/A"}
              </span>
            </div>
          }
          style={{ margin: "0px", padding: "0px" }}
        >
          <Menu.Item
            key="1"
            style={{ position: "relative", top: 0 }}
            icon={<ImProfile />}
          >
            <Link style={{ textDecoration: "none" }} to={"mentor-profile"}>
              Thông tin của bạn
            </Link>
          </Menu.Item>
          <Menu.Item
            key="2"
            style={{ position: "relative", top: 0 }}
            icon={<IoSettingsOutline />}
          >
            Cài đặt
          </Menu.Item>
          <Menu.Item
            key="3"
            style={{ position: "relative", top: 0 }}
            icon={<CiLogout onClick={handleLogout} />}
            onClick={handleLogout}
          >
            <span style={{ cursor: "pointer" }}>Đăng xuất</span>
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

export default MentorHeader;
