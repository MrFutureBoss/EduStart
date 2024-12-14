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
import MonitorStep from "../activity/MonitorStep";
import TableIssueDashboard from "./TableIssueDashboard";

const ClassManagement = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [showUngropColumn, setShowUngropColumn] = useState(false);
  const [showEmptyColumn, setShowEmptygropColumn] = useState(false);
  const [activeTable, setActiveTable] = useState("classList");

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

  const handleTableChange = (e) => {
    setActiveTable(e.target.value);
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <MonitorStep />
      </Row>
      <br />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={9} xl={9}>
          <TableIssueDashboard
            userId={userId}
            jwt={jwt}
            style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.9)" }}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={15} xl={15}>
          <Card
            title="Danh sách lớp học"
            bordered={false}
            size="small"
            headStyle={{
              backgroundColor: "rgb(96, 178, 199)",
              minHeight: "45px",
              color: "white",
              fontSize: "17px",
            }}
            bodyStyle={{
              padding: "16px",
            }}
          >
            <Row>
              <Col lg={24}>
                <p className="remove-default-style-p">
                  Tổng số lớp bạn dạy kì này:{" "}
                  <span>{classInfo?.totalClasses} lớp</span>
                </p>
              </Col>
            </Row>

            <Row style={{ marginBottom: "16px" }}>
              <Col span={24}>
                <Radio.Group
                  onChange={handleTableChange}
                  value={activeTable}
                  style={{
                    display: "flex",
                    gap: "8px",
                    paddingTop: "0.8rem",
                  }}
                >
                  <Radio.Button
                    value="classList"
                    style={{
                      padding: "0 16px",
                    }}
                  >
                    <Tooltip title="Chi tiết lớp học">
                      <Space>
                        <TeamOutlined />
                      </Space>
                    </Tooltip>
                  </Radio.Button>
                  <Radio.Button
                    value="outcomeMonitor"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0 16px",
                    }}
                  >
                    <Tooltip title="Theo dõi tiến độ outcome">
                      <Space>
                        <FieldTimeOutlined />
                      </Space>
                    </Tooltip>
                  </Radio.Button>
                </Radio.Group>
              </Col>
            </Row>

            <Row>
              <Col span={24}>
                {activeTable === "classList" ? (
                  <TableClass
                    ungroup={showUngropColumn}
                    emptygroup={showEmptyColumn}
                  />
                ) : (
                  <AssignOutcome />
                )}
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClassManagement;
