// src/components/layout/MainLayout.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Layout, message, Spin, Empty } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import AppHeader from "../../layouts/admin/AdminHeader";
import AppSider from "../../layouts/admin/AdminSidebar";
import {
  setCounts,
  setCurrentSemester,
  setDetailSemester,
  setError,
  setLoading,
  setSemester,
  setSemesterName,
  setSemesters,
  setSid,
  setUsersInSmt,
} from "../../redux/slice/semesterSlide";
import { BASE_URL } from "../../utilities/initalValue";
import AdminHeader from "../../layouts/admin/AdminHeader";

const { Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const { currentSemester, semesters, loading, semester } = useSelector(
    (state) => state.semester
  );
  const jwt = localStorage.getItem("jwt");

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleFetchCurrentSemesters = useCallback(async () => {
    if (
      !currentSemester ||
      !currentSemester._id ||
      currentSemester._id !== semester._id
    ) {
      try {
        dispatch(setLoading(true));
        const response = await axios.get(
          `${BASE_URL}/semester/current`,
          config
        );
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
            studentsWithClass: semester.studentsWithClass,
            studentsWithoutClass: semester.studentsWithoutClass,
            teachersWithClassCount: semester.teachersWithClassCount,
            teachersWithoutClassCount: semester.teachersWithoutClassCount,
            classesWithStudentsCount: semester.classesWithStudentsCount,
            classesWithoutStudentsCount: semester.classesWithoutStudentsCount,
          })
        );
        dispatch(
          setDetailSemester({
            classesWithStudentsList: semester.details.classesWithStudentsList,
            classesWithoutStudentsList:
              semester.details.classesWithoutStudentsList,
            teachersWithClasses: semester.details.teachersWithClasses,
            teachersWithoutClasses: semester.details.teachersWithoutClasses,
            mentorsWithMatch: semester.details.mentorsWithMatch,
            mentorsWithoutMatch: semester.details.mentorsWithoutMatch,
          })
        );

        const userResponse = await axios.get(
          `${BASE_URL}/semester/${semester._id}/users`,
          config
        );
        dispatch(setUsersInSmt(userResponse.data));
      } catch (error) {
        if (error.response && error.response.status === 404) {
          message.info("Hiện không có kỳ học nào đang diễn ra.");
        } else {
          console.error("Error fetching current semester:", error);
          message.error("Có lỗi xảy ra khi tải thông tin kỳ học.");
        }
      } finally {
        dispatch(setLoading(false));
      }
    }
  }, [dispatch, config, navigate]);

  const fetchSemesters = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await axios.get(`${BASE_URL}/semester/all`, config);
      dispatch(setSemesters(response.data));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, config]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentSemester) {
        await handleFetchCurrentSemesters();
      }
      await fetchSemesters();
    };
    fetchData();
  }, [currentSemester]);

  return (
    <Layout style={{ minHeight: "100vh", overflowX: "hidden" }}>
      <AdminHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />
      <Layout style={{ backgroundColor: "#F7F7F7" }}>
        <AppSider
          collapsed={collapsed}
          currentSemester={currentSemester}
          // handleFetchCurrentSemesters={handleFetchCurrentSemesters}
          toggleCollapse={toggleCollapse}
        />
        <Layout>
          <Content
            className="site-layout-background"
            style={{
              padding: 20,
              margin: 0,
              minHeight: 280,
              background: "#f5f5f5",
              marginTop: 35,
            }}
          >
            {loading ? (
              <Spin
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100vh",
                }}
                tip="Đang tải dữ liệu..."
                size="large"
              />
            ) : (
              <Outlet />
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
