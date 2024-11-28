import {
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
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
  ArrowsAltOutlined,
  BarsOutlined,
  EyeInvisibleOutlined,
  FieldTimeOutlined,
  MoreOutlined,
  ProjectOutlined,
  SyncOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassInfoData } from "../../redux/slice/ClassManagementSlice";
import calculateWeekAndPhase from "./calculateWeekAndPhase";
import AssignOutcome from "../activity/AssignOutcome";

const ClassManagement = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [showUngropColumn, setShowUngropColumn] = useState(false);
  const [showEmptyColumn, setShowEmptygropColumn] = useState(false);
  const gridCard = "50%";
  const items = [
    {
      key: "1",
      label: <p style={{ padding: "0px", margin: "0px" }}>Ẩn đi</p>,
      icon: <EyeInvisibleOutlined />,
    },
    {
      key: "2",
      label: <p style={{ padding: "0px", margin: "0px" }}>Mở rộng</p>,
      icon: <ArrowsAltOutlined />,
    },
    {
      key: "3",
      label: <p style={{ padding: "0px", margin: "0px" }}>Di chuyển</p>,
      icon: <IoIosMove />,
    },
  ];
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
      <Row gutter={[32, 16]}>
        <Col xs={24} sm={24} md={24} lg={12} xl={16}>
          <Card
            bordered={true}
            title={
              <h5 style={{ padding: "0px", margin: "0px" }}>
                Việc cần giải quyết
              </h5>
            }
            bodyStyle={{ padding: "20px" }}
          >
            <TeacherTask />
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: "40px" }} gutter={[32, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane
              tab={
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                  }}
                >
                  Danh sách lớp học đang quản lý
                </span>
              }
              key="1"
            >
              <Card
                bordered={true}
                title={
                  <h5 style={{ padding: "0px", margin: "0px" }}>
                    Danh sách lớp học đang quản lý
                  </h5>
                }
              >
                <Row style={{ width: "100%", marginBottom: "1rem" }}>
                  <Col
                    lg={24}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginLeft: "0.7rem",
                      marginTop: "1rem",
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
                        <SyncOutlined /> Làm mới bảng
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
                <Row>
                  <Col lg={24}>
                    <p className="remove-default-style-p">
                      Tổng số lớp bạn dạy kì này:{" "}
                      <span>{classInfo?.totalClasses} lớp</span>
                    </p>
                  </Col>
                </Row>
                <Card.Grid
                  id="TaskTable"
                  style={{ width: "100%", padding: "0px" }}
                >
                  <TableClass
                    ungroup={showUngropColumn}
                    emptygroup={showEmptyColumn}
                  />
                </Card.Grid>
              </Card>
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                  }}
                >
                  Theo dõi tiến độ outcome
                </span>
              }
              key="2"
            >
              <Card
                bordered={true}
                title={
                  <h5 style={{ padding: "0px", margin: "0px" }}>
                    Theo dõi tiến độ Outcome
                  </h5>
                }
                bodyStyle={{ padding: "20px" }}
              >
                <AssignOutcome />
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default ClassManagement;
