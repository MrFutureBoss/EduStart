import React, { useEffect, useMemo } from "react";
import { Layout, Menu } from "antd";
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

const { Sider } = Layout;
const { SubMenu } = Menu;

const TeacherSider = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const { teacher } = useSelector((state) => state.classManagement);

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

    fetchUserData();
  }, [userId, config, dispatch]);

  const handleLogout = () => {
    navigate("/");
    localStorage.removeItem("jwt");
  };

  const handleSubMenuClick = () => {
    navigate("teacher-activity");
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
        // overflow: 'auto',
        // height: '100vh',
        // position: 'fixed',
        // insetInlineStart: 0,
        // top: 0,
        // bottom: 0,
        // scrollbarWidth: 'thin',
        // scrollbarColor: 'unset',
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
                Welcome! {teacher?.username}
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
                {teacher?.email}
              </p>
            </div>
          }
          style={{ margin: "0px", padding: "0px" }}
        >
          <Menu.Item
            
            key="1"
            icon={<ImProfile className={toggleCollapse ? "" : "custom-icon"} />}
          >
            <Link to="/teacher-dashboard/teacher">Thông tin của bạn</Link>
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
          <Link style={{ textDecoration: "none" }} to="teacher-activity">
            Dashboard
          </Link>
        </Menu.Item>
        {teacher?.classList?.length > 0 ? (
          <SubMenu
            key="sub2"
            icon={<GrGroup className="custom-icon" />}
            title="Lớp học"
            style={{ margin: "0px", padding: "0px" }}
          >
            {teacher?.classList?.length > 0 &&
              teacher.classList.map((cl, index) => (
                <Menu.Item
                  key={index}
                  icon={
                    <GrGroup className={toggleCollapse ? "" : "custom-icon"} />
                  }
                >
                  <Link
                    key={cl._id}
                    style={{ textDecoration: "none" }}
                    to={`class/${cl.className}`}
                  >
                    {cl.className}
                  </Link>
                </Menu.Item>
              ))}
          </SubMenu>
        ) : (
          <></>
        )}

        <SubMenu
          key="sub3"
          icon={
            <FaClipboardList className={toggleCollapse ? "" : "custom-icon"} />
          }
          title="Hoạt động chung"
          style={{ margin: "0px", padding: "0px" }}
        >
          <Menu.Item key="6" icon={<BookOutlined />}>
            <Link style={{ textDecoration: "none" }} to="posts">
              Bài đăng
            </Link>
          </Menu.Item>
          <Menu.Item key="7" icon={<FileDoneOutlined />}>
            <Link style={{ textDecoration: "none" }} to="assignments">
              Bài tập
            </Link>
          </Menu.Item>
          <Menu.Item key="8" icon={<FileTextOutlined />}>
            <Link style={{ textDecoration: "none" }} to="materials">
              Tài liệu chung
            </Link>
          </Menu.Item>
        </SubMenu>
        <SubMenu
          key="sub4"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={19}
              height={19}
              color={"#000000"}
              fill={"none"}
            >
              <path
                d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12.8638 7.72209L13.7437 9.49644C13.8637 9.74344 14.1837 9.98035 14.4536 10.0257L16.0485 10.2929C17.0684 10.4643 17.3083 11.2103 16.5734 11.9462L15.3335 13.1964C15.1236 13.4081 15.0086 13.8164 15.0736 14.1087L15.4285 15.6562C15.7085 16.8812 15.0636 17.355 13.9887 16.7148L12.4939 15.8226C12.2239 15.6613 11.7789 15.6613 11.504 15.8226L10.0091 16.7148C8.93925 17.355 8.28932 16.8761 8.56929 15.6562L8.92425 14.1087C8.98925 13.8164 8.87426 13.4081 8.66428 13.1964L7.42442 11.9462C6.6945 11.2103 6.92947 10.4643 7.94936 10.2929L9.54419 10.0257C9.80916 9.98035 10.1291 9.74344 10.2491 9.49644L11.129 7.72209C11.609 6.7593 12.3889 6.7593 12.8638 7.72209Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          title="Mức độ ưu tiên Mentor"
          style={{ margin: "0px", padding: "0px" }}
        >
          <Menu.Item
            key="9"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={19}
                height={19}
                color={"#000000"}
                fill={"none"}
              >
                <path
                  d="M3 5.5L12 5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M3 12L12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M3 18.5L12 18.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M21 5.5H16M17.0417 8L19.9583 3M19.9583 8L17.0417 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 18.5H16M17.0417 21L19.9583 16M19.9583 21L17.0417 16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            <Link
              style={{ textDecoration: "none" }}
              to="dashboard-choose-mentor"
            >
              Tổng quan
            </Link>
          </Menu.Item>
          <Menu.Item
            key="10"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={19}
                height={19}
                color={"#000000"}
                fill={"none"}
              >
                <path
                  d="M5.18007 15.2964C3.92249 16.0335 0.625213 17.5386 2.63348 19.422C3.6145 20.342 4.7071 21 6.08077 21H13.9192C15.2929 21 16.3855 20.342 17.3665 19.422C19.3748 17.5386 16.0775 16.0335 14.8199 15.2964C11.8709 13.5679 8.12906 13.5679 5.18007 15.2964Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 7C14 9.20914 12.2091 11 10 11C7.79086 11 6 9.20914 6 7C6 4.79086 7.79086 3 10 3C12.2091 3 14 4.79086 14 7Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M19.5183 3.43325L20.0462 4.49786C20.1182 4.64606 20.3102 4.78821 20.4722 4.81543L21.4291 4.97573C22.041 5.07856 22.185 5.52618 21.744 5.96775L21.0001 6.71781C20.8741 6.84484 20.8051 7.08982 20.8441 7.26524L21.0571 8.19375C21.2251 8.92869 20.8381 9.21299 20.1932 8.82889L19.2963 8.29356C19.1343 8.19677 18.8674 8.19677 18.7024 8.29356L17.8055 8.82889C17.1636 9.21299 16.7736 8.92567 16.9416 8.19375L17.1546 7.26524C17.1935 7.08982 17.1246 6.84484 16.9986 6.71781L16.2547 5.96775C15.8167 5.52618 15.9577 5.07856 16.5696 4.97573L17.5265 4.81543C17.6855 4.78821 17.8775 4.64606 17.9495 4.49786L18.4774 3.43325C18.7654 2.85558 19.2333 2.85558 19.5183 3.43325Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            <Link style={{ textDecoration: "none" }} to="choose-mentor">
              Lựa chọn độ ưu tiên của Mentor
            </Link>
          </Menu.Item>
        </SubMenu>
        <Menu.Item
          key="12"
          icon={
            <MdSupportAgent
              style={{ fontSize: "1.5em" }}
              className={toggleCollapse ? "" : "custom-icon"}
            />
          }
        >
          <Link style={{ textDecoration: "none" }} to="professionmanagement">
            Hỗ trợ
          </Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default TeacherSider;
