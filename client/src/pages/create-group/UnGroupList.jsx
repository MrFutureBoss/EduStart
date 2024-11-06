import { Card, FloatButton, Button, Tooltip, Tag, message } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { IoPersonAddOutline } from "react-icons/io5";
import { MdAutoFixHigh } from "react-icons/md";
import { MdAutoFixOff } from "react-icons/md";

import {
  setTempGroups,
  setTotalJoinUser,
  setTotalTempGroups,
  setTotalWaitUsers,
  setWaitUserList,
} from "../../redux/slice/TempGroupSlice";

import { setClassTaskData } from "../../redux/slice/ClassManagementSlice";
import "../../style/Class/ClassDetail.css";
import CreateGroup from "./CreateGroup";
import Result from "./DnD_Group/Result";
import { setSettingCreateGroupData } from "../../redux/slice/SettingCreateGroup";
import moment from "moment";
const UnGroupList = () => {
  const { className } = useParams();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const [classId, setClassId] = useState("");
  const [isModalShowTypeAdd, setIsModalShowTypeAdd] = useState(false);
  const [isDndActive, setIsDndActive] = useState(false);
  const userId = localStorage.getItem("userId");

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

  const classTask = useSelector((state) => state.classManagement.classtask) || {
    data: [],
  };

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

  //Danh sách những sinh viên chưa join vào nhóm
  useEffect(() => {
    if (!classId) return;
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/ungroup/${classId}`,
          {
            ...config,
          }
        );
        dispatch(setWaitUserList(response.data?.data));
        dispatch(setTotalWaitUsers(response.data?.total));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [classId, config, dispatch]);

  const tempGroups = useSelector((state) => state.tempGroup.data || []);
  const totalTempGroups = useSelector((state) => state.tempGroup.total || 0);
  const waitUserList = useSelector(
    (state) => state.tempGroup.waituserlist || []
  );
  const totalWaitUsers = useSelector((state) => state.tempGroup.waittotal || 0);
  const totalJoinUsers = useSelector((state) => state.tempGroup.jointotal || 0);
  const settingCreateGroup = useSelector(
    (state) => state.settingCreateGroup.settingcreategroups || []
  );

  const handleOpenAddTypeModal = () => {
    setIsModalShowTypeAdd(true);
  };
  const handleCloseAddTypeModal = () => {
    setIsModalShowTypeAdd(false);
  };

  const handleOpenModifyStudentInGroup = () => {
    setIsDndActive(true);
  };
  const handleCloseModifyStudentInGroup = () => {
    setIsDndActive(false);
  };

  const handleAutoGroup = async () => {
    try {
      await axios.post(`${BASE_URL}/tempgroup/auto-fill`);
      const response = await axios.get(
        `${BASE_URL}/tempgroup/class/${classId}`,
        config
      );
      dispatch(setTempGroups(response.data?.data));
      dispatch(setTotalTempGroups(response.data?.total));

      message.success("Nhóm đã được ghép tự động!");
    } catch (error) {
      console.error("Error during auto-grouping:", error);
      message.error("Đã xảy ra lỗi khi ghép nhóm tự động");
    }
  };

  const countActiveTempGroups = (tempGroups) => {
    return tempGroups.filter((group) => group.status === true).length;
  };

  const activeTempGroupCount = countActiveTempGroups(tempGroups);

  console.log("Setting: " + JSON.stringify(settingCreateGroup));

  const filteredSettingCreateGroup = settingCreateGroup.filter(
    (setting) => setting.classId._id === classId
  );

  const deadline = filteredSettingCreateGroup[0]?.deadline;
  const autoFinish = filteredSettingCreateGroup[0]?.autoFinish;
  const ruleJoin = filteredSettingCreateGroup[0]?.ruleJoin || [];

  const remainingTime = useMemo(() => {
    if (!deadline) return null;
    const now = moment();
    const deadlineTime = moment(deadline);
    return deadlineTime.isAfter(now) ? deadlineTime.fromNow() : "Đã hết hạn";
  }, [deadline]);
  return (
    <div>
      <CreateGroup
        classId={classId}
        show={isModalShowTypeAdd}
        close={handleCloseAddTypeModal}
      />
      <h1>Lớp {className}</h1>
      <Card bordered={true}>
        <Card.Grid style={{ width: "50%" }}>
          <p className="remove-default-style-p" style={{ fontWeight: "700" }}>
            Sĩ số lớp:{" "}
            <Tag style={{ height: "fit-content" }} color="#108ee9">
              {totalWaitUsers + totalJoinUsers} sinh viên
            </Tag>
          </p>
        </Card.Grid>
        <Card.Grid style={{ width: "50%" }}>
          <p className="remove-default-style-p" style={{ fontWeight: "700" }}>
            Tổng số nhóm đã đủ thành viên:{" "}
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
        <Card.Grid style={{ width: "50%" }}>
          <p className="remove-default-style-p" style={{ fontWeight: "700" }}>
            Deadline tạo nhóm:{" "}
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
          </p>
        </Card.Grid>
        <Card.Grid style={{ width: "50%" }}>
          <p className="remove-default-style-p" style={{ fontWeight: "700" }}>
            Thời gian còn lại:{" "}
            <Tag
              style={{
                height: "fit-content",
                marginBottom: "4px",
              }}
              color="#D20336"
            >
              {remainingTime}
            </Tag>
          </p>
        </Card.Grid>
        <Card.Grid style={{ width: "50%" }}>
          <p className="remove-default-style-p" style={{ fontWeight: "700" }}>
            Điều kiện tham gia mỗi nhóm:{" "}
            <Tag
              style={{
                height: "fit-content",
                marginBottom: "4px",
              }}
              color="#108ee9"
            >
              {ruleJoin.length > 0
                ? ruleJoin.map((rule) => (
                    <span key={rule._id}>{rule.title}</span>
                  ))
                : "Không có điều kiện"}
            </Tag>
          </p>
        </Card.Grid>
        <Card.Grid style={{ width: "50%" }}>
          <p className="remove-default-style-p" style={{ fontWeight: "700" }}>
            Hết thời gian tự động xếp nhóm:{" "}
            {autoFinish ? (
              <Tag
                style={{
                  height: "fit-content",
                  marginBottom: "4px",
                }}
                color="#59B259"
              >
                Đã kích hoạt
              </Tag>
            ) : (
              <Tag
                style={{
                  height: "fit-content",
                  marginBottom: "4px",
                }}
                color="#D20336"
              >
                Chưa kích hoạt
              </Tag>
            )}
          </p>
        </Card.Grid>
      </Card>

      <Button
        color="primary"
        variant="solid"
        style={{
          margin: "20px 0px",
          display: totalTempGroups > 0 ? "none" : "block",
        }}
        onClick={handleOpenAddTypeModal}
      >
        + Tạo nhóm lớp
      </Button>
      <div style={{ display: "flex", gap: "1rem" }}>
        {!isDndActive ? (
          <Tooltip
            title="Tự động ghép nhóm luôn bỏ qua deadline"
            style={{ display: "flex", textAlign: "center" }}
          >
            <Button
              color="primary"
              variant="solid"
              style={{
                margin: "20px 0px",
                display: totalTempGroups <= 0 ? "none" : "block",
              }}
              onClick={handleAutoGroup}
            >
              <MdAutoFixHigh style={{ fontSize: "1.1rem" }} />
              &nbsp;Tự động ghép nhóm
            </Button>
          </Tooltip>
        ) : (
          <Tooltip
            title="Tự động ghép nhóm luôn bỏ qua deadline"
            style={{ display: "flex", textAlign: "center" }}
          >
            <Button
              color="default"
              variant="solid"
              disabled={true}
              style={{
                margin: "20px 0px",
                display: totalTempGroups <= 0 ? "none" : "block",
              }}
            >
              <MdAutoFixOff style={{ fontSize: "1.1rem" }} />
              &nbsp;Tự động ghép nhóm
            </Button>
          </Tooltip>
        )}

        {!isDndActive ? (
          <Tooltip
            title="Bật chế độ xếp sinh viên vào nhóm"
            style={{ display: "flex", textAlign: "center" }}
          >
            <Button
              color="primary"
              variant="solid"
              style={{
                margin: "20px 0px",
                display: totalTempGroups <= 0 ? "none" : "block",
              }}
              onClick={handleOpenModifyStudentInGroup}
            >
              <IoPersonAddOutline style={{ fontSize: "1.1rem" }} />
              &nbsp;Xếp vào nhóm
            </Button>
          </Tooltip>
        ) : (
          <Tooltip
            title="Tắt chế độ xếp sinh viên vào nhóm"
            style={{ display: "flex", textAlign: "center" }}
          >
            <Button
              color="danger"
              variant="solid"
              style={{
                margin: "20px 0px",
                display: totalTempGroups <= 0 ? "none" : "block",
              }}
              onClick={handleCloseModifyStudentInGroup}
            >
              <IoPersonAddOutline style={{ fontSize: "1.1rem" }} />
              &nbsp;Dừng Xếp vào nhóm
            </Button>
          </Tooltip>
        )}
      </div>
      <FloatButton
        icon={<QuestionCircleOutlined />}
        type="primary"
        style={{
          insetInlineEnd: 88,
        }}
      />
      <Result dndActive={isDndActive} />
    </div>
  );
};

export default UnGroupList;
