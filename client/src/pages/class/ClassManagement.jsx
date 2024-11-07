import {
  Badge,
  Button,
  Card,
  Col,
  Radio,
  Row,
  Segmented,
  Space,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
} from "antd";
import { IoIosMove } from "react-icons/io";
import { MdInfoOutline } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { MdOutlineGroupOff } from "react-icons/md";
import "../../style/Class/ClassManagement.css";
import TableClass from "./TableClass";
import TeacherTask from "./TeacherTask";
import {
  AppstoreOutlined,
  BarsOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  FilterOutlined,
  ProjectOutlined,
  SyncOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassInfoData } from "../../redux/slice/ClassManagementSlice";
import calculateWeekAndPhase from "./calculateWeekAndPhase";
import CardClass from "./CardClass";
import AssignOutcome from "../activity/AssignOutcome";

const ClassManagement = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [view, setView] = useState("List");
  const [showUngropColumn, setShowUngropColumn] = useState(false);
  const [showEmptyColumn, setShowEmptygropColumn] = useState(false);
  const gridCard = "50%";

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
        const response = await axios.get(
          `${BASE_URL}/class/info/${userId}`,
          config
        );
        dispatch(setClassInfoData(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [userId, config, dispatch]);

  const classInfo = useSelector((state) => state.classManagement.classinfo);

  const handleFilterClassHaveUnGroup = () => {
    setShowUngropColumn(true);
    setShowEmptygropColumn(false);
  };

  const handleFilterClassHaveEmptyGroup = () => {
    setShowEmptygropColumn(true);
    setShowUngropColumn(false);
  };

  const handleResetFilterTable = () => {
    setShowUngropColumn(false);
    setShowEmptygropColumn(false);
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#outcome-management") {
      const outcomeSection = document.getElementById("outcome-management");
      if (outcomeSection) {
        outcomeSection.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: "40px" }}>Quản lý lớp học</h1>
      <Row>
        <Col
          span={24}
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "1rem auto 2rem auto",
          }}
        >
          {classInfo?.semesters.length > 0 &&
          classInfo.semesters.some(
            (semester) => semester.status === "Ongoing"
          ) ? (
            classInfo.semesters
              .filter((semester) => semester.status === "Ongoing")
              .map((semester) => {
                const { phases, daysRemain } = calculateWeekAndPhase(
                  semester.startDate
                );
                return (
                  <Card
                    bordered={true}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      width: "80%",
                      padding: "0.5rem 8rem",
                      borderStyle: "dotted",
                      backgroundColor: "#E6F4FF",
                      border: "2px solid #1677FF",
                    }}
                  >
                    <div>
                      <div className="classinfo-content">
                        <p
                          style={{
                            fontWeight: "700",
                            fontSize: "1.5rem",
                            marginBottom: "2rem",
                          }}
                        >
                          {" "}
                          Thông báo thời hạn còn lại cho tất cả giáo viên&nbsp;{" "}
                          <Tag
                            color="#FF5252"
                            style={{
                              fontSize: "1.2rem",
                              padding: "0.2rem 0.5rem",
                            }}
                          >
                            {phases.length}
                          </Tag>
                        </p>
                      </div>
                      <div
                        className="classinfo-content"
                        style={{
                          justifyContent: "center",
                          flexDirection: "column",
                        }}
                      >
                        {phases.map((phase, index) => (
                          <div key={index} style={{ marginBottom: "8px" }}>
                            <p
                              style={{
                                height: "fit-content",
                                marginBottom: "4px",
                                fontWeight: "500",
                              }}
                            >
                              Thời gian {phase.toLowerCase()}:{" "}
                              <Tag color="#FF5252">
                                <FieldTimeOutlined /> Còn {daysRemain} ngày
                              </Tag>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })
          ) : (
            <h5>Hiện tại chưa có deadline nào rành cho các lớp</h5>
          )}
        </Col>
      </Row>
      <Row gutter={[32, 16]}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          <Card
            bordered={true}
            title={
              <h5 style={{ padding: "0px", margin: "0px" }}>
                Thông tin{" "}
                <MdInfoOutline style={{ color: "#FFF", fontSize: "1.5rem" }} />
              </h5>
            }
            extra={
              <IoIosMove
                style={{ fontSize: "1.2rem", cursor: "pointer", color: "#FFF" }}
              />
            }
            headStyle={{
              background:
                "linear-gradient(90deg, rgba(23,153,218,1) 64%, rgba(19,163,224,1) 96%)",
              color: "white",
            }}
          >
            {classInfo?.semesters.length > 0 &&
            classInfo.semesters.some(
              (semester) => semester.status === "Ongoing"
            ) ? (
              classInfo.semesters
                .filter((semester) => semester.status === "Ongoing")
                .map((semester) => (
                  <Card.Grid
                    style={{ width: `${gridCard}` }}
                    key={semester._id}
                  >
                    <div
                      className="classinfo-content"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <p
                        style={{
                          fontWeight: "700",
                          whiteSpace: "nowrap",
                          marginRight: "8px",
                        }}
                      >
                        Kì học hiện tại:&nbsp;
                      </p>
                      <p
                        style={{
                          color: "",
                          fontSize: "1.3rem",
                          fontWeight: "700",
                          lineHeight: "2rem",
                        }}
                      >
                        {semester.name}
                      </p>
                    </div>

                    <div className="classinfo-content">
                      <p style={{ fontWeight: "700" }}>Bắt đầu từ:&nbsp;</p>{" "}
                      <Tag style={{ height: "fit-content" }} color="#108ee9">
                        {new Date(semester.startDate).toLocaleDateString()}
                      </Tag>
                    </div>
                    <div className="classinfo-content">
                      <p style={{ fontWeight: "700" }}>Kết thúc từ:&nbsp;</p>{" "}
                      <Tag style={{ height: "fit-content" }} color="#108ee9">
                        {new Date(semester.endDate).toLocaleDateString()}
                      </Tag>
                    </div>
                  </Card.Grid>
                ))
            ) : (
              <Card.Grid>Hiện tại chưa có kì học nào</Card.Grid>
            )}
            {classInfo?.semesters.length > 0 &&
            classInfo.semesters.some(
              (semester) => semester.status === "Ongoing"
            ) ? (
              classInfo.semesters
                .filter((semester) => semester.status === "Ongoing")
                .map((semester) => {
                  const { week, phases } = calculateWeekAndPhase(
                    semester.startDate
                  );
                  return (
                    <Card.Grid
                      style={{ width: `${gridCard}` }}
                      key={semester._id}
                    >
                      <div className="classinfo-content">
                        <p style={{ fontWeight: "700" }}>Tuần học:&nbsp;</p>
                        <Tag style={{ height: "fit-content" }} color="#008D87">
                          Tuần {week}
                        </Tag>
                      </div>
                      <div className="classinfo-content">
                        <p style={{ fontWeight: "700", whiteSpace: "nowrap" }}>
                          Giai đoạn:&nbsp;
                        </p>
                      </div>
                      <div
                        className="classinfo-content"
                        style={{ display: "flex", justifyContent: "start" }}
                      >
                        {phases.map((phase, index) => (
                          <Tag
                            key={index}
                            style={{
                              height: "fit-content",
                              marginBottom: "4px",
                            }}
                            color="#f50"
                          >
                            {phase}
                          </Tag>
                        ))}
                      </div>
                    </Card.Grid>
                  );
                })
            ) : (
              <Card.Grid>Hiện tại chưa có kì học nào</Card.Grid>
            )}

            <Card.Grid style={{ width: `${gridCard}` }}>
              <div className="classinfo-content">
                <p style={{ fontWeight: "700" }}>
                  {" "}
                  Tổng số lớp bạn dạy kì này:&nbsp;{" "}
                </p>
                <Tag color="#108ee9">{classInfo?.totalClasses}</Tag>
              </div>
            </Card.Grid>
            <Card.Grid style={{ width: `${gridCard}` }}>
              <div
                className="classinfo-content"
                style={{ display: "flex", justifyContent: "start" }}
              >
                <p style={{ fontWeight: "700" }}>
                  {" "}
                  Tổng sĩ số sinh viên:&nbsp;{" "}
                </p>
                <Tag color="#108ee9">{classInfo?.totalStudents}</Tag>
              </div>
            </Card.Grid>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          <Card
            bordered={true}
            title={
              <h5 style={{ padding: "0px", margin: "0px" }}>
                Việc bạn cần giải quyết <FaPen />
              </h5>
            }
            extra={
              <IoIosMove
                style={{ fontSize: "1.2rem", cursor: "pointer", color: "#FFF" }}
              />
            }
            headStyle={{
              background:
                "linear-gradient(90deg, rgba(210,3,54,1) 67%, rgba(224,0,4,0.9097222222222222) 96%)",
              color: "white",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <TeacherTask />
          </Card>
        </Col>
      </Row>
      <Tabs defaultActiveKey="1" style={{ marginTop: "40px" }}>
        <Tabs.TabPane tab="Danh sách lớp học của bạn" key="1">
          <Card
            bordered={true}
            title={
              <h5 style={{ padding: "0px", margin: "0px" }}>
                Danh sách lớp học của bạn
              </h5>
            }
            extra={
              <IoIosMove
                style={{ fontSize: "1.2rem", cursor: "pointer", color: "#FFF" }}
              />
            }
            headStyle={{
              background: "linear-gradient(-45deg, #005241, #128066)",
              color: "white",
            }}
          >
            <Row style={{ width: "100%", marginBottom: "1rem" }}>
              <Col lg={8}>
                {/* Đổi cách list data */}
                <Segmented
                  style={{ margin: "10px 10px" }}
                  options={[
                    {
                      label: (
                        <Tooltip title="Danh sách">
                          <BarsOutlined />
                        </Tooltip>
                      ),
                      value: "List",
                    },
                    {
                      label: (
                        <Tooltip title="Thẻ">
                          <AppstoreOutlined />
                        </Tooltip>
                      ),
                      value: "Card",
                    },
                  ]}
                  onChange={setView}
                />
              </Col>
              <Col
                lg={24}
                style={{
                  display: view === "List" ? "flex" : "none",
                  alignItems: "center",
                  marginLeft: "0.7rem",
                  gap: "1rem",
                }}
              >
                {/* <h5><FilterOutlined />Lọc vấn đề</h5> */}
                <Tooltip title="Làm mới bảng">
                  <Button
                    onClick={() => handleResetFilterTable()}
                    style={{
                      padding: "8px",
                    }}
                  >
                    <SyncOutlined />
                  </Button>
                </Tooltip>
                <Space direction="vertical">
                  <Radio.Group>
                    <Radio.Button style={{ display: "none" }}>
                      <Tooltip title="Vấn đề nhóm chưa chốt đề tài">
                        <Space>
                          <ProjectOutlined />
                          <Badge count="1" />
                        </Space>
                      </Tooltip>
                    </Radio.Button>
                    <Radio.Button
                      value={showEmptyColumn}
                      onClick={() => handleFilterClassHaveEmptyGroup()}
                    >
                      <Tooltip title="Vấn đề lớp chưa có nhóm">
                        <Space>
                          <MdOutlineGroupOff />
                          <Badge count="1" />
                        </Space>
                      </Tooltip>
                    </Radio.Button>
                    <Radio.Button
                      value={showUngropColumn}
                      onClick={() => handleFilterClassHaveUnGroup()}
                    >
                      <Tooltip title="Vấn đề nhóm chưa chốt đủ thành viên">
                        <Space>
                          <TeamOutlined />
                          <Badge count="1" color="#FFBA57" />
                        </Space>
                      </Tooltip>
                    </Radio.Button>
                    <Radio.Button style={{ display: "none" }}>
                      <Tooltip title="Vấn đề nhóm chưa nộp bài tập hoặc nộp muộn">
                        <Space>
                          <FieldTimeOutlined />
                          <Badge count="1" />
                        </Space>
                      </Tooltip>
                    </Radio.Button>
                  </Radio.Group>
                </Space>
              </Col>
            </Row>
            <Card.Grid id="TaskTable" style={{ width: "100%", padding: "0px" }}>
              {view === "List" ? (
                <TableClass
                  ungroup={showUngropColumn}
                  emptygroup={showEmptyColumn}
                />
              ) : (
                <CardClass />
              )}
            </Card.Grid>
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Quản lý Outcome" key="2">
          <Card
            bordered={true}
            title={
              <h5 style={{ padding: "0px", margin: "0px" }}>Quản lý Outcome</h5>
            }
            extra={
              <IoIosMove style={{ fontSize: "1.2rem", cursor: "pointer" }} />
            }
            headStyle={{
              background: "green",
              color: "white",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <h3>Danh sách các lớp đã giao outcome</h3>
            <AssignOutcome />
          </Card>
        </Tabs.TabPane>
      </Tabs>
      {/* <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          <Card
            bordered={true}
            title={
              <h5 style={{ padding: "0px", margin: "0px" }}>
                Theo dõi tình hình lớp học
              </h5>
            }
            extra={
              <IoIosMove style={{ fontSize: "1.2rem", cursor: "pointer" }} />
            }
            headStyle={{
              background: "#008d87",
              color: "white",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <Timeline
              mode="alternate"
              items={[
                {
                  children: "Create a services site 2015-09-01",
                },
                {
                  children: "Solve initial network problems 2015-09-01",
                  color: "green",
                },
                {
                  dot: (
                    <ClockCircleOutlined
                      style={{
                        fontSize: "16px",
                      }}
                    />
                  ),
                  children: `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`,
                },
                {
                  color: "red",
                  children: "Network problems being solved 2015-09-01",
                },
                {
                  children: "Create a services site 2015-09-01",
                },
                {
                  dot: (
                    <ClockCircleOutlined
                      style={{
                        fontSize: "16px",
                      }}
                    />
                  ),
                  children: "Technical testing 2015-09-01",
                },
              ]}
            />
          </Card>
        </Col> */}
      {/* <Row style={{ marginTop: "40px" }} gutter={[32, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={16}>
          <Card
            bordered={true}
            title={
              <h5 style={{ padding: "0px", margin: "0px" }}>Quản lý Outcome</h5>
            }
            extra={
              <IoIosMove style={{ fontSize: "1.2rem", cursor: "pointer" }} />
            }
            headStyle={{
              background: "green",
              color: "white",
            }}
            bodyStyle={{ padding: "20px" }}
            id="outcome-management"
          >
            <h3>Danh sách các lớp đã giao outcome</h3>
            <AssignOutcome />
          </Card>
        </Col>
      </Row> */}
    </div>
  );
};

export default ClassManagement;
