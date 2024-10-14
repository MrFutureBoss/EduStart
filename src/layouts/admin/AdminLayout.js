import React, { useEffect, useState } from "react";
import { Layout, Menu, message } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UsergroupAddOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useNavigate } from "react-router-dom"; // Import Outlet
import { useDispatch } from "react-redux";
import {
  setCounts,
  setCurrentSemester,
  setError,
  setLoading,
  setSemester,
  setSemesterName,
  setSemesters,
  setSid,
  setUsersInSmt,
} from "../../redux/slice/semesterSlide";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";

const { Header, Content, Sider } = Layout;

const AdminLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    const fetchSemesters = async () => {
      dispatch(setLoading(true));
      try {
        const response = await axios.get(`${BASE_URL}/semester/all`);
        dispatch(setSemesters(response.data));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchSemesters();
  }, [dispatch]);
  const handlefetchCurrentSemesters = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get(`${BASE_URL}/semester/current`);
      const semester = response.data;
      dispatch(setSid(semester._id));
      dispatch(setSemesterName(semester.name));
      dispatch(setCurrentSemester(semester));
      dispatch(setSemester(semester));
      dispatch(
        setCounts({
          studentCount: semester.studentCount,
          teacherCount: semester.teacherCount,
          mentorCount: semester.mentorCount,
          classCount: semester.classCount,
          endDate: semester.endDate,
          startDate: semester.startDate,
          semesterName: semester.name,
          status: semester.status,
        })
      );

      const userResponse = await axios.get(
        `${BASE_URL}/semester/${semester._id}/users`
      );
      dispatch(setUsersInSmt(userResponse.data));
      navigate("/current-semester");
    } catch (error) {
      console.error("Error fetching current semester:", error);
      message.error("Không tìm thấy kỳ học đang diễn ra.");
    } finally {
      dispatch(setLoading(false));
    }
  };
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        className="header"
        style={{
          background: "#002140",
          padding: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="logo"
          style={{
            color: "#fff",
            paddingLeft: "20px",
            fontSize: "20px",
            flex: 1,
          }}
        >
          Admin System
        </div>
        <div
          onClick={toggleCollapse}
          style={{ paddingRight: "20px", cursor: "pointer" }}
        >
          {collapsed ? (
            <MenuUnfoldOutlined style={{ color: "#fff", fontSize: "20px" }} />
          ) : (
            <MenuFoldOutlined style={{ color: "#fff", fontSize: "20px" }} />
          )}
        </div>
      </Header>
      <Layout>
        <Sider
          width={270}
          collapsible
          collapsed={collapsed}
          onCollapse={toggleCollapse}
          className="site-layout-background"
          style={{
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
            overflowY: "auto",
          }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            style={{ height: "100%", borderRight: 0, padding: 10 }}
          >
            <Menu.Item key="1" icon={<DashboardOutlined />}>
              <Link style={{ textDecoration: "none" }} to="/">
                Dashboard
              </Link>
            </Menu.Item>
            <Menu.Item
              key="2"
              icon={<CalendarOutlined />}
              onClick={handlefetchCurrentSemesters}
            >
              Kỳ học hiện tại
            </Menu.Item>
            <Menu.Item key="3" icon={<UsergroupAddOutlined />}>
              <Link style={{ textDecoration: "none" }} to="/pending-user">
                Sinh viên chưa có lớp
              </Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<UnorderedListOutlined />}>
              <Link style={{ textDecoration: "none" }} to="/semester-list">
                Danh sách kỳ học
              </Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ paddingRight: "23px", background: "#f0f2f5" }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 30,
              margin: 0,
              minHeight: 280,
              background: "#fff",
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
