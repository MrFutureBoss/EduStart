import React, { useEffect, useMemo } from "react";
import { Layout, Menu, message } from "antd";
import {
  BookOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setTeacherData,
} from "../../redux/slice/ClassManagementSlice";
import "../../style/Layouts/TeacherLayout.css";
import { FaUserCircle } from "react-icons/fa";
import { ImProfile } from "react-icons/im";
import { IoSettingsOutline } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";
import { FaClipboardList } from "react-icons/fa";
import { GrGroup } from "react-icons/gr";
import { MdSupportAgent } from "react-icons/md";
import { setUserLogin } from "../../redux/slice/UserSlice";

const { Sider } = Layout;
const { SubMenu } = Menu;

const MentorSidebar = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const { userLogin } = useSelector((state) => state.user);

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

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
    localStorage.removeItem("jwt");
  };

  return (
    <Sider
      width={270}
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapse}
      className="site-layout-background"
      style={{
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
      }}
    >
      <Menu
        // theme="dark"
        mode="inline"
        defaultSelectedKeys={["4"]}
        // defaultOpenKeys={["sub1"]}
        style={{ height: "100%", borderRight: 0, padding: 10 }}
      >
        <SubMenu
          key="sub1"
          icon={
            <FaUserCircle
              style={{ fontSize: toggleCollapse ? "1.2rem" : "1.4rem" }}
              className="user-circle-icon"
            />
          }
          title={
            <div style={{ height: "100%", overflow: "hidden" }}>
              <p
                style={{
                  height: "50%",
                  margin: 0,
                  fontSize: "0.8rem",
                  lineHeight: "1.2rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Welcome! {userLogin?.username}
              </p>
              <p
                style={{
                  height: "50%",
                  margin: 0,
                  fontSize: "0.7rem",
                  lineHeight: "1.2rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userLogin?.email}
              </p>
            </div>
          }
          style={{ margin: "0px", padding: "0px" }}
        >
          <Menu.Item
            key="1"
            icon={<ImProfile className={toggleCollapse ? "" : "custom-icon"} />}
          >
            Thông tin của bạn
          </Menu.Item>
          <Menu.Item
            key="2"
            icon={
              <IoSettingsOutline
                className={toggleCollapse ? "" : "custom-icon"}
              />
            }
          >
            Cài đặt
          </Menu.Item>
          <Menu.Item
            key="3"
            icon={
              <CiLogout
                className={toggleCollapse ? "" : "custom-icon"}
                onClick={handleLogout}
              />
            }
            onClick={handleLogout}
          >
            <span style={{ cursor: "pointer" }}>Đăng xuất</span>
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="4" icon={<DashboardOutlined />}>
          <Link style={{ textDecoration: "none" }} to="mentor-dashboard">
            Dashboard
          </Link>
        </Menu.Item>
        <Menu.Item key="5" icon={<DashboardOutlined />}>
          <Link style={{ textDecoration: "none" }} to="managegroup">
            Quản lý nhóm
          </Link>
        </Menu.Item>
        <Menu.Item key="6" icon={<DashboardOutlined />}>
          <Link style={{ textDecoration: "none" }} to="project-suggest">
            Lựa chọn dự án ưu tiên.
          </Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default MentorSidebar;
