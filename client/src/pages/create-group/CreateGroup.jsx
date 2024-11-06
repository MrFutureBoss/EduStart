import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../../components/Modal/ConfirmModal.jsx";
import {
  Button,
  Col,
  ConfigProvider,
  DatePicker,
  Form,
  InputNumber,
  message,
  Row,
  Select,
  Switch,
} from "antd";
import SmallModal from "../../components/Modal/SmallModal.jsx";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import moment from "moment";
import locale from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { BASE_URL } from "../../utilities/initalValue.js";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setRuleToJoin } from "../../redux/slice/SettingCreateGroup.js";

const CreateGroup = ({ classId, show, close }) => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  // const userId = localStorage.getItem("userId");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [form] = Form.useForm();
  dayjs.locale("vi");

  const ruleJoin = useSelector((state) => state.settingCreateGroup.rulejoins);
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

      const ruleId = values.ruleJoin;
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
          autoFinish: autoFinish,
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
    <div className="modal-title-custom">
      <h3 style={{ color: "#FFF" }}>Tạo nhóm lớp</h3>
    </div>
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
          onFinish={handleSubmit} // Sử dụng onFinish để xử lý submit form
          initialValues={{
            autoFinish: false,
            groupCount: 5,
          }}
        >
          <Form.Item
            name="ruleJoin"
            label={
              <p
                className="remove-default-style-p"
                style={{ fontWeight: "600" }}
              >
                Chọn điều kiện tham gia mỗi nhóm
              </p>
            }
            rules={[
              {
                required: true,
                message: "Vui lòng chọn điều kiện tham gia nhóm",
              },
            ]}
          >
            <Select style={{ width: "11rem" }}>
              <Select.Option value="">Không có</Select.Option>
              {ruleJoin.length > 0 &&
                ruleJoin.map((rj) => (
                  <Select.Option key={rj?._id} value={rj?._id}>
                    {rj?.title}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="groupCount"
            label={
              <p
                className="remove-default-style-p"
                style={{ fontWeight: "600" }}
              >
                Chọn số lượng nhóm
              </p>
            }
            rules={[{ required: true, message: "Vui lòng chọn số lượng nhóm" }]}
          >
            <InputNumber min={3} max={10} prefix={<TeamOutlined />} />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="Chọn thời gian kết thúc"
            rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc" }]}
          >
            <ConfigProvider locale={locale}>
              <DatePicker
                placeholder="VD: 2024-08-23"
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

          <Form.Item
            name="autoFinish"
            valuePropName="checked"
            label={
              <span
                className="remove-default-style-p"
                style={{ fontWeight: "600" }}
              >
                Tự động hoàn thành xếp nhóm khi hết thời gian
              </span>
            }
          >
            <Switch />
          </Form.Item>
        </Form>
      </Col>
    </Row>
  );

  const modalFooter = (
    <>
      <Button color="primary" variant="solid" onClick={handleConfirmSubmit}>
        <PlusOutlined /> Tạo
      </Button>
      <Button color="danger" variant="solid" onClick={handleClose}>
        Thoát
      </Button>
    </>
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
