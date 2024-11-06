import React, { useEffect, useState } from "react";
import {
  List,
  Avatar,
  Button,
  message,
  Modal,
  Input,
  Select,
  DatePicker,
  Form,
  Divider,
  Dropdown,
  Menu,
  Tooltip,
} from "antd";
import {
  PlusCircleOutlined,
  FileTextOutlined,
  MoreOutlined,
  BellOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import "../../style/Activity/outcomeList.css";
import { BASE_URL } from "../../utilities/initalValue";

const { TextArea } = Input;
const { Option } = Select;

const OutcomeList = ({ selectedClassId, refreshPosts }) => {
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentOutcome, setCurrentOutcome] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const jwt = localStorage.getItem("jwt");
  const config = {
    headers: { Authorization: `Bearer ${jwt}` },
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchOutcomes(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchOutcomes = async (classId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/activity?activityType=outcome&classId=${classId}`,
        config
      );

      const filteredOutcomes = response.data.filter(
        (activity) => activity.activityType === "outcome"
      );

      setOutcomes(filteredOutcomes || []);
    } catch (error) {
      message.error("Error fetching outcomes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showCreateModal = () => setIsModalVisible(true);

  const handleCancelCreate = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    editForm.resetFields();
  };

  const handleCreateOutcome = async (values) => {
    console.log("handleCreateOutcome called with values:", values); // Debugging
    const { description, assignmentType, startDate, deadline } = values;

    if (assignmentType.toLowerCase() === "outcome 2") {
      const outcome1 = outcomes.find(
        (outcome) => outcome.assignmentType.toLowerCase() === "outcome 1"
      );
      if (!outcome1) {
        message.error("Bạn phải tạo Outcome 1 trước khi tạo Outcome 2.");
        return;
      }
      const outcome1Deadline = moment(outcome1.deadline);
      if (moment().isBefore(outcome1Deadline)) {
        message.error(
          "Không thể tạo Outcome 2 trước khi deadline của Outcome 1 đã qua."
        );
        return;
      }
    }

    if (assignmentType.toLowerCase() === "outcome 3") {
      const outcome2 = outcomes.find(
        (outcome) => outcome.assignmentType.toLowerCase() === "outcome 2"
      );
      if (!outcome2) {
        message.error("Bạn phải tạo Outcome 2 trước khi tạo Outcome 3.");
        return;
      }
      const outcome2Deadline = moment(outcome2.deadline);
      if (moment().isBefore(outcome2Deadline)) {
        message.error(
          "Không thể tạo Outcome 3 trước khi deadline của Outcome 2 đã qua."
        );
        return;
      }
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/activity`,
        {
          description,
          activityType: "outcome",
          assignmentType,
          startDate: startDate.toISOString(),
          deadline: deadline.toISOString(),
          classId: selectedClassId,
        },
        config
      );
      message.success("Outcome created successfully");
      setOutcomes((prevOutcomes) => [...prevOutcomes, response.data.activity]);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error creating outcome:", error); // Debugging
      if (error.response?.data?.message?.includes("already exists")) {
        message.warning("This Outcome type already exists for this class.");
      } else {
        message.error("Error creating outcome");
      }
    }
  };

  const showEditModal = (outcome) => {
    setCurrentOutcome(outcome);
    editForm.setFieldsValue({
      assignmentType: outcome.assignmentType,
      description: outcome.description,
      startDate: moment(outcome.startDate),
      deadline: moment(outcome.deadline),
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateOutcome = async (values) => {
    console.log("handleUpdateOutcome called with values:", values); // Debugging
    const { description, startDate, deadline } = values;

    try {
      await axios.patch(
        `${BASE_URL}/activity/${currentOutcome._id}`,
        {
          description,
          startDate: startDate.toISOString(),
          deadline: deadline.toISOString(),
        },
        config
      );
      message.success("Outcome updated successfully");
      fetchOutcomes(selectedClassId);
      setIsEditModalVisible(false);
      editForm.resetFields();
    } catch (error) {
      console.error("Error updating outcome:", error); // Debugging
      message.error("Error updating outcome");
    }
  };

  const menu = (outcome) => (
    <Menu>
      <Menu.Item onClick={() => showEditModal(outcome)}>Chỉnh sửa</Menu.Item>
    </Menu>
  );

  const sendReminder = async (outcome) => {
    try {
      await axios.post(
        `${BASE_URL}/activity/send-reminder`,
        {
          classId: selectedClassId,
          assignmentType: outcome.assignmentType,
          deadline: outcome.deadline,
        },
        config
      );
      message.success("Thông báo đã được gửi");

      if (refreshPosts) refreshPosts();
    } catch (error) {
      console.error("Error sending reminder:", error);
      message.error("Failed to send reminder.");
    }
  };

  return (
    <div className="outcome-list-container">
      <List
        style={{
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
        itemLayout="horizontal"
        dataSource={outcomes}
        loading={loading}
        locale={{ emptyText: "Chưa giao outcome" }}
        renderItem={(outcome) => (
          <List.Item className="outcome-list-item">
            <List.Item.Meta
              avatar={
                <Avatar
                  className="outcome-avatar"
                  icon={<FileTextOutlined />}
                />
              }
              title={<span>{outcome.assignmentType.toUpperCase()}</span>}
              description={
                <div>
                  {" "}
                  <div>{`Đã đăng vào ${moment(outcome.createdAt).format(
                    "HH:mm, DD MMM YYYY"
                  )}`}</div>
                  <div className="deadline-text">
                    Hạn nộp: {moment(outcome.deadline).format("DD-MM-YYYY")}
                    <Tooltip title="Gửi lời nhắc" style={{ marginLeft: "8px" }}>
                      <BellOutlined
                        className="bell-icon"
                        onClick={() => sendReminder(outcome)}
                      />
                    </Tooltip>
                  </div>
                </div>
              }
            />
            <Dropdown overlay={menu(outcome)} trigger={["click"]}>
              <div style={{ padding: "8px" }}>
                <MoreOutlined style={{ fontSize: "20px", cursor: "pointer" }} />
              </div>
            </Dropdown>
          </List.Item>
        )}
      />

      <Modal
        title="Tạo Outcome"
        visible={isModalVisible}
        onCancel={handleCancelCreate}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOutcome}
          className="form-padding"
        >
          <Form.Item name="description" label="Hướng dẫn (không bắt buộc)">
            <TextArea placeholder="Nhập hướng dẫn cho Outcome" rows={4} />
          </Form.Item>
          <Divider />
          <Form.Item
            name="assignmentType"
            label="Loại Outcome"
            rules={[{ required: true, message: "Vui lòng chọn loại Outcome" }]}
          >
            <Select placeholder="Chọn loại Outcome">
              <Option value="outcome 1">Outcome 1</Option>
              <Option value="outcome 2">Outcome 2</Option>
              <Option value="outcome 3">Outcome 3</Option>
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
                  if (!value || !deadline || value.isBefore(deadline)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Ngày bắt đầu không thể sau hạn nộp.")
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
                  if (!value || !startDate || value.isAfter(startDate)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Hạn nộp không thể trước Ngày bắt đầu.")
                  );
                },
              }),
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Divider />
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu Outcome
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Outcome Modal */}
      <Modal
        title="Chỉnh sửa Outcome"
        visible={isEditModalVisible}
        onCancel={handleCancelEdit}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateOutcome}
          className="form-padding"
        >
          <Form.Item name="assignmentType" label="Loại Outcome">
            <Input disabled />
          </Form.Item>
          <Form.Item name="description" label="Hướng dẫn (không bắt buộc)">
            <TextArea placeholder="Nhập hướng dẫn cho Outcome" rows={4} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[
              { required: true, message: "Vui lòng chọn ngày bắt đầu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const deadline = getFieldValue("deadline");
                  if (!value || !deadline || value.isBefore(deadline)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Ngày bắt đầu không thể sau hạn nộp.")
                  );
                },
              }),
            ]}
          >
            <DatePicker style={{ width: "100%" }} disabled />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="Hạn nộp"
            rules={[
              { required: true, message: "Vui lòng chọn hạn nộp" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue("startDate");
                  if (!value || !startDate || value.isAfter(startDate)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Hạn nộp không thể trước Ngày bắt đầu.")
                  );
                },
              }),
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật Outcome
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* <Button
        icon={<PlusCircleOutlined />}
        onClick={showCreateModal}
        className="create-outcome-button"
      >
        Giao outcome
      </Button> */}
    </div>
  );
};

export default OutcomeList;
