import React, { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../../utilities/initalValue";
import SmallModal from "../../components/Modal/SmallModal";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setLoading } from "../../redux/slice/ClassManagementSlice";
import { setMatchedGroups } from "../../redux/slice/MatchedGroupSlice";
import {
  Col,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Tooltip,
} from "antd";
import ConfirmButton from "../../components/Button/ConfirmButton";
import CancelButton from "../../components/Button/CancelButton";
import moment from "moment";
import dayjs from "dayjs";
import { runes } from "runes2";
import { CaretRightOutlined } from "@ant-design/icons";
import "../../style/Mentor/GroupList.css";

const range = (start, end) => {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
};

const { Panel } = Collapse;

const EditMeetingDay = ({ open, close, groupId }) => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState("Chưa xác định");
  const [duration, setDuration] = useState(90);
  const [form] = Form.useForm();

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  const groups = useSelector((state) => state.matchedGroup.data || []);

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
    const month = today.month() + 1; // Tháng bắt đầu từ 0, nên cần cộng thêm 1
    let startMonth, endMonth;

    // Xác định kỳ học hiện tại
    if (month >= 1 && month <= 4) {
      // Kỳ học 1: Tháng 1, 2, 3, 4
      startMonth = 1;
      endMonth = 4;
    } else if (month >= 5 && month <= 8) {
      // Kỳ học 2: Tháng 5, 6, 7, 8
      startMonth = 5;
      endMonth = 8;
    } else {
      // Kỳ học 3: Tháng 9, 10, 11, 12
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

  const disabledRangeTime = (start, end) => (selectedDate, type) => {
    const now = dayjs();
    const startHour = 7;
    const endHour = 22;

    if (!selectedDate) return {};

    if (type === "start") {
      return {
        disabledHours: () => {
          const hours = range(0, 24);
          if (selectedDate.isSame(now, "day")) {
            return hours.filter(
              (hour) => hour < now.hour() || hour < startHour
            );
          }
          return hours.filter((hour) => hour < startHour || hour >= endHour);
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

  const formatDuration = (minutes) => {
    if (minutes === null) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours} tiếng` : ""} ${
      mins > 0 ? `${mins} phút` : ""
    }`.trim();
  };

  const calculateEndTime = () => {
    if (!startTime) return "";
    return startTime.clone().add(duration, "minutes").format("HH:mm");
  };

  useEffect(() => {
    if (startTime) {
      setEndTime(startTime.clone().add(duration, "minutes").format("HH:mm"));
    }
  }, [startTime, duration]);

  const handleMakeNewEvent = async () => {
    try {
      // Kiểm tra giá trị groupId
      if (!groupId) {
        message.error("Group ID không hợp lệ. Vui lòng kiểm tra lại.");
        return;
      }

      const start = moment(selectedDate)
        .hour(startTime.hour())
        .minute(startTime.minute())
        .second(0)
        .toISOString();

      const end = moment(selectedDate)
        .hour(startTime.hour())
        .minute(startTime.minute() + duration)
        .second(0)
        .toISOString();

      const newEvent = {
        title: form.getFieldValue("meetingContent") || "outcome",
        allDay: false,
        start: start,
        end: end,
      };

      console.log("Group ID:", groupId);
      console.log("New Event:", newEvent);

      // Gửi request tới server
      const response = await axios.post(
        `${BASE_URL}/matched/time/${groupId}`,
        { time: [newEvent] },
        config
      );

      // Kiểm tra phản hồi từ server
      if (response.status === 200) {
        const updatedGroups = groups.map((group) => {
          if (group.matchedDetails._id === groupId) {
            return {
              ...group,
              matchedDetails: {
                ...group.matchedDetails,
                time: [...(group.matchedDetails.time || []), newEvent], // Đảm bảo thêm sự kiện mới mà vẫn giữ các sự kiện cũ
              },
            };
          }
          return group;
        });

        dispatch(setMatchedGroups(updatedGroups));

        message.success("Lịch họp đã được tạo thành công!");
        close(); // Đóng modal sau khi thành công
      } else {
        console.error("Error response:", response);
        message.error("Có lỗi xảy ra khi tạo lịch họp. Vui lòng thử lại.");
      }
    } catch (error) {
      // In chi tiết lỗi để hiểu rõ hơn
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
          label={
            <span
              style={{ textAlign: "right", width: "100%", fontWeight: "500" }}
            >
              Điền nội dung họp
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
              Chỉ được điền tối đa 40 từ
            </span>
          }
        >
          <Input
            placeholder="VD: Outcome 1"
            count={{
              show: true,
              max: 40,
              strategy: (txt) => runes(txt).length,
              exceedFormatter: (txt, { max }) =>
                runes(txt).slice(0, max).join(""),
            }}
            style={{ width: "350px" }} // Đảm bảo input chiếm hết chiều ngang
          />
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
              border: "1px solid #d9d9d9", // Thêm border để nhận biết cần chú ý
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
        >
          <Tooltip
            title={!selectedDate ? "Hãy chọn ngày trước khi chọn giờ" : ""}
            placement="top"
          >
            <DatePicker
              picker="time"
              placeholder="Chọn giờ bắt đầu"
              style={{ width: "150px" }}
              disabledDate={disabledDate}
              disabledTime={(date) =>
                selectedDate
                  ? disabledRangeTime(null, null)(selectedDate, "start")
                  : {}
              }
              onChange={(value) => {
                setStartTime(value);
                if (value) {
                  setEndTime(
                    value.clone().add(duration, "minutes").format("HH:mm")
                  );
                } else {
                  setEndTime("");
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
              (*) Giới hạn chọn giờ bắt đầu từ 7h30 đến 22h
              <br />
              (*) Lưu ý bạn không thể điền giờ đã qua nếu chọn ngày hôm nay
            </small>
          </Panel>
        </Collapse>

        <Form.Item
          style={{ marginBottom: "0.6rem", marginTop: "24px" }}
          label={
            <span
              style={{ textAlign: "right", width: "100%", fontWeight: "500" }}
            >
              Chọn thời lượng họp
            </span>
          }
          name="meetingDuration"
          rules={[{ required: true, message: "Vui lòng chọn thời lượng họp" }]}
          extra={
            <>
              <span style={{ color: "#888", fontSize: "12px" }}>
                Thời gian họp là: {formatDuration(duration)}
              </span>{" "}
              <br />
              <span style={{ color: "#888", fontSize: "12px" }}>
                Giờ kết thúc: {endTime}
              </span>
            </>
          }
        >
          <InputNumber
            min={15}
            max={180}
            step={30}
            defaultValue={90}
            value={duration}
            onChange={(value) => {
              if (value >= 15) {
                setDuration(value);
              }
            }}
            onBlur={() => {
              if (duration < 15) {
                setDuration(15);
              }
            }}
            placeholder="Điền phút"
            style={{ width: "150px" }}
            disabled={!selectedDate || !startTime}
            changeOnWheel
          />
        </Form.Item>
        <Collapse
          className="custom-panel-header"
          bordered={false}
          style={{
            marginBottom: "16px",
            width: "315px",
            backgroundColor: "#E6F4FF",
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
                Lưu ý về chọn thời lượng họp !
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
              (*) Giới hạn chọn thời lượng cuộc họp ít nhất 15 phút và tối đa 3
              tiếng
            </small>
            <br />
            <small style={{ fontSize: "12px" }}>
              (*) Thời gian kết thúc cuộc họp không quá 23h
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
          // disabled={
          //   !form.isFieldsTouched(true) ||
          //   form.getFieldsError().some(({ errors }) => errors.length)
          // }
        >
          <ConfirmButton
            content="Thêm vào"
            // disabled={
            //   !form.isFieldsTouched(true) ||
            //   form.getFieldsError().some(({ errors }) => errors.length) ||
            //   !selectedDate ||
            //   !startTime ||
            //   !duration
            // }
          />
        </Popconfirm>
        <CancelButton content="Hủy" onClick={close} />
      </Col>
    </Row>
  );

  return (
    <SmallModal
      title="Thêm cuộc họp mới"
      content={modalContent}
      footer={modalFooter}
      closeable={true}
      isModalOpen={open}
      handleCancel={close}
    />
  );
};

export default EditMeetingDay;
