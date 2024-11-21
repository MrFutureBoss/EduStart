import React, { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../../utilities/initalValue";
import SmallModal from "../../components/Modal/SmallModal";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setLoading } from "../../redux/slice/ClassManagementSlice";
import { setMatchedGroups } from "../../redux/slice/MatchedGroupSlice";
import { Col, DatePicker, Form, Input, Row, Tooltip } from "antd";
import ConfirmButton from "../../components/Button/ConfirmButton";
import CancelButton from "../../components/Button/CancelButton";
import moment from "moment";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const range = (start, end) => {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
};

const CreateMeetingDay = ({ open, close }) => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(null);
  const [rangeStart, setRangeStart] = useState(null);

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
    const maxDate = today.clone().add(3, "months").endOf("day");
    const endOfYear = today.clone().endOf("year");

    return (
      current &&
      (current < today ||
        current > maxDate ||
        current.year() > endOfYear.year())
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
            // Nếu là hôm nay, loại bỏ giờ đã qua
            return hours.filter(
              (hour) => hour < now.hour() || hour < startHour
            );
          }
          return hours.filter((hour) => hour < startHour || hour >= endHour);
        },
        disabledMinutes: (selectedHour) => {
          if (selectedDate.isSame(now, "day") && selectedHour === now.hour()) {
            // Nếu giờ được chọn là giờ hiện tại, loại bỏ phút đã qua
            return range(0, now.minute() + 10);
          }
          return [];
        },
      };
    }

    if (type === "end") {
      return {
        disabledHours: () => {
          if (!start) return []; // Nếu chưa chọn giờ bắt đầu, không vô hiệu hóa gì

          const startHour = start?.hour() ?? 0; // Lấy giờ bắt đầu hoặc mặc định là 0
          const maxHour = Math.min(startHour + 3, 23); // Giới hạn tối đa 3 giờ hoặc 23:00

          // Loại bỏ giờ nhỏ hơn giờ bắt đầu hoặc vượt quá giờ tối đa
          return range(0, 24).filter(
            (hour) => hour < startHour || hour > maxHour
          );
        },
        disabledMinutes: (selectedHour) => {
          if (!start) return []; // Nếu chưa chọn giờ bắt đầu, không vô hiệu hóa gì

          const startHour = start?.hour() ?? 0; // Lấy giờ bắt đầu hoặc mặc định là 0
          const startMinute = start?.minute() ?? 0; // Lấy phút bắt đầu hoặc mặc định là 0

          // Nếu giờ kết thúc bằng giờ bắt đầu, loại bỏ phút nhỏ hơn hoặc bằng phút bắt đầu
          if (selectedHour === startHour) {
            return range(0, startMinute + 1);
          }

          return []; // Không loại bỏ phút trong các giờ khác
        },
      };
    }

    return {};
  };

  const modalContent = (
    <Form layout="vertical">
      <Form.Item
        label="Điền nội dung họp"
        name="meetingContent"
        rules={[{ required: true, message: "Vui lòng nhập nội dung họp" }]}
      >
        <Input placeholder="VD: Outcome 1" style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Chọn ngày bắt đầu họp"
        name="meetingDate"
        rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu họp" }]}
      >
        <DatePicker
          placeholder="Chọn ngày"
          style={{ width: "100%" }}
          disabledDate={disabledDate}
          onChange={(value) => setSelectedDate(value)} // Lưu ngày đã chọn
        />
      </Form.Item>

      <Form.Item
        label="Chọn giờ bắt đầu và kết thúc"
        name="meetingTime"
        rules={[{ required: true, message: "Vui lòng chọn thời gian họp" }]}
      >
        <Tooltip
          title={!selectedDate ? "Hãy chọn ngày trước khi chọn giờ" : ""}
          placement="top"
        >
          <RangePicker
            picker="time"
            placeholder={["Bắt đầu từ", "Kết thúc từ"]}
            disabledDate={disabledDate}
            disabledTime={(date, type) =>
              selectedDate
                ? disabledRangeTime(rangeStart, null)(selectedDate, type)
                : {}
            }
            onChange={(values) => {
              if (values) {
                setRangeStart(values[0]); // Lưu giá trị bắt đầu
              }
            }}
            showTime={{
              hideDisabledOptions: true, // Ẩn các giá trị không hợp lệ
              format: "HH:mm",
            }}
            format="HH:mm"
            disabled={!selectedDate} // Vô hiệu hóa nếu chưa chọn ngày
          />
        </Tooltip>
      </Form.Item>
    </Form>
  );

  const modalFooter = (
    <Row>
      <Col span={24}>
        <ConfirmButton content="Thêm vào" disabled={true} />
        <CancelButton content="Hủy" />
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

export default CreateMeetingDay;
