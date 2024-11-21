import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "../../style/Calendar/CustomCalendar.css";
import { message } from "antd";

// Đặt ngôn ngữ là tiếng Việt cho Moment
import "moment/locale/vi";
moment.locale("vi");

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Dữ liệu mẫu cho sự kiện
const initialEvents = [
  {
    id: 0,
    title: "Cuộc họp nhóm 1",
    start: new Date(2024, 10, 20, 7, 30),
    end: new Date(2024, 10, 20, 9, 50),
  },
  {
    id: 1,
    title: "Buổi thảo luận dự án",
    start: new Date(2024, 10, 20, 10, 0),
    end: new Date(2024, 10, 20, 12, 20),
  },
  {
    id: 2,
    title: "Họp với khách hàng",
    start: new Date(2024, 10, 20, 15, 20),
    end: new Date(2024, 10, 20, 17, 40),
  },
];

// Thiết lập các khung thời gian theo slot
const minTime = new Date();
minTime.setHours(7, 30, 0);

const maxTime = new Date();
maxTime.setHours(21, 0, 0);

// Component tiêu đề tùy chỉnh cho ngày
const CustomDateHeader = ({ label, date }) => {
  const dayOfWeek = moment(date).format("dddd"); // Lấy ngày trong tuần (Thứ 2, Thứ 3,...)
  const day = moment(date).format("DD"); // Lấy ngày
  const month = moment(date).format("MM"); 
  // Hàm để viết hoa chữ cái đầu tiên
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ textTransform: "capitalize", fontWeight: "bold" }}>
        {capitalize(dayOfWeek)}
      </div>
      <div>{`${day}/${month}`}</div>
    </div>
  );
};

// Component Lịch Tùy Chỉnh
const CustomCalendar = () => {
  const [events, setEvents] = useState(initialEvents);

  // Hàm xử lý khi kéo thả sự kiện
  const handleEventDrop = ({ event, start, end }) => {
    const now = new Date();
    now.setSeconds(0, 0); // Loại bỏ mili giây để so sánh chính xác

    if (start >= now) {
      const updatedEvents = events.map((existingEvent) => {
        return existingEvent.id === event.id
          ? { ...existingEvent, start, end }
          : existingEvent;
      });
      setEvents(updatedEvents);
    } else {
      message.warning("Bạn không thể kéo sự kiện vào thời gian đã qua!");
    }
  };

  // Hàm xử lý khi resize sự kiện
  const handleEventResize = ({ event, start, end }) => {
    const now = new Date();
    now.setSeconds(0, 0); // Loại bỏ mili giây để so sánh chính xác

    if (start >= now) {
      const updatedEvents = events.map((existingEvent) => {
        return existingEvent.id === event.id
          ? { ...existingEvent, start, end }
          : existingEvent;
      });
      setEvents(updatedEvents);
    } else {
      message.warning("Bạn không thể thay đổi kích thước sự kiện vào thời gian đã qua!");
    }
  };

  return (
    <div style={{ height: "700px", padding: "20px" }}>
      <DragAndDropCalendar
        localizer={localizer}
        events={events}
        defaultView="week" // Hiển thị theo week
        views={{
          week: true,
          month: true,
        }}
        formats={{
          dayRangeHeaderFormat: ({ start, end }, culture, localizer) => {
            if (start.getMonth() === end.getMonth()) {
              return `Năm ${moment(start).format("YYYY")}`;
            } else {
              return `Tháng ${moment(start).format("MM")} - Tháng ${moment(end).format("MM")} năm ${moment(start).format("YYYY")}`;
            }
          },
          monthHeaderFormat: (date, culture, localizer) => {
            return `Tháng ${moment(date).format("MM")} năm ${moment(date).format("YYYY")}`;
          },
        }}
        step={10} // Hiển thị theo từng bước (10 phút)
        timeslots={6} // Chia thành các slot theo giờ
        resizable
        onEventDrop={handleEventDrop} // Xử lý sự kiện khi kéo thả
        onEventResize={handleEventResize} // Xử lý sự kiện khi resize
        min={minTime} // Thời gian bắt đầu
        max={maxTime} // Thời gian kết thúc
        defaultDate={new Date(2024, 10, 20)}
        components={{
          week: {
            header: CustomDateHeader,
          },
          day: {
            header: CustomDateHeader,
          },
        }}
        style={{
          height: "100%",
          backgroundColor: "#f0f2f5",
          borderRadius: "8px",
        }}
        messages={{
          next: "Tiếp theo",
          previous: "Trước",
          today: "Hôm nay",
          month: "Tháng",
          week: "Tuần",
          day: "Ngày",
          agenda: "Lịch trình",
          date: "Ngày",
          time: "Thời gian",
          event: "Sự kiện",
          noEventsInRange: "Không có sự kiện nào trong khoảng thời gian này.",
          showMore: (total) => `+ Xem thêm (${total})`,
        }}
      />
    </div>
  );
};

export default CustomCalendar;
