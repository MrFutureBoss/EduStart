import React, { useEffect, useMemo, useState } from "react";
import { Layout, Menu, message, Modal } from "antd";
import { BookOutlined, DashboardOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import "../../style/Layouts/TeacherLayout.css";
import { setUserLogin } from "../../redux/slice/UserSlice";

const { Sider } = Layout;
const { SubMenu } = Menu;

const MentorSidebar = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const jwt = localStorage.getItem("jwt");
  const dispatch = useDispatch();
  const { userLogin } = useSelector((state) => state.user);
  const [hasShownWarning, setHasShownWarning] = useState(false); // Trạng thái theo dõi modal
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await axios.get(`${BASE_URL}/user/profile`, config);
        dispatch(setUserLogin(userRes.data));
        const userStatus = await axios.get(
          `${BASE_URL}/mentor/status/${userRes.data?._id}`,
          config
        );
        if (userStatus.data?.hasUpdated === false && !hasShownWarning) {
          setHasShownWarning(true);
          Modal.warning({
            title: "Cập nhật thông tin",
            content:
              "Bạn chưa cập nhật đầy đủ thông tin về lĩnh vực hoặc chuyên môn. Vui lòng cập nhật ngay để tiếp tục sử dụng hệ thống.",
            onOk: () =>
              navigate("mentor-profile", { state: { fromWarning: true } }),
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        message.error("Lỗi khi tải thông tin người dùng.");
      }
    };

    fetchUserData();
  }, [config, dispatch, hasShownWarning, navigate]);

  const checkUpdate = () => {
    setHasShownWarning(false);
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
        marginTop: 10,
      }}
    >
      <Menu
        // theme="dark"
        mode="inline"
        defaultSelectedKeys={["managegroup"]}
        selectedKeys={[selectedKey]}
        style={{ height: "100%", borderRight: 0, padding: 10 }}
      >
        <Menu.Item
          key="managegroup"
          style={{ marginLeft: 2 }}
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
                d="M15 8C15 9.65685 13.6569 11 12 11C10.3431 11 9 9.65685 9 8C9 6.34315 10.3431 5 12 5C13.6569 5 15 6.34315 15 8Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M16 4C17.6568 4 19 5.34315 19 7C19 8.22309 18.268 9.27523 17.2183 9.7423"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M13.7143 14H10.2857C7.91876 14 5.99998 15.9188 5.99998 18.2857C5.99998 19.2325 6.76749 20 7.71426 20H16.2857C17.2325 20 18 19.2325 18 18.2857C18 15.9188 16.0812 14 13.7143 14Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17.7143 13C20.0812 13 22 14.9188 22 17.2857C22 18.2325 21.2325 19 20.2857 19"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M8 4C6.34315 4 5 5.34315 5 7C5 8.22309 5.73193 9.27523 6.78168 9.7423"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M3.71429 19C2.76751 19 2 18.2325 2 17.2857C2 14.9188 3.91878 13 6.28571 13"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
        >
          <Link
            onClick={checkUpdate}
            style={{ textDecoration: "none" }}
            to="managegroup"
          >
            Quản lý nhóm
          </Link>
        </Menu.Item>
        <Menu.Item
          key="project-suggest"
          style={{ marginLeft: 2 }}
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
                d="M3.5 9V14C3.5 17.7712 3.5 19.6569 4.67157 20.8284C5.84315 22 7.72876 22 11.5 22H12.5C16.2712 22 18.1569 22 19.3284 20.8284C20.5 19.6569 20.5 17.7712 20.5 14V10C20.5 6.22876 20.5 4.34315 19.3284 3.17157C18.1569 2 16.2712 2 12.5 2H12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M13.5 17H17.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M13.5 7H17.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M13.5 12H17.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6.5 16.5C6.5 16.5 7.46758 16.7672 8 18C8 18 9 15 11 14"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M10 5H3.5M10 5C10 4.15973 7.67332 2.58984 7.08333 2M10 5C10 5.84027 7.67331 7.41016 7.08333 8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
        >
          <Link
            onClick={checkUpdate}
            style={{ textDecoration: "none" }}
            to="project-suggest"
          >
            Lựa chọn dự án muốn hỗ trợ.
          </Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default MentorSidebar;
