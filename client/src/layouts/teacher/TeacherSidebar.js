import React, { useEffect, useMemo } from "react";
import { Layout, Menu } from "antd";
import {
  BookOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setTeacherData,
} from "../../redux/slice/ClassManagementSlice";
import "../../style/Layouts/TeacherLayout.css";
import { GrGroup } from "react-icons/gr";
import { MdSupportAgent } from "react-icons/md";
import { setStepCheck } from "../../redux/slice/SelectMentorSlice";

const { Sider } = Layout;
const { SubMenu } = Menu;

const TeacherSider = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const { teacher } = useSelector((state) => state.classManagement);
  const location = useLocation();
  const selectedKey = location.pathname.split("/")[2];

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );
  const { stepCheck } = useSelector((state) => state.selectMentor);
  console.log(stepCheck);

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
  const setCheckStep = () => {
    dispatch(setStepCheck(0));
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
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["teacher-dashboard"]}
        style={{
          height: "100%",
          borderRight: 0,
          padding: 10,
          marginTop: "60px",
        }}
      >
        <Menu.Item key="teacher-dashboard" icon={<DashboardOutlined />}>
          <Link style={{ textDecoration: "none" }} to="teacher-dashboard">
            Dashboard
          </Link>
        </Menu.Item>
        {teacher?.classList?.length > 0 ? (
          <Menu.Item key="class" icon={<GrGroup className="custom-icon" />}>
            <Link style={{ textDecoration: "none" }} to="class">
              Quản lý lớp học
            </Link>
          </Menu.Item>
        ) : (
          <></>
        )}
        <Menu.Item
          key="project-request"
          style={{ marginLeft: 1 }}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="19"
              height="19"
              color="#000000"
              fill="none"
            >
              <path
                d="M4 3H3C2.44772 3 2 3.44772 2 4V18L3.5 21L5 18V4C5 3.44772 4.55228 3 4 3Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <path
                d="M21 12.0013V8.00072C21 5.64336 21 4.46468 20.2678 3.73234C19.5355 3 18.357 3 16 3H13C10.643 3 9.46447 3 8.73223 3.73234C8 4.46468 8 5.64336 8 8.00072V16.0019C8 18.3592 8 19.5379 8.73223 20.2703C9.35264 20.8908 10.2934 20.9855 12 21"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12 7H17"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12 11H17"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M14 19C14 19 15.5 19.5 16.5 21C16.5 21 18 17 22 15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M2 7H5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
        >
          <Link style={{ textDecoration: "none" }} to="project-request">
            Duyệt dự án
          </Link>
        </Menu.Item>
        <SubMenu
          key="7"
          icon={
            <StarOutlined
              style={{ fontSize: "1.5em" }}
              className={toggleCollapse ? "" : "custom-icon"}
            />
          }
          title="Mức Độ Ưu Tiên Mentor"
          style={{ padding: "0px", marginLeft: -4 }}
        >
          <Menu.Item
            key="dashboard-choose-mentor"
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
              Tổng Quan
            </Link>
          </Menu.Item>
          <Menu.Item
            key="choose-mentor"
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
            <Link
              onClick={setCheckStep}
              style={{ textDecoration: "none" }}
              to="choose-mentor"
            >
              Lựa Chọn Độ Ưu Tiên
            </Link>
          </Menu.Item>
        </SubMenu>
        <SubMenu
          key="sub5"
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
                d="M22 6.75003H19.2111C18.61 6.75003 18.3094 6.75003 18.026 6.66421C17.7426 6.5784 17.4925 6.41168 16.9923 6.07823C16.2421 5.57806 15.3862 5.00748 14.961 4.87875C14.5359 4.75003 14.085 4.75003 13.1833 4.75003C11.9571 4.75003 11.1667 4.75003 10.6154 4.97839C10.0641 5.20675 9.63056 5.6403 8.76347 6.50739L8.00039 7.27047C7.80498 7.46588 7.70727 7.56359 7.64695 7.66005C7.42335 8.01764 7.44813 8.47708 7.70889 8.80854C7.77924 8.89796 7.88689 8.98459 8.10218 9.15785C8.89796 9.79827 10.0452 9.73435 10.7658 9.00945L12 7.76789H13L19 13.8036C19.5523 14.3592 19.5523 15.2599 19 15.8155C18.4477 16.3711 17.5523 16.3711 17 15.8155L16.5 15.3125M13.5 12.2947L16.5 15.3125M16.5 15.3125C17.0523 15.8681 17.0523 16.7689 16.5 17.3244C15.9477 17.88 15.0523 17.88 14.5 17.3244L13.5 16.3185M13.5 16.3185C14.0523 16.874 14.0523 17.7748 13.5 18.3304C12.9477 18.8859 12.0523 18.8859 11.5 18.3304L10 16.8214M13.5 16.3185L11.5 14.3185M9.5 16.3185L10 16.8214M10 16.8214C10.5523 17.377 10.5523 18.2778 10 18.8334C9.44772 19.3889 8.55229 19.3889 8 18.8334L5.17637 15.9509C4.59615 15.3586 4.30604 15.0625 3.93435 14.9062C3.56266 14.75 3.14808 14.75 2.31894 14.75H2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 14.75H19.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M8.5 6.75003L2 6.75003"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
          title="Chọn Mentor Cho Nhóm"
          style={{ marginLeft: "-4px", padding: "0px" }}
        >
          <Menu.Item
            key="summary-class"
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
                  d="M11 6L21 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M11 12L21 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M11 18L21 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M3 7.39286C3 7.39286 4 8.04466 4.5 9C4.5 9 6 5.25 8 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 18.3929C3 18.3929 4 19.0447 4.5 20C4.5 20 6 16.25 8 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            <Link style={{ textDecoration: "none" }} to="summary-class">
              Tổng Quan
            </Link>
          </Menu.Item>
          <Menu.Item
            key="temp-matching"
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
                  d="M6.08938 14.9992C5.71097 14.1486 5.5 13.2023 5.5 12.2051C5.5 8.50154 8.41015 5.49921 12 5.49921C15.5899 5.49921 18.5 8.50154 18.5 12.2051C18.5 13.2023 18.289 14.1486 17.9106 14.9992"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12 1.99921V2.99921"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 11.9992H21"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 11.9992H2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.0704 4.92792L18.3633 5.63503"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.6368 5.636L4.92969 4.92889"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.517 19.3056C15.5274 18.9788 15.9326 18.054 16.0466 17.1238C16.0806 16.8459 15.852 16.6154 15.572 16.6154L8.47685 16.6156C8.18725 16.6156 7.95467 16.8614 7.98925 17.1489C8.1009 18.0773 8.3827 18.7555 9.45345 19.3056M14.517 19.3056C14.517 19.3056 9.62971 19.3056 9.45345 19.3056M14.517 19.3056C14.3955 21.2506 13.8338 22.0209 12.0068 21.9993C10.0526 22.0354 9.60303 21.0833 9.45345 19.3056"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            <Link style={{ textDecoration: "none" }} to="temp-matching">
              Gợi Ý Ghép Mentor
            </Link>
          </Menu.Item>
        </SubMenu>

        <Menu.Item
          key="15"
          icon={
            <MdSupportAgent
              style={{ fontSize: "1.5em" }}
              className={toggleCollapse ? "" : "custom-icon"}
            />
          }
        >
          <Link style={{ textDecoration: "none" }} to="">
            Hỗ trợ
          </Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default TeacherSider;
