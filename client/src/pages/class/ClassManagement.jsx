import { Card, Col, Row, Segmented, Tag, Timeline } from "antd";
import { IoIosMove } from "react-icons/io";
import { MdInfoOutline } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import "../../style/Class/ClassManagement.css";
import TableClass from "./TableClass";
import TeacherTask from "./TeacherTask";
import {
  AppstoreOutlined,
  BarsOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassInfoData } from "../../redux/slice/ClassManagementSlice";
import calculateWeekAndPhase from "./calculateWeekAndPhase";
import CardClass from "./CardClass";

const ClassManagement = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const [view, setView] = useState("List");
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
  console.log("Data check: " + JSON.stringify(classInfo));

  return (
    <div>
      <h1 style={{ marginBottom: "40px" }}>Quản lý lớp học</h1>
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
              <div className="classinfo-content">
                <p style={{ fontWeight: "700" }}>
                  {" "}
                  Tổng số sinh viên bạn dạy kì này:&nbsp;{" "}
                </p>
                <Tag color="#108ee9">{classInfo?.totalStudents}</Tag>
              </div>
            </Card.Grid>
            <Card.Grid style={{ width: `100%` }}>
              <div className="classinfo-content">
                <p style={{ fontWeight: "700" }}>
                  {" "}
                   Thông báo thời hạn chung cho các lớp&nbsp;{" "}
                </p>
                <Tag color="#FF5252">2</Tag>
              </div>
              <div className="classinfo-content">
                <p style={{ fontWeight: "500" }}>
                  {" "}
                  Deadline Chốt nhóm:&nbsp;{" "}
                </p>
                <Tag color="#FF5252">Còn 2 ngày</Tag>
              </div>
              <div className="classinfo-content">
                <p style={{ fontWeight: "500" }}>
                  {" "}
                  Deadline chốt đề tài nhóm:&nbsp;{" "}
                </p>
                <Tag color="#FF5252">Còn 2 ngày</Tag>
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
      <Row style={{ marginTop: "40px" }} gutter={[32, 16]}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
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
            <Segmented
              style={{ margin: "10px 10px" }}
              options={[
                { label: "Danh sách", value: "List", icon: <BarsOutlined /> },
                { label: "Thẻ", value: "Card", icon: <AppstoreOutlined /> },
              ]}
              onChange={setView} // Update view state based on selected option
            />
            <Card.Grid style={{ width: "100%", padding: "0px" }}>
              {view === "List" ? <TableClass /> : <CardClass />}
            </Card.Grid>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
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
        </Col>
      </Row>
    </div>
  );
};

export default ClassManagement;
