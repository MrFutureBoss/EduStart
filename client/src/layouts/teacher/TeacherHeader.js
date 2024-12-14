// src/components/layout/AppHeader.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Layout, Menu, message, Select, Spin, Tooltip } from "antd";
import { FaUserCircle } from "react-icons/fa";
import {
  setCurrentSemester,
  setIsChangeSemester,
  setLoading,
  setSemester,
  setSemesters,
  setSid,
} from "../../redux/slice/semesterSlide";
import { setTeacherData } from "../../redux/slice/ClassManagementSlice";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ImProfile } from "react-icons/im";
import { IoSettingsOutline } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";
import { BellFilled } from "@ant-design/icons";
import { AnimatePresence } from "framer-motion";
import NotificationDropdown from "../../pages/notification/NotificationDropdown";
import io from "socket.io-client"; // Import Socket.IO client
import { setUserLogin } from "../../redux/slice/UserSlice";
import { setNotificationData } from "../../redux/slice/NotificationSlice";
import { getAllNotification } from "../../api";

const socket = io(BASE_URL);

const { SubMenu } = Menu;
const { Option } = Select;

const TeacherHeader = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const { teacher } = useSelector((state) => state.classManagement);
  const notificationData = useSelector(
    (state) => state.notification.notificationData
  );
  const { semesters, semester, isChangeSemester, currentSemester, sid } =
    useSelector((state) => state.semester);
  const { userLogin } = useSelector((state) => state.user);
  const dropdownRef = useRef(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // State to open/close notification dropdown
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );
  console.log(sid);

  const fetchCurrentSemester = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get(`${BASE_URL}/semester/current`, config);
      const semester = response.data;
      dispatch(setSid(semester._id));
      dispatch(setCurrentSemester(semester));
      dispatch(setSemester(semester));
    } catch (error) {
      console.error("Error fetching current semester:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      dispatch(setLoading(true));
      try {
        const response = await axios.get(`${BASE_URL}/user/${userId}`, config);
        // setUserData(response.data);
        dispatch(setTeacherData(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchCurrentSemester();
    fetchUserData();
  }, [userId, config, dispatch]);

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
      socket.emit("joinRoom", userLogin._id);
      socket.on("connect", () => console.log("Socket connected"));
      socket.on("notification", (data) => {
        console.log("Received notification:", data);
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
  const filteredNotifications = useMemo(() => {
    if (!userLogin) return []; // Nếu userLogin chưa sẵn sàng, trả về mảng rỗng

    return notificationData.filter((notification) => {
      const filters = notification.filters || {};
      if (userLogin?.role === 2) {
        // Giáo viên: Chỉ hiển thị thông báo liên quan đến dự án
        return (
          notification.type === "ProjectUpdate" ||
          notification.type === "classAssignment" ||
          notification.type === "ProjectReUpdate"
        );
      }
      return false;
    });
  }, [notificationData, userLogin]);
  const clickLogo = () => {
    navigate("/teacher/dashboard");
  };

  // Chọn kỳ học
  const refreshSemesters = async () => {
    try {
      setIsLoadingSemesters(true);
      const semestersResponse = await axios.get(
        `${BASE_URL}/semester/all`,
        config
      );
      dispatch(setSemesters(semestersResponse.data));
    } catch (error) {
      message.error("Lỗi khi tải danh sách kỳ học.");
      console.error("Error fetching semesters:", error);
    } finally {
      setIsLoadingSemesters(false);
    }
  };

  useEffect(() => {
    if (!semesters || semesters.length === 0) {
      refreshSemesters();
    }
  }, []);

  const handleSemesterChange = async (semesterId) => {
    const selectedSemester = semesters.find(
      (semester) => semester._id === semesterId
    );

    if (!selectedSemester) {
      message.error("Kỳ học không tồn tại.");
      return;
    }
    try {
      dispatch(setSid(semesterId)); // Cập nhật ID kỳ học
      dispatch(setIsChangeSemester(true));
    } catch (error) {
      message.error("Lỗi khi tải thông tin kỳ học.");
      console.log(error.message);
    }
  };

  useEffect(() => {
    if (semesters && semesters.length > 0) {
      // Chỉ auto chọn kỳ nếu chưa có sid và không có sự thay đổi kỳ do người dùng
      if (!sid && !isChangeSemester) {
        if (currentSemester && currentSemester._id) {
          handleSemesterChange(currentSemester._id); // Chọn kỳ hiện tại
        } else {
          handleSemesterChange(semesters[0]._id); // Chọn kỳ đầu tiên
        }
      }
    }
  }, [semesters, currentSemester, sid, isChangeSemester]);

  const filteredSemesters = useMemo(() => {
    if (!searchTerm) {
      return semesters;
    }
    return semesters.filter((semester) =>
      semester.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [semesters, searchTerm]);

  return (
    <div className="navbar">
      <div onClick={clickLogo} className="logo">
        <p className="logo-title">EduStart</p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          position: "absolute",
          left: 269,
          zIndex: 100,
        }}
      >
        <span style={{ fontWeight: "500" }}>Kỳ học:</span>
        <Select
          value={sid} // Sử dụng sid để phản ánh kỳ học được chọn
          onChange={handleSemesterChange}
          style={{ minWidth: "135px" }}
          loading={isLoadingSemesters}
          placeholder="Chọn kỳ học"
          showSearch
          onSearch={(value) => setSearchTerm(value)}
          filterOption={false} // Sử dụng logic lọc của riêng mình
          dropdownStyle={{ maxHeight: 135, overflow: "auto" }}
        >
          {filteredSemesters.map((semester) => {
            // Xác định trạng thái của kỳ học
            const statusColor =
              semester.status === "Ongoing"
                ? "dodgerblue" // Xanh biển
                : semester.status === "Upcoming"
                ? "orange" // Cam
                : "gray"; // Xám

            // Kiểm tra xem có phải kỳ hiện tại hay không
            const isCurrentSemester = semester._id === currentSemester?._id;

            return (
              <Option key={semester._id} value={semester._id}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Badge tròn nhỏ */}
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: statusColor,
                      display: "inline-block",
                      marginRight: "8px",
                    }}
                  />
                  {/* Tên kỳ học */}
                  <span>
                    {semester.name}{" "}
                    {isCurrentSemester && (
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "dodgerblue",
                          marginLeft: "8px",
                        }}
                      >
                        (Kỳ hiện tại)
                      </span>
                    )}
                  </span>
                </div>
              </Option>
            );
          })}
        </Select>

        {isLoadingSemesters && <Spin size="small" />}
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
                Xin chào Giáo viên!
                <br /> {teacher?.username}
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
            <Link style={{ textDecoration: "none" }} to={"profile"}>
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

export default TeacherHeader;
