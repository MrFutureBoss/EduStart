import React, { useEffect, useMemo, useState } from "react";
import SmallModal from "../../../components/Modal/SmallModal";
import { BASE_URL } from "../../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setLoading } from "../../../redux/slice/ClassManagementSlice";
import { setMatchedGroups } from "../../../redux/slice/MatchedGroupSlice";
import {
  Col,
  Collapse,
  DatePicker,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Tooltip,
  Typography,
} from "antd";
import ConfirmButton from "../../../components/Button/ConfirmButton";
import CancelButton from "../../../components/Button/CancelButton";
import moment from "moment";
import dayjs from "dayjs";
import { runes } from "runes2";
import { CaretRightOutlined } from "@ant-design/icons";
import "../../../style/Mentor/GroupList.css";

const { Text } = Typography;
const { Panel } = Collapse;

const EditMeetingDay = ({ open, close, eventId, selectedEvent }) => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState("Chọn giờ bắt đầu trước");
  const [form] = Form.useForm();
  const [conflictMessage, setConflictMessage] = useState("");
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
    if (selectedEvent) {
      const startMoment = moment(selectedEvent.start);
      setSelectedDate(startMoment.clone().startOf("day"));
      setStartTime(startMoment);
      setEndTime(startMoment.clone().add(150, "minutes").format("HH:mm"));
      form.setFieldsValue({
        meetingContent: selectedEvent.title,
        meetingDate: startMoment,
        meetingStartTime: startMoment,
      });
    }
  }, [selectedEvent]);

  const groups = useSelector((state) => state.matchedGroup.data || []);

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
        const groupResponse = await axios.get(
          `${BASE_URL}/matched/mentor/${userId}`,
          config
        );
        dispatch(setMatchedGroups(groupResponse.data?.groups));
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [config, dispatch, userId]);

  const disabledDate = (current) => {
    const today = moment().startOf("day");
    const month = today.month() + 1;
    let startMonth, endMonth;

    if (month >= 1 && month <= 4) {
      startMonth = 1;
      endMonth = 4;
    } else if (month >= 5 && month <= 8) {
      startMonth = 5;
      endMonth = 8;
    } else {
      startMonth = 9;
      endMonth = 12;
    }

    const startOfTerm = moment()
      .month(startMonth - 1)
      .startOf("month");
    const endOfTerm = moment()
      .month(endMonth - 1)
      .endOf("month");

    return (
      current &&
      (current < today || current < startOfTerm || current > endOfTerm)
    );
  };

  const disabledRangeTime = (selectedDate, type) => {
    const now = dayjs();
    const startHour = 7;
    const endHour = 20;

    if (!selectedDate) return {};

    if (type === "start") {
      return {
        disabledHours: () => {
          const hours = Array.from({ length: 24 }, (_, i) => i);
          if (selectedDate.isSame(now, "day")) {
            return hours.filter(
              (hour) => hour < now.hour() || hour < startHour || hour > endHour
            );
          }
          return hours.filter((hour) => hour < startHour || hour > endHour);
        },
        disabledMinutes: (selectedHour) => {
          if (selectedDate.isSame(now, "day") && selectedHour === now.hour()) {
            return Array.from({ length: now.minute() + 10 }, (_, i) => i);
          }
          return [];
        },
      };
    }

    return {};
  };

  useEffect(() => {
    if (startTime) {
      setEndTime(startTime.clone().add(150, "minutes").format("HH:mm"));
    }
  }, [startTime]);

  const checkConflict = (selectedStart) => {
    let conflict = "";
    if (selectedDate && selectedStart) {
      const selectedStartTime = selectedDate
        .hour(selectedStart.hour())
        .minute(selectedStart.minute());
      const selectedEndTime = selectedStartTime.clone().add(150, "minutes");

      groups.forEach((group) => {
        group.matchedDetails?.time.forEach((meeting) => {
          if (meeting._id === eventId) return;

          const meetingStart = moment(meeting.start);
          const meetingEnd = moment(meeting.end);

          if (
            (selectedStartTime.isBefore(meetingEnd) &&
              selectedEndTime.isAfter(meetingStart)) ||
            selectedStartTime.isSame(meetingStart) ||
            selectedEndTime.isSame(meetingEnd)
          ) {
            conflict = `Trùng cuộc hẹn với lớp ${group.class.className} - ${
              group.group.name
            } vào ${meetingStart.format("DD-MM-YYYY")} từ ${meetingStart.format(
              "HH:mm"
            )} đến ${meetingEnd.format("HH:mm")}`;
          }
        });
      });
    }
    setConflictMessage(conflict);
  };

  const handleUpdateEvent = async () => {
    if (conflictMessage) {
      message.error("Thời gian họp bị trùng, vui lòng chọn thời gian khác.");
      return;
    }

    try {
      if (!eventId) {
        message.error("ID không hợp lệ. Vui lòng kiểm tra lại.");
        return;
      }

      const start = selectedDate
        .hour(startTime.hour())
        .minute(startTime.minute())
        .second(0)
        .toISOString();

      const end = selectedDate
        .hour(startTime.hour())
        .minute(startTime.minute() + 150)
        .second(0)
        .toISOString();

      const updatedEvent = {
        title: form.getFieldValue("meetingContent") || "outcome",
        allDay: false,
        start: start,
        end: end,
      };

      const response = await axios.patch(
        `${BASE_URL}/matched/time/${eventId}`,
        updatedEvent,
        config
      );

      if (response.status === 200) {
        const groupResponse = await axios.get(
          `${BASE_URL}/matched/mentor/${userId}`,
          config
        );

        dispatch(setMatchedGroups(groupResponse.data?.groups));

        message.success("Cuộc họp đã được cập nhật thành công!");
        close();
      } else {
        console.error("Error response:", response);
        message.error("Có lỗi xảy ra khi cập nhật cuộc họp. Vui lòng thử lại.");
      }
    } catch (error) {
      if (error.response) {
        console.error("API Error:", error.response.data);
        message.error(
          `Có lỗi xảy ra từ server: ${error.response.data.message}`
        );
      } else {
        console.error("Error:", error.message);
        message.error("Có lỗi xảy ra khi kết nối với server.");
      }
    }
  };

  const modalContent = (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 10 }}
        wrapperCol={{ span: 14 }}
        labelAlign="left"
        style={{ width: "380px" }}
      >
        <Form.Item
          label="Điền nội dung họp"
          name="meetingContent"
          rules={[{ required: true, message: "Vui lòng nhập nội dung họp" }]}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          extra={
            <span
              style={{ color: "#888", fontSize: "12px", fontStyle: "italic" }}
            >
              Chỉ được điền tối đa 40 từ
            </span>
          }
        >
          <Input
            placeholder="VD: Outcome 1"
            maxLength={40}
            style={{ width: "350px" }}
          />
        </Form.Item>

        <Form.Item
          style={{ marginBottom: "0.6rem" }}
          label={
            <span
              style={{ textAlign: "right", width: "100%", fontWeight: "500" }}
            >
              Ngày họp
            </span>
          }
          name="meetingDate"
        >
          <DatePicker
            placeholder="Ngày họp"
            style={{ width: "150px" }}
            value={selectedDate}
            onChange={(value) => {
              setSelectedDate(value);
              if (startTime) {
                const updatedStartTime = moment(value)
                  .hour(startTime.hour())
                  .minute(startTime.minute());
                setStartTime(updatedStartTime);
              }
            }}
            disabled
          />
        </Form.Item>

        <Form.Item
          style={{ marginBottom: "0.6rem", marginTop: "24px" }}
          label={
            <span
              style={{ textAlign: "right", width: "100%", fontWeight: "500" }}
            >
              Giờ bắt đầu
            </span>
          }
          name="meetingStartTime"
          extra={
            <>
              <span style={{ color: "#888", fontSize: "12px" }}>
                Giờ kết thúc: {endTime}
              </span>
            </>
          }
        >
          <DatePicker
            picker="time"
            placeholder="Chọn giờ bắt đầu"
            style={{ width: "150px" }}
            value={startTime}
            onChange={(value) => {
              setStartTime(value);
              if (value) {
                setEndTime(
                  value.clone().add(150, "minutes").format("HH:mm")
                );
              } else {
                setEndTime("Chọn giờ bắt đầu trước");
              }
            }}
            showTime={{
              hideDisabledOptions: true,
              format: "HH:mm",
            }}
            format="HH:mm"
          />
        </Form.Item>
        {conflictMessage && (
          <Text type="danger" style={{ display: "block", marginTop: "10px" }}>
            {conflictMessage}
          </Text>
        )}
      </Form>
    </div>
  );

  const modalFooter = (
    <Row>
      <Col
        span={24}
        style={{ display: "flex", gap: "10px", justifyContent: "end" }}
      >
        <Popconfirm
          title="Bạn có chắc chắn muốn cập nhật cuộc họp này không?"
          onConfirm={handleUpdateEvent}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <ConfirmButton
            content="Cập nhật"
            disabled={
              !clientReady ||
              !!conflictMessage ||
              !!form.getFieldsError().filter(({ errors }) => errors.length)
                .length
            }
          />
        </Popconfirm>
        <CancelButton content="Hủy" onClick={close} />
      </Col>
    </Row>
  );

  return (
    <SmallModal
      title="Chỉnh sửa cuộc họp"
      content={modalContent}
      footer={modalFooter}
      closeable={true}
      isModalOpen={open}
      handleCancel={close}
    />
  );
};

export default EditMeetingDay;
