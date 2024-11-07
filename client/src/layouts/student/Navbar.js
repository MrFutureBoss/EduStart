// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { Menu, message } from "antd";
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

const { SubMenu } = Menu;

const Navbar = () => {
  const [toggleCollapse, setToggleCollapse] = useState(false); // State for icon size toggle
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userLogin } = useSelector((state) => state.user);
  const jwt = localStorage.getItem("jwt");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };

  const handleLogout = () => {
    navigate("/");
    localStorage.removeItem("jwt");
  };

  // Fetch teacher data from API when Navbar is mounted
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        message.error("Lỗi khi tải thông tin người dùng.");
      }
    };

    fetchTeacherData();
  }, []);

  return (
    <div className="navbar">
      <div className="logo">
        <h2>Edu Start</h2>
      </div>
      <Menu mode="horizontal" defaultSelectedKeys={["4"]} className="menu">
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
                Welcome! {userLogin?.username || "Guest"}
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
        <Menu.Item key="4">
          <Link style={{ textDecoration: "none" }} to="/a">
            Trang chủ
          </Link>
        </Menu.Item>
        <Menu.Item key="5">
          <Link style={{ textDecoration: "none" }} to="class">
            Lớp của bạn
          </Link>
        </Menu.Item>
        <Menu.Item key="6">
          <Link style={{ textDecoration: "none" }} to="group-detail">
            Nhóm
          </Link>
        </Menu.Item>
        <Menu.Item key="7">
          <Link style={{ textDecoration: "none" }} to="/contact">
            Liên hệ
          </Link>
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default Navbar;
