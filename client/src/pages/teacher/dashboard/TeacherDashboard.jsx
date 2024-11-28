import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Table,
  Button,
  Tag,
  message,
  List,
} from "antd";
import { TeamOutlined, SolutionOutlined } from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../../utilities/initalValue";
import { useDispatch } from "react-redux";
import { setClassInfoData } from "../../../redux/slice/ClassManagementSlice";
import { setProjects } from "../../../redux/slice/ProjectSlice";
import TeacherSemester from "../../semester/TeacherSemester";

const { Content } = Layout;

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const userId = localStorage.getItem("userId");
  const jwt = localStorage.getItem("jwt");
  const [changingProjects, setChangingProjects] = useState([]);
  useEffect(() => {
    if (userId) {
      fetchProjects();
      fetchChangingProjects();
    }
  }, [dispatch, userId]);
  const fetchProjects = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/project/planning-projects/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log(res.data);

      dispatch(setProjects(res.data));
    } catch (err) {
      message.error("Lỗi khi tải dữ liệu dự án!");
      console.error(err);
    }
  };

  const fetchChangingProjects = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/project/changing-projects/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      setChangingProjects(res.data);
    } catch (err) {
      message.error("Lỗi khi tải dữ liệu dự án cập nhật!");
      console.error(err);
    }
  };
  // Initialize classData with your existing data
  const initialClassData = [
    {
      className: "Lớp SE1714-NJ", // This will be updated from the API
      totalStudents: 30,
      totalGroups: 5,
      issues: [
        {
          type: "Nhóm chưa chốt dự án",
          items: [{ name: "Nhóm 1", link: "/classB/groups-incomplete/nhom1" }],
        },
        {
          type: "Dự án cần duyệt",
          items: [
            { name: "Dự án XYZ", link: "/teacher/project-request?tab=1" },
            { name: "Dự án DEF", link: "/teacher/project-request?tab=1" },
          ],
        },
        {
          type: "Dự án cập nhật lại",
          items: [
            { name: "Dự án MNO", link: "/teacher/project-request?tab=2" },
          ],
        },
        // ... thêm các vấn đề khác nếu có
      ],
    },
    {
      className: "Lớp SE1751-NET", // This will be updated from the API
      totalStudents: 28,
      totalGroups: 4,

      issues: [
        {
          type: "Nhóm chưa chốt dự án",
          items: [
            { name: "Nhóm 3", link: "/classA/groups-no-project/nhom3" },
            { name: "Nhóm 4", link: "/classA/groups-no-project/nhom4" },
            { name: "Nhóm 5", link: "/classA/groups-no-project/nhom5" },
          ],
        },
        {
          type: "Nhóm chưa có mentor",
          items: [
            { name: "Nhóm 6", link: "/classA/groups-no-mentor/nhom6" },
            { name: "Nhóm 7", link: "/classA/groups-no-mentor/nhom7" },
            { name: "Nhóm 8", link: "/classA/groups-no-mentor/nhom8" },
            { name: "Nhóm 9", link: "/classA/groups-no-mentor/nhom9" },
          ],
        },
        {
          type: "Dự án cần duyệt",
          items: [
            { name: "Dự án ABC", link: "/teacher/project-request?tab=1" },
          ],
        },
        // ... thêm các vấn đề khác nếu có
      ],
    },
    // ... thêm các lớp khác
  ];

  // Use useState to manage classData
  const [classData, setClassData] = useState(initialClassData);

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
    const fetchClassData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/info/${userId}`,
          config
        );
        dispatch(setClassInfoData(response.data));
        const fetchedClasses = response.data.classes;
        const updatedClassData = classData.map((existingClass, index) => ({
          ...existingClass,
          className:
            fetchedClasses[index]?.className || existingClass.className,
        }));

        setClassData(updatedClassData);
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchClassData();
  }, [userId, config, dispatch]);

  // ... rest of your useEffect and fetch functions for projects

  const classColumns = [
    {
      title: "Tên lớp",
      dataIndex: "className",
      key: "className",
      render: (text) => (
        <span style={{ fontSize: "12px" }}>
          <SolutionOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: "Vấn đề",
      dataIndex: "issues",
      key: "issues",
      render: (issues) => {
        return issues.map((issue) => {
          if (issue.items && issue.items.length > 0) {
            return (
              <div key={issue.type} style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "12px" }}>{issue.type}:</span>{" "}
                {issue.items.map((item) => (
                  <Tag
                    color="red"
                    key={item.name}
                    style={{ marginRight: 4, marginTop: 4 }}
                  >
                    <a
                      href={item.link}
                      style={{ fontSize: "12px", textDecoration: "none" }}
                    >
                      {item.name}
                    </a>
                  </Tag>
                ))}
              </div>
            );
          }
          return null;
        });
      },
    },
  ];

  // Dữ liệu nhóm cần chú ý
  const groupData = [
    {
      groupName: "Nhóm 6 - Lớp SE1751-NET",
      status: "Chưa có mentor",
    },
    {
      groupName: "Nhóm 3 - Lớp SE1751-NET",
      status: "Chưa chốt dự án",
    },
    // ... thêm các nhóm khác
  ];

  const groupColumns = [
    {
      title: "Tên nhóm",
      dataIndex: "groupName",
      key: "groupName",
      render: (text) => (
        <span style={{ fontSize: "12px" }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={status === "Hoàn thành" ? "green" : "orange"}
          style={{ fontSize: "12px" }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button type="link" style={{ fontSize: "12px", padding: 0 }}>
          Cập nhật thông tin nhóm
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <Content style={{ margin: "0", minHeight: 280 }}>
        <Row gutter={16} style={{ marginBottom: "16px" }}>
          <Col span={15}>
            <Card
              title={
                <h5
                  style={{
                    fontSize: "18px",
                    padding: "16px",
                    margin: "0",
                    color: "#FFF",
                    fontWeight: "bold",
                  }}
                >
                  Vấn đề cần giải quyết
                </h5>
              }
              bordered={false}
              size="small"
              headStyle={{
                backgroundColor: "rgb(96, 178, 199)",
                padding: "0",
              }}
              bodyStyle={{
                padding: "0",
              }}
            >
              <Table
                dataSource={classData}
                columns={classColumns}
                pagination={false}
                rowKey="className"
                size="small"
              />
            </Card>
            <br />
            <Card
              title="Tình hình nhóm"
              bordered={false}
              size="small"
              headStyle={{ fontSize: "16px" }}
              bodyStyle={{
                padding: "8px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              <Table
                dataSource={groupData}
                columns={groupColumns}
                pagination={false}
                rowKey="groupName"
                size="small"
              />
            </Card>
          </Col>

          <Col span={9}>
            <Card
              title="Thông báo quan trọng"
              bordered={false}
              size="small"
              headStyle={{ fontSize: "16px" }}
              bodyStyle={{
                padding: "8px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    title: "Còn 1 ngày nữa hết thời gian cập nhật dự án",
                    link: "/group1/report-update",
                  },
                  {
                    title: "10 sinh viên chưa được phân nhóm",
                    link: "/students/new",
                  },
                  // ... thêm thông báo khác
                ]}
                renderItem={(item) => (
                  <List.Item style={{ padding: "8px 0" }}>
                    <List.Item.Meta
                      avatar={
                        <SolutionOutlined
                          style={{ fontSize: "20px", color: "orange" }}
                        />
                      }
                      title={
                        <Button
                          type="link"
                          href={item.link}
                          style={{ padding: 0, fontSize: "12px" }}
                        >
                          {item.title}
                        </Button>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
            <br />
            <TeacherSemester />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default TeacherDashboard;
