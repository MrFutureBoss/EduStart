import React, { useState, useMemo } from "react";
import {
  Steps,
  Tooltip,
  Typography,
  message,
  Modal,
  Select,
  Form,
  DatePicker,
  Button,
  Checkbox,
} from "antd";
import { UserOutlined, BellOutlined } from "@ant-design/icons";
import axios from "axios";
import "../../style/Activity/outcomeSteps.css";
import { BASE_URL } from "../../utilities/initalValue";

const { Step } = Steps;
const { Text } = Typography;
const { Option } = Select;

const OutcomeSteps = ({
  userId,
  jwt,
  assignedClassesCount,
  unassignedClasses,
  setAssignedClassesCount,
  setAssignedClasses,
  setUnassignedClasses,
  classList,
}) => {
  const [currentStep] = useState(0);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectAll, setSelectAll] = useState(false);

  const config = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${jwt}` },
    }),
    [jwt]
  );

  const assignedClasses = classList.filter(
    (cls) => !unassignedClasses.some((unassigned) => unassigned._id === cls._id)
  );

  const showAssignModal = () => {
    setIsAssignModalVisible(true);
  };

  const handleCancelAssignModal = () => {
    setIsAssignModalVisible(false);
    form.resetFields();
    setSelectAll(false);
  };

  const handleAssignOutcome = async (values) => {
    setLoading(true);
    const { startDate, deadline } = values;

    try {
      const classIdsToAssign = selectAll
        ? unassignedClasses.map((cls) => cls._id)
        : [values.classId];

      await Promise.all(
        classIdsToAssign.map((classId) =>
          axios.post(
            `${BASE_URL}/activity`,
            {
              assignmentType: "outcome 1",
              startDate: startDate.toISOString(),
              deadline: deadline.toISOString(),
              activityType: "outcome",
              classId,
            },
            config
          )
        )
      );

      message.success("Giao Outcome 1 thành công!");
      setIsAssignModalVisible(false);
      form.resetFields();
      setSelectAll(false);

      const updatedAssignedClasses = classList.filter((cls) =>
        classIdsToAssign.includes(cls._id)
      );
      const updatedUnassignedClasses = unassignedClasses.filter(
        (cls) => !classIdsToAssign.includes(cls._id)
      );

      setAssignedClasses((prev) => [...prev, ...updatedAssignedClasses]);
      setUnassignedClasses(updatedUnassignedClasses);
      setAssignedClassesCount((prev) => prev + classIdsToAssign.length);
    } catch (error) {
      console.error("Error assigning outcome:", error);
      message.error("Giao Outcome 1 thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outcome-steps-container">
      <div className="step-progress-bar">
        <Tooltip title="Step hiện tại đang ở Outcome 1">
          <div className="person-icon" style={{ left: "0%" }}>
            <UserOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
          </div>
        </Tooltip>
      </div>

      <Steps current={currentStep} size="default" direction="horizontal">
        <Step
          title="Outcome 1"
          description={
            <>
              <Tooltip
                title={
                  assignedClasses.length > 0
                    ? assignedClasses.length === 1
                      ? `${assignedClasses[0].className} đã được giao`
                      : `${assignedClasses.map((cls) => cls.className).join(", ")} đã được giao`
                    : "Chưa có lớp nào được giao"
                }
              >
                <Text type="success">
                  {assignedClassesCount}/{classList.length} lớp đã giao
                </Text>
              </Tooltip>
              <br />
              <Tooltip
                title={
                  unassignedClasses.length > 0
                    ? unassignedClasses.map((cls) => cls.className).join(", ")
                    : "Tất cả các lớp đã được giao"
                }
              >
                <Text type="warning">
                  {unassignedClasses.length}/{classList.length} chưa giao
                </Text>
                <BellOutlined
                  style={{
                    color: "#ff4d4f",
                    marginLeft: "8px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                  onClick={showAssignModal}
                />
              </Tooltip>
            </>
          }
        />
        <Step title="Outcome 2" description="" />
        <Step title="Outcome 3" description="" />
      </Steps>

      <Modal
        title="Giao Outcome cho các lớp"
        visible={isAssignModalVisible}
        onCancel={handleCancelAssignModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAssignOutcome}>
          <Form.Item>
            <Checkbox
              checked={selectAll}
              onChange={(e) => setSelectAll(e.target.checked)}
            >
              Giao cho tất cả các lớp chưa có Outcome
            </Checkbox>
          </Form.Item>
          <Form.Item
            name="classId"
            label="Chọn lớp"
            rules={[
              {
                required: !selectAll,
                message: "Vui lòng chọn lớp nếu không chọn tất cả",
              },
            ]}
          >
            <Select
              placeholder="Chọn lớp chưa giao outcome"
              disabled={selectAll}
              allowClear
            >
              {unassignedClasses.map((classItem) => (
                <Option key={classItem._id} value={classItem._id}>
                  {classItem.className}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[
              { required: true, message: "Vui lòng chọn ngày bắt đầu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const deadline = getFieldValue("deadline");
                  if (!value) {
                    return Promise.resolve();
                  }
                  if (!deadline || value.isBefore(deadline)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Ngày bắt đầu không thể sau hạn nộp")
                  );
                },
              }),
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="Hạn nộp"
            rules={[
              { required: true, message: "Vui lòng chọn hạn nộp" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue("startDate");
                  if (!value) {
                    return Promise.resolve();
                  }
                  if (!startDate || value.isAfter(startDate)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Hạn nộp phải sau ngày bắt đầu")
                  );
                },
              }),
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Giao Outcome (Outcome 1)
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OutcomeSteps;
