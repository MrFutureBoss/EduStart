import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import {
  Col,
  ConfigProvider,
  DatePicker,
  Form,
  InputNumber,
  message,
  Row,
} from "antd";
import SmallModal from "../../components/Modal/SmallModal.jsx";
import moment from "moment";
import locale from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setRuleToJoin } from "../../redux/slice/SettingCreateGroup.js";
import AddButton from "../../components/Button/AddButton.jsx";
import CancelButton from "../../components/Button/CancelButton.jsx";

const CreateGroup = ({ classId, show, close }) => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  // const userId = localStorage.getItem("userId");
  const [averageMembers, setAverageMembers] = useState(5);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [form] = Form.useForm();
  dayjs.locale("vi");
  const totalWaitUsers = useSelector((state) => state.tempGroup.waittotal || 0);

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
        const response = await axios.get(`${BASE_URL}/rulejoin`, config);
        dispatch(setRuleToJoin(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [config, dispatch]);

  const disabledDate = (current) => {
    return current && current < moment().endOf("day");
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const deadline = values.deadline;

      const ruleId = "6725c81105c6e73505972b32";
      const autoFinish = values.autoFinish || false;
      const groupCount = values.groupCount;

      const baseMaxStudent = Math.floor(totalWaitUsers / groupCount);
      const remainder = totalWaitUsers % groupCount;
      const tempGroups = Array.from({ length: groupCount }, (_, index) => ({
        classId,
        groupName: `Nhóm ${index + 1}`,
        status: false,
        userIds: [],
        maxStudent: index < remainder ? baseMaxStudent + 1 : baseMaxStudent,
      }));

      console.log("Data being sent:", {
        createGroupSettingData: {
          classId: classId,
          deadline: deadline.toISOString(),
          autoFinish: true,
          status: false,
          ruleJoin: [ruleId],
        },
        tempGroupsData: tempGroups,
      });

      await axios.post(
        `${BASE_URL}/creategroupsetting`,
        {
          createGroupSettingData: {
            classId: classId,
            deadline: deadline,
            autoFinish: autoFinish,
            status: false,
            ruleJoin: [ruleId],
          },
          tempGroupsData: tempGroups,
        },
        config
      );

      message.success("Bạn đã tạo nhóm thành công!");
      setShowConfirmModal(false);
      close();
      window.location.reload();
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error(
        error.response && error.response.data
          ? `Submission failed: ${error.response.data.message}`
          : `Submission failed: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleGroupCountChange = (value) => {
    if (!value || value <= 0) {
      setAverageMembers(0); // Nếu không có giá trị hợp lệ, đặt lại 0
    } else {
      setAverageMembers(Math.floor(totalWaitUsers / value)); // Cập nhật trung bình
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const handleClose = () => {
    close();
  };

  const modalHeader = (
      <h3 style={{ color: "#FFF" }}>Tạo nhóm lớp</h3>
  );

  const modalBody = (
    <Row>
      <Col sm={24} style={{ display: "flex", justifyContent: "center" }}>
        <Form
          layout="horizontal"
          style={{
            maxWidth: 800,
          }}
          form={form}
          onFinish={handleSubmit} 
          initialValues={{
            autoFinish: false,
            groupCount: 5,
          }}
        >
          <Form.Item
            name="groupCount"
            label={
              <p
                className="remove-default-style-p"
                style={{ fontWeight: "600" }}
              >
                Chọn số nhóm
              </p>
            }
            rules={[{ required: true, message: "Vui lòng chọn số lượng nhóm" }]}
          >
            <InputNumber
              min={3}
              max={10}
              style={{ width: "4rem" }}
              onChange={handleGroupCountChange}
            />
          </Form.Item>
          <div style={{marginBottom:'2rem'}}>
            <small
              style={{ fontSize: "12px", color: "#888", lineHeight: "1.4" }}
            >
              Với sĩ số {totalWaitUsers} thì trung bình mỗi nhóm có{" "}
              <span style={{ fontWeight: "600", color: "#1890ff" }}>
                {averageMembers}
              </span>{" "}
              thành viên
            </small>
          </div>
          <Form.Item
            name="deadline"
            label={
              <p
                className="remove-default-style-p"
                style={{ fontWeight: "600" }}
              >
                Chọn thời gian kết thúc
              </p>
            }
            rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc" }]}
          >
            <ConfigProvider locale={locale}>
              <DatePicker
                placeholder="2024-08-23"
                disabledDate={disabledDate}
                showToday={false}
                format="YYYY-MM-DD"
                onChange={(date) => {
                  if (date) {
                    const dateAsJSDate = date.toDate();
                    form.setFieldsValue({ deadline: dateAsJSDate });
                    console.log("Selected date as JS Date:", dateAsJSDate);
                  } else {
                    console.log("No date selected");
                    form.setFieldsValue({ deadline: null });
                  }
                }}
              />
            </ConfigProvider>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  );

  const modalFooter = (
    <div style={{ display: "flex", gap: "1rem", justifyContent: "end" }}>
      <AddButton content="Tạo"  onClick={handleConfirmSubmit}/>
      <CancelButton content="Thoát" onClick={handleClose}/>
    </div>
  );

  return (
    <>
      <SmallModal
        title={modalHeader}
        content={modalBody}
        footer={modalFooter}
        isModalOpen={show}
        handleOk={showConfirmModal}
        handleCancel={close}
      />
      <ConfirmModal
        show={showConfirmModal}
        title="Xác nhận tạo nhóm"
        content="Bạn có chắc chắn muốn tạo nhóm với những điều kiện này không?"
        onConfirm={handleSubmit}
        onCancel={handleCancelSubmit}
      />
    </>
  );
};

export default CreateGroup;
