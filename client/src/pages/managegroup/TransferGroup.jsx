import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Select,
  Button,
  message,
  Spin,
  Row,
  Col,
  Popconfirm,
  Tooltip,
} from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import {
  setStudentInClass,
  setTotalStudentInClass,
} from "../../redux/slice/ClassManagementSlice";
import { useParams } from "react-router-dom";
import { RightOutlined, StarFilled } from "@ant-design/icons";

const TransferGroup = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { className } = useParams();
  const [groups, setGroups] = useState([]);
  const [sourceGroup, setSourceGroup] = useState(null);
  const [targetGroup, setTargetGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const students = useSelector(
    (state) => state.classManagement.studentsInClass || []
  );

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
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/class/className/${className}`,
          config
        );
        const studentResponse = await axios.get(
          `${BASE_URL}/group/student/${response.data?.classId}`,
          config
        );

        // Update groups and students
        dispatch(setStudentInClass(studentResponse.data?.students));
        dispatch(setTotalStudentInClass(studentResponse.data?.total));

        // Get unique groups from the students data
        const groupSet = new Set(
          studentResponse.data.students.map((student) =>
            JSON.stringify(student.groupId)
          )
        );
        setGroups(Array.from(groupSet).map((group) => JSON.parse(group)));
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [config, className, dispatch]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/class/className/${className}`,
        config
      );
      const studentResponse = await axios.get(
        `${BASE_URL}/group/student/${response.data?.classId}`,
        config
      );

      // Update groups and students
      dispatch(setStudentInClass(studentResponse.data?.students));
      dispatch(setTotalStudentInClass(studentResponse.data?.total));

      // Get unique groups from the students data
      const groupSet = new Set(
        studentResponse.data.students.map((student) =>
          JSON.stringify(student.groupId)
        )
      );
      setGroups(Array.from(groupSet).map((group) => JSON.parse(group)));
    } catch (error) {
      console.error(
        error.response ? error.response.data.message : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle group selection
  const handleGroupChange = (type, groupId) => {
    if (type === "source") {
      setSourceGroup(groupId);
      setSelectedRowKeys([]); // Clear selected rows when group changes
    } else if (type === "target") {
      setTargetGroup(groupId);
    }
  };

  // Handle row selection in source table
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleTransfer = async () => {
    if (!sourceGroup || !targetGroup) {
      message.warning("Hãy chọn cả nhóm nguồn và nhóm đích!");
      return;
    }
    if (selectedRowKeys.length === 0) {
      message.warning("Hãy chọn sinh viên để chuyển!");
      return;
    }

    try {
      setLoading(true);
      let updatedStudents = [];
      let newStudentList = [...students]; // Copy danh sách sinh viên để thực hiện các thay đổi

      // Duyệt qua các sinh viên được chọn và cập nhật thông tin nhóm
      for (const studentId of selectedRowKeys) {
        const studentIndex = newStudentList.findIndex(
          (s) => s._id === studentId
        );

        if (studentIndex !== -1) {
          // Cập nhật thông tin sinh viên
          const updatedStudent = {
            ...newStudentList[studentIndex],
            groupId: targetGroup,
            isLeader: false, // Khi chuyển nhóm, vai trò leader cần bị hủy
          };

          // Gọi API để cập nhật thông tin sinh viên trên server
          await axios.patch(
            `${BASE_URL}/user/${studentId}`,
            { groupId: targetGroup, isLeader: false },
            config
          );

          newStudentList[studentIndex] = updatedStudent;
          updatedStudents.push(updatedStudent);
        }
      }

      // Kiểm tra nhóm nguồn còn lại
      const remainingMembers = newStudentList.filter(
        (s) =>
          s.groupId?._id === sourceGroup && !selectedRowKeys.includes(s._id)
      );
      const hasActiveMembers = remainingMembers.some(
        (s) => s.status === "Active"
      );

      if (remainingMembers.length === 0 || !hasActiveMembers) {
        // Nếu không còn thành viên nào hoặc chỉ còn thành viên InActive
        await axios.patch(
          `${BASE_URL}/group/${sourceGroup}`,
          { status: "InActive" },
          config
        );

        // Cập nhật trạng thái nhóm cho các thành viên còn lại trong nhóm nguồn
        newStudentList = newStudentList.map((student) =>
          student.groupId?._id === sourceGroup
            ? {
                ...student,
                groupId: {
                  ...student.groupId,
                  status: "InActive",
                },
              }
            : student
        );

        message.warning(
          `${groups.find((g) => g._id === sourceGroup)?.name} đã giải tán.`
        );
      } else {
        // Nếu nhóm nguồn còn thành viên Active, cần chọn một leader mới nếu người được chuyển là leader
        const currentLeader = newStudentList.find(
          (s) => s.groupId?._id === sourceGroup && s.isLeader
        );

        if (!currentLeader) {
          const activeMembers = remainingMembers.filter(
            (s) => s.status === "Active"
          );
          if (activeMembers.length > 0) {
            const newLeader =
              activeMembers[Math.floor(Math.random() * activeMembers.length)];

            await axios.patch(
              `${BASE_URL}/user/${newLeader._id}`,
              { isLeader: true },
              config
            );

            newStudentList = newStudentList.map((s) =>
              s._id === newLeader._id ? { ...s, isLeader: true } : s
            );

            message.info(
              `Nhóm trưởng mới của ${
                groups.find((g) => g._id === sourceGroup)?.name
              } là ${newLeader.username}`
            );
          }
        }
      }

      // Cập nhật Redux với danh sách sinh viên mới
      dispatch(setStudentInClass(newStudentList));
      fetchUserData();

      // Reset selected rows
      setSelectedRowKeys([]);
      message.success("Chuyển nhóm thành công!");
    } catch (error) {
      message.error("Lỗi khi chuyển nhóm sinh viên");
    } finally {
      setLoading(false);
    }
  };

  // Data for source group table
  const sourceStudents = Array.isArray(students)
    ? students.filter((student) => student.groupId?._id === sourceGroup)
    : [];

  // Data for target group table
  const targetStudents = Array.isArray(students)
    ? students.filter((student) => student.groupId?._id === targetGroup)
    : [];
  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: "20px" }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <Select
                placeholder="Chọn nhóm"
                style={{ width: "8rem" }}
                onChange={(value) => handleGroupChange("source", value)}
                value={sourceGroup}
              >
                {groups
                  .filter(
                    (group) =>
                      group.status === "Active" && group._id !== targetGroup // Chỉ hiển thị nhóm có status "Active"
                  )
                  .map((group) => (
                    <Select.Option key={group._id} value={group._id}>
                      {group.name}
                    </Select.Option>
                  ))}
              </Select>
            </div>
            <Table
              rowSelection={{
                selectedRowKeys,
                onChange: onSelectChange,
                getCheckboxProps: (record) => ({
                  disabled: record.status === "InActive", // Disable checkbox nếu sinh viên bị đình chỉ
                }),
              }}
              columns={[
                {
                  title: "Tên sinh viên",
                  dataIndex: "username",
                  key: "username",
                  render: (text, record) =>
                    record.status === "InActive" ? (
                      <Tooltip title="Sinh viên này đã bị đình chỉ">
                        <span style={{ color: "gray" }}>{text}</span>
                      </Tooltip>
                    ) : (
                      <span>
                        {text}
                        {record.isLeader && (
                          <Tooltip title="Nhóm trưởng">
                            <StarFilled
                              style={{ color: "#FFD700", marginLeft: 5 }}
                            />
                          </Tooltip>
                        )}
                      </span>
                    ),
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  key: "email",
                },
              ]}
              dataSource={sourceStudents}
              rowKey="_id"
              pagination={{ pageSize: 5 }}
              title={() =>
                sourceGroup
                  ? `${
                      groups.find((group) => group._id === sourceGroup)?.name ||
                      ""
                    }`
                  : "Chọn nhóm"
              }
            />
          </Col>

          <Col
            xs={24}
            md={4}
            style={{
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Popconfirm
              title="Bạn có chắc chắn muốn chuyển sinh viên sang nhóm mới không?"
              onConfirm={handleTransfer}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                disabled={
                  selectedRowKeys.length === 0 || !sourceGroup || !targetGroup
                }
              >
                Chuyển sang
                <RightOutlined />
              </Button>
            </Popconfirm>
          </Col>

          <Col xs={24} md={10}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <Select
                placeholder="Chọn nhóm chuyển sang"
                style={{ width: "8rem" }}
                onChange={(value) => handleGroupChange("target", value)}
                value={targetGroup}
              >
                {groups
                  .filter(
                    (group) =>
                      group.status === "Active" && group._id !== sourceGroup // Chỉ hiển thị nhóm có status "Active"
                  )
                  .map((group) => (
                    <Select.Option key={group._id} value={group._id}>
                      {group.name}
                    </Select.Option>
                  ))}
              </Select>
            </div>
            <Table
              columns={[
                {
                  title: "Tên sinh viên",
                  dataIndex: "username",
                  key: "username",
                  render: (text, record) =>
                    record.status === "InActive" ? (
                      <Tooltip title="Sinh viên này đã bị đình chỉ">
                        <span style={{ color: "gray" }}>{text}</span>
                      </Tooltip>
                    ) : (
                      <span>
                        {text}
                        {record.isLeader && (
                          <Tooltip title="Nhóm trưởng">
                            <StarFilled
                              style={{ color: "#FFD700", marginLeft: 5 }}
                            />
                          </Tooltip>
                        )}
                      </span>
                    ),
                },
                {
                  title: "Mã sinh viên",
                  dataIndex: "rollNumber",
                  key: "rollNumber",
                },
              ]}
              dataSource={targetStudents}
              rowKey="_id"
              pagination={{ pageSize: 5 }}
              title={() =>
                targetGroup
                  ? `${
                      groups.find((group) => group._id === targetGroup)?.name ||
                      ""
                    }`
                  : "Chọn nhóm để chuyển"
              }
            />
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default TransferGroup;
