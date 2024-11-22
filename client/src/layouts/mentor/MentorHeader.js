// src/components/layout/AppHeader.js
import React, { useEffect, useMemo } from "react";
import { Layout, Menu, message, Tooltip } from "antd";
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

const { Header } = Layout;

const MentorHeader = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.user.userLogin);
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
    localStorage.removeItem("jwt");
  };

  return (
    <div className="navbar">
      <div className="logo">
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
                <br /> {userLogin?.username}
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
        <Menu.Item key="4">
          <Link style={{ textDecoration: "none" }} to="/contact">
            <BellFilled style={{ fontSize: "1.5rem" }} className="bell-icon" />
          </Link>
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default MentorHeader;
