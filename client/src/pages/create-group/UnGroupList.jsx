import { Card, Tag, message, Row, Col, Tabs } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
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
import Result from "./DnD_Group/Result";
import { setSettingCreateGroupData } from "../../redux/slice/SettingCreateGroup";
import moment from "moment";
import "moment/locale/vi";
import TabPane from "antd/es/tabs/TabPane";
import StudentList from "./StudentList";
import { setAllGroupInClass } from "../../redux/slice/GroupSlice";
import ManageGroup from "./ManageGroup";

const UnGroupList = () => {
  const { className } = useParams();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const [classId, setClassId] = useState("");
  const userId = localStorage.getItem("userId");
  moment.locale("vi");

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
        console.log("classId: " + response.data?.classId);
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

  //Danh sách nhóm chính thúc
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/group/class/${classId}`, {
          ...config,
        });
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
  const autoFinish = filteredSettingCreateGroup[0]?.autoFinish;
  // const ruleJoin = filteredSettingCreateGroup[0]?.ruleJoin || [];

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
      <h1 style={{ marginBottom: "2rem" }}>Lớp {className}</h1>
      <Row gutter={[32, 16]}>
        <Col span={4}>
          <Card
            title={<h5 style={{ margin: "0px" }}>Tình hình lớp</h5>}
            // <MdInfoOutline style={{ color: "#000", fontSize: "1.5rem" }} />
            bordered={true}
            headStyle={{
              background:
                "linear-gradient(90deg, rgba(210,3,54,1) 67%, rgba(224,0,4,0.9097222222222222) 96%)",
              color: "white",
            }}
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
        <Col span={20}>
          <Card
            style={{ height: "fit-content", marginTop: "4rem" }}
            headStyle={{
              display: "none",
              height: "fit-content",
            }}
          >
            <Tabs defaultActiveKey="1">
              {groupInClass.length === 0 ? (
                <>
                  <TabPane tab="Tạo nhóm" key="1">
                    <Result dndActive={true} />
                  </TabPane>
                  <TabPane tab="Quản lý nhóm" key="2" disabled>
                    
                  </TabPane>
                </>
              ) : (
                <>
                  <TabPane tab="Quản lý nhóm" key="1"> <ManageGroup /></TabPane>
                </>
              )}
              <TabPane tab="Danh sách sinh viên" key="3">
                <StudentList />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UnGroupList;
