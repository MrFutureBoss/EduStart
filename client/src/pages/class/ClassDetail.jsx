import { Card, Tag, message, Row, Col, Tabs, Button } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";

import {
  setTempGroups,
  setTotalJoinUser,
  setTotalTempGroups,
  setTotalWaitUsers,
  setWaitUserList,
} from "../../redux/slice/TempGroupSlice";

import { setClassTaskData } from "../../redux/slice/ClassManagementSlice";
import "../../style/Class/ClassDetail.css";
import Result from "../managegroup/DnD_Group/Result";
import { setSettingCreateGroupData } from "../../redux/slice/SettingCreateGroup";
import moment from "moment";
import "moment/locale/vi";
import TabPane from "antd/es/tabs/TabPane";
import StudentList from "../managegroup/StudentList";
import { setAllGroupInClass } from "../../redux/slice/GroupSlice";
import ManageGroup from "../managegroup/ManageGroup";
import { IoChevronBackOutline } from "react-icons/io5";
import { setSid } from "../../redux/slice/semesterSlide";

const ClassDetail = () => {
  const { className } = useParams();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const [classId, setClassId] = useState("");
  const userId = localStorage.getItem("userId");
  moment.locale("vi");

  const navigate = useNavigate();

  const handleMoveBackToClassManagement = () => {
    navigate("/teacher/class");
  };

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
    return () => {
      dispatch(setTempGroups([]));
      dispatch(setTotalTempGroups(0));
      dispatch(setTotalJoinUser(0));
      dispatch(setWaitUserList([]));
      dispatch(setTotalWaitUsers(0));
      dispatch(setClassTaskData([]));
      dispatch(setSettingCreateGroupData([]));
      dispatch(setAllGroupInClass([]));
    };
  }, [dispatch]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/task/${userId}`,
          config
        );
        dispatch(setClassTaskData(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [userId, config, dispatch]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/className/${className}`,
          config
        );
        setClassId(response.data?.classId);
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [className, config]);

  //Setting của tạo nhóm
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/creategroupsetting/class/${classId}`,
          config
        );
        dispatch(setSettingCreateGroupData(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, dispatch]);

  //Danh sách những nhóm đã join vào group chưa đến hạn hết được join nhóm
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/tempgroup/class/${classId}`,
          config
        );
        dispatch(setTempGroups(response.data?.data));
        dispatch(setTotalTempGroups(response.data?.total));
        dispatch(setTotalJoinUser(response.data?.totalStudent));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, dispatch]);
  const { sid } = useSelector((state) => state.semester);
  const fetchCurrentSemester = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/semester/current`, config);
      const semesterData = response.data;
      dispatch(setSid(semesterData._id));
    } catch (error) {
      console.error("Error fetching current semester:", error);
    }
  };

  useEffect(() => {
    fetchCurrentSemester();
  }, [config]);
  //Danh sách nhóm chính thúc
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/group/class/${classId}/${sid}`,
          {
            ...config,
          }
        );
        dispatch(setAllGroupInClass(response.data?.groups));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, dispatch]);

  const tempGroups = useSelector((state) => state.tempGroup.data || []);
  const groupInClass = useSelector((state) => state.group.groupInClass || []);
  const totalTempGroups = useSelector((state) => state.tempGroup.total || 0);
  const settingCreateGroup = useSelector(
    (state) => state.settingCreateGroup.settingcreategroups || []
  );

  const countActiveTempGroups = (tempGroups) => {
    return tempGroups.filter((group) => group.status === true).length;
  };

  const activeTempGroupCount = countActiveTempGroups(tempGroups);

  const filteredSettingCreateGroup = settingCreateGroup.filter(
    (setting) => setting.classId._id === classId
  );

  const deadline = filteredSettingCreateGroup[0]?.deadline;

  const remainingTime = useMemo(() => {
    if (!deadline) return null;

    const now = moment();
    const deadlineTime = moment(deadline);
    const duration = moment.duration(deadlineTime.diff(now));
    if (duration.asDays() >= 1) {
      return `${Math.floor(duration.asDays())} ngày nữa`;
    } else if (duration.asHours() >= 1) {
      return `${Math.floor(duration.asHours())} tiếng nữa`;
    } else if (duration.asMinutes() >= 1) {
      return `${Math.floor(duration.asMinutes())} phút nữa`;
    } else {
      return "Đã hết hạn";
    }
  }, [deadline]);

  return (
    <div>
      <Button
        style={{ marginBottom: "1rem" }}
        onClick={() => handleMoveBackToClassManagement()}
      >
        <IoChevronBackOutline /> Quay lại quản lý lớp
      </Button>
      <h1 style={{ marginBottom: "2rem" }}>Lớp {className}</h1>
      <Row gutter={[32, 16]}>
        <Col sm={24} md={24} lg={20} style={{ padding: "0px" }}>
          <Card
            style={{ height: "fit-content" }}
            headStyle={{
              display: "none",
              height: "fit-content",
            }}
          >
            {groupInClass.length === 0 ? (
              <Tabs defaultActiveKey="1">
                <TabPane tab="Tạo nhóm" key="1">
                  <Result dndActive={true} />
                </TabPane>
                <TabPane tab="Quản lý nhóm" key="2" disabled>
                  <ManageGroup />
                </TabPane>
                <TabPane tab="Danh sách sinh viên" key="3">
                  <StudentList />
                </TabPane>
              </Tabs>
            ) : (
              <Tabs defaultActiveKey="1">
                <TabPane tab="Quản lý nhóm" key="1">
                  <ManageGroup />
                </TabPane>
                <TabPane tab="Danh sách sinh viên" key="2">
                  <StudentList />
                </TabPane>
              </Tabs>
            )}
          </Card>
        </Col>
        <Col sm={24} md={24} lg={4}>
          <Card
            title={<h5 style={{ margin: "0px" }}>Tình hình lớp</h5>}
            // <MdInfoOutline style={{ color: "#000", fontSize: "1.5rem" }} />
            bordered={true}
          >
            {" "}
            {groupInClass.length === 0 ? (
              <Card.Grid style={{ width: "100%" }}>
                <p
                  className="remove-default-style-p"
                  style={{ fontWeight: "700" }}
                >
                  Nhóm đã đủ thành viên:{" "}
                  <Tag
                    style={{
                      height: "fit-content",
                      marginBottom: "4px",
                    }}
                    color="#108ee9"
                  >
                    {" "}
                    {activeTempGroupCount}/{totalTempGroups}
                  </Tag>
                </p>
              </Card.Grid>
            ) : (
              <Card.Grid style={{ width: "100%" }}>
                {" "}
                <p
                  className="remove-default-style-p"
                  style={{ fontWeight: "700" }}
                >
                  Nhóm đã chốt xong đề tài:{" "}
                  <Tag
                    style={{
                      height: "fit-content",
                      marginBottom: "4px",
                    }}
                    color="#108ee9"
                  >
                    {" "}
                    0/{totalTempGroups}
                  </Tag>
                </p>
              </Card.Grid>
            )}
            {groupInClass.length === 0 ? (
              <Card.Grid style={{ width: "100%" }}>
                <p
                  className="remove-default-style-p"
                  style={{ fontWeight: "700" }}
                >
                  Deadline tham gia nhóm:{" "}
                  <div>
                    <Tag
                      style={{
                        height: "fit-content",
                        marginBottom: "4px",
                      }}
                      color="#6F7479"
                    >
                      {deadline
                        ? moment(deadline).format("DD-MM-YYYY")
                        : "Chưa thiết lập"}{" "}
                    </Tag>
                    {remainingTime !== null ? (
                      <Tag
                        style={{
                          height: "fit-content",
                          marginBottom: "4px",
                        }}
                        color="#D20336"
                      >
                        {" "}
                        {remainingTime}
                      </Tag>
                    ) : (
                      <div style={{ display: "none" }}>
                        Hãy thiết lập deadline
                      </div>
                    )}
                  </div>
                </p>
              </Card.Grid>
            ) : (
              <Card.Grid style={{ width: "100%" }}>
                <p
                  className="remove-default-style-p"
                  style={{ fontWeight: "700" }}
                >
                  Nhóm đã có mentor{" "}
                  <Tag
                    style={{
                      height: "fit-content",
                      marginBottom: "4px",
                    }}
                    color="#108ee9"
                  >
                    {" "}
                    0/{totalTempGroups}
                  </Tag>
                </p>
              </Card.Grid>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClassDetail;
