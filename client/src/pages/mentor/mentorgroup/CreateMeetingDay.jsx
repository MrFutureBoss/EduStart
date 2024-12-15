import React, { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../../../utilities/initalValue";
import SmallModal from "../../../components/Modal/SmallModal";
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
  Select,
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
import { Option } from "antd/es/mentions";

const { Text } = Typography;

const range = (start, end) => {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
};

const { Panel } = Collapse;

const CreateMeetingDay = ({ open, close }) => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState("Chọn giờ bắt đầu trước");
  const [form] = Form.useForm();
  const [conflictMessage, setConflictMessage] = useState("");
  const [clientReady, setClientReady] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null); // Chọn lớp
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    setClientReady(true);
  }, []);
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

  const classes = useMemo(() => {
    // Lấy danh sách lớp duy nhất từ groups
    return [...new Set(groups.map((group) => group.class.className))].map(
      (className) => ({
        value: className,
        label: className,
      })
    );
  }, [groups]);

  const filteredGroups = useMemo(() => {
    // Lọc nhóm theo lớp được chọn
    return groups.filter(
      (group) =>
        group.class.className === selectedClass &&
        group.matchedDetails.status === "Accepted"
    );
  }, [groups, selectedClass]);

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
          const hours = range(0, 24);
          if (selectedDate.isSame(now, "day")) {
            return hours.filter(
              (hour) => hour < now.hour() || hour < startHour || hour > endHour
            );
          }
          return hours.filter((hour) => hour < startHour || hour > endHour);
        },
        disabledMinutes: (selectedHour) => {
          if (selectedDate.isSame(now, "day") && selectedHour === now.hour()) {
            return range(0, now.minute() + 10);
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

      // Duyệt qua tất cả các nhóm và cuộc họp của nhóm để kiểm tra xung đột
      groups.forEach((group) => {
        group.matchedDetails?.time.forEach((meeting) => {
          const meetingStart = moment(meeting.start);
          const meetingEnd = moment(meeting.end);

          // Kiểm tra nếu khoảng thời gian của cuộc họp mới giao nhau với khoảng thời gian cuộc họp đã tồn tại
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

  const handleMakeNewEvent = async () => {
    if (conflictMessage) {
      message.error("Thời gian họp bị trùng, vui lòng chọn thời gian khác.");
      return;
    }

    try {
      if (!selectedGroupId) {
        message.error("Group ID không hợp lệ. Vui lòng kiểm tra lại.");
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

      const newEvent = {
        title: form.getFieldValue("meetingContent") || "outcome",
        allDay: false,
        start: start,
        end: end,
      };

      const response = await axios.post(
        `${BASE_URL}/matched/time/${selectedGroupId}`,
        { time: [newEvent] },
        config
      );
      if (response.status === 200) {
        const groupResponse = await axios.get(
          `${BASE_URL}/matched/mentor/${userId}`,
          config
        );

        dispatch(setMatchedGroups(groupResponse.data?.groups));

        message.success("Lịch họp đã được tạo thành công!");
        close();
      } else {
        console.error("Error response:", response);
        message.error("Có lỗi xảy ra khi tạo lịch họp. Vui lòng thử lại.");
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

  const handleClassChange = (value) => {
    setSelectedClass(value);
    setSelectedGroupId(null);
  };

  const handleGroupChange = (value) => {
    setSelectedGroupId(value);
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
          label={
            <span
              style={{ textAlign: "right", width: "100%", fontWeight: "500" }}
            >
              Điền tiêu đề lịch họp
            </span>
          }
          name="meetingContent"
          rules={[{ required: true, message: "Vui lòng nhập nội dung họp" }]}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          extra={
            <span
              style={{ color: "#888", fontSize: "12px", fontStyle: "italic" }}
            >
              Chỉ được điền tối đa 200 chữ
            </span>
          }
        >
          <Input
            placeholder="VD: Outcome 1"
            count={{
              show: true,
              max: 200,
              strategy: (txt) => runes(txt).length,
              exceedFormatter: (txt, { max }) =>
                runes(txt).slice(0, max).join(""),
            }}
            style={{ width: "350px" }}
            minLength={2}
          />
        </Form.Item>

        <Form.Item
          label={
            <span
              style={{ textAlign: "right", width: "100%", fontWeight: "500" }}
            >
              Chọn lớp và nhóm
            </span>
          }
          name="selectedGroupId"
          rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
        >
          <Select
            value={selectedClass}
            style={{ width: "8rem", marginRight: "0.5rem" }}
            onChange={handleClassChange}
            placeholder="Chọn lớp"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {classes.map((classItem) => (
              <Option key={classItem.value} value={classItem.value}>
                {classItem.label}
              </Option>
            ))}
          </Select>
          <Select
            value={selectedGroupId}
            style={{ width: "8rem" }}
            onChange={handleGroupChange}
            placeholder="Chọn nhóm"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.children.toLowerCase().includes(input.toLowerCase())
            }
            disabled={!selectedClass}
          >
            {filteredGroups.map((group) => (
              <Option
                key={group.matchedDetails._id}
                value={group.matchedDetails._id}
              >
                {group.group.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          style={{ marginBottom: "0.6rem" }}
          label={
            <span
              style={{ textAlign: "right", width: "100%", fontWeight: "500" }}
            >
              Chọn ngày họp
            </span>
          }
          name="meetingDate"
          rules={[
            { required: true, message: "Vui lòng chọn ngày bắt đầu họp" },
          ]}
        >
          <DatePicker
            placeholder="Chọn ngày"
            style={{ width: "150px" }}
            disabledDate={disabledDate}
            onChange={(value) => {
              setSelectedDate(value);
              if (startTime) {
                const updatedStartTime = moment(value)
                  .hour(startTime.hour())
                  .minute(startTime.minute());
                setStartTime(updatedStartTime);
              }
            }}
          />
        </Form.Item>
        <Collapse
          className="custom-panel-header"
          bordered={false}
          style={{
            marginBottom: "16px",
            width: "315px",
          }}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          )}
        >
          <Panel
            header={
              <p
                className="remove-default-style-p"
                style={{ fontSize: "0.8rem", fontWeight: "500", margin: 0 }}
              >
                Lưu ý về chọn ngày !
              </p>
            }
            key="1"
            style={{
              background: "#f7f7f7",
              borderRadius: "8px",
              marginTop: "8px",
              border: "1px solid #d9d9d9",
            }}
          >
            <small style={{ fontSize: "12px" }}>
              (*) Ví dụ nhập: 22-11-2024
              <br />
              (*) Chỉ được chọn ngày trong kỳ học hiện tại
              <br />
              (*) Lưu ý bạn không thể điền ngày đã qua
            </small>
          </Panel>
        </Collapse>

        <Form.Item
          style={{ marginBottom: "0.6rem", marginTop: "24px" }}
          label={
            <span
              style={{ textAlign: "right", width: "100%", fontWeight: "500" }}
            >
              Chọn giờ bắt đầu
            </span>
          }
          name="meetingStartTime"
          rules={[
            { required: true, message: "Vui lòng chọn thời gian bắt đầu họp" },
          ]}
          extra={
            <>
              <span style={{ color: "#888", fontSize: "12px" }}>
                Giờ kết thúc: {endTime}
              </span>
            </>
          }
        >
          <Tooltip
            title={!selectedDate ? "Hãy chọn ngày trước khi chọn giờ" : ""}
            placement="top"
          >
            <DatePicker
              picker="time"
              placeholder="Chọn giờ bắt đầu"
              style={{ width: "150px" }}
              disabledTime={(date) =>
                selectedDate ? disabledRangeTime(selectedDate, "start") : {}
              }
              onChange={(value) => {
                setStartTime(value);
                if (value) {
                  setEndTime(
                    value.clone().add(150, "minutes").format("HH:mm") // +2 tiếng rưỡi
                  );
                  checkConflict(value);
                } else {
                  setEndTime("Chọn giờ bắt đầu trước");
                  setConflictMessage("");
                }
              }}
              showTime={{
                hideDisabledOptions: true,
                format: "HH:mm",
              }}
              format="HH:mm"
              disabled={!selectedDate}
            />
          </Tooltip>
        </Form.Item>
        {conflictMessage && (
          <Text type="danger" style={{ display: "block", marginTop: "10px" }}>
            {conflictMessage}
          </Text>
        )}
        <Collapse
          bordered={false}
          style={{
            marginBottom: "16px",
            width: "315px",
          }}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          )}
          className="custom-panel-header"
        >
          <Panel
            header={
              <p
                className="remove-default-style-p"
                style={{ fontSize: "0.8rem", fontWeight: "500", margin: 0 }}
              >
                Lưu ý về chọn giờ !
              </p>
            }
            key="1"
            style={{
              background: "#f7f7f7",
              borderRadius: "8px",
              marginTop: "8px",
              border: "1px solid #d9d9d9",
            }}
          >
            <small style={{ fontSize: "12px" }}>
              (*) Ví dụ nhập: 13:45
              <br />
              (*) Giới hạn giờ bắt đầu từ 7h đến 20h30
              <br />
              (*) Lưu ý bạn không thể nhập hoặc chọn giờ đã qua nếu chọn ngày
              hôm nay
            </small>
          </Panel>
        </Collapse>
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
          title="Bạn có chắc chắn muốn thêm lịch họp này không?"
          onConfirm={handleMakeNewEvent}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <ConfirmButton
            content="Thêm vào"
            disabled={
              !clientReady ||
              !selectedGroupId ||
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
      title="Thêm lịch họp mới"
      content={modalContent}
      footer={modalFooter}
      closeable={true}
      isModalOpen={open}
      handleCancel={close}
    />
  );
};

export default CreateMeetingDay;