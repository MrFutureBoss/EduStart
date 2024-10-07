// App.js
import React, { useEffect } from "react";
import SemesterList from "../../components/semester/SemesterList";
import UserListSemester from "../../components/semester/UserList";
import {
  setError,
  setLoading,
  setSemesters,
} from "../../redux/slice/semesterSlide";
import { useDispatch } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../../utilities/initialValue";
import { Layout, Spin } from "antd";

const { Sider, Content } = Layout;

const SemesterIndex = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSemesters = async () => {
      dispatch(setLoading(true));
      try {
        const response = await axios.get(`${BASE_URL}/semester/all`);
        dispatch(setSemesters(response.data));
        dispatch(setLoading(false));
      } catch (err) {
        dispatch(setError(err.message));
        dispatch(setLoading(false));
      }
    };

    fetchSemesters();
  }, [dispatch]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={270}
        style={{
          marginLeft: "20px",
          marginBottom: "20px",
          marginTop: "20px",
          background: "#fff",
          padding: "20px",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          overflowY: "auto",
        }}
      >
        <SemesterList />
      </Sider>
      <Layout style={{ marginLeft: "-20px" }}>
        <Content
          style={{
            margin: "20px",
            padding: "22px",
            background: "#fff",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            overflowY: "auto",
          }}
        >
          <Spin spinning={false}>
            <UserListSemester />
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SemesterIndex;
