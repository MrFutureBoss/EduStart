import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "../../style/Calendar/CustomCalendar.css";
import { Button, message, Tag, Tooltip } from "antd";

// Đặt ngôn ngữ là tiếng Việt cho Moment
import "moment/locale/vi";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../../utilities/initalValue";
import { setMatchedGroups } from "../../redux/slice/MatchedGroupSlice";
import axios from "axios";
import { InfoCircleOutlined } from "@ant-design/icons";
moment.locale("vi");

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Thiết lập các khung thời gian theo slot
const minTime = new Date();
minTime.setHours(7, 0, 0);

const maxTime = new Date();
maxTime.setHours(23, 0, 0);

// Component tiêu đề tùy chỉnh cho ngày
const CustomDateHeader = ({ label, date }) => {
  const dayOfWeek = moment(date).format("dddd");
  const day = moment(date).format("DD");
  const month = moment(date).format("MM");
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
  const dispatch = useDispatch();
  const [events, setEvents] = useState([]);
  const [isDragAndDropEnabled, setIsDragAndDropEnabled] = useState(false);
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("email");
  const [loading, setLoading] = useState(false);
  const groups = useSelector((state) => state.matchedGroup.data || []);
  const groupColors = {};

  const getRandomColor = () => {
    const colors = ["#1890FF", "#B0B0B0", "#FFE4C4"]; // Blue (primary), Grey, Bisque
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const assignGroupColor = (groupName) => {
    if (!groupColors[groupName]) {
      groupColors[groupName] = getRandomColor();
    }
    return groupColors[groupName];
  };

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

        const mappedEvents = groupResponse.data.groups.flatMap((group) =>
          group.matchedDetails.time.map((meet) => ({
            id: meet._id,
            group: `${group.class.className} - ${group.group.name}`,
            title: `${meet.title}`,
            start: new Date(meet.start),
            end: new Date(meet.end),
            color: assignGroupColor(group.group.name),
            tooltip: `Nội dung cuộc họp: ${meet.title}`,
          }))
        );

        setEvents(mappedEvents);
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

  const myGroups = useMemo(
    () => groups.filter((group) => group.matchedDetails.status === "Accepted"),
    [groups]
  );
  const handleEventDrop = ({ event, start, end }) => {
    const now = new Date();
    now.setSeconds(0, 0);

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

  const handleEventResize = ({ event, start, end }) => {
    const now = new Date();
    now.setSeconds(0, 0);

    if (start >= now) {
      const updatedEvents = events.map((existingEvent) => {
        return existingEvent.id === event.id
          ? { ...existingEvent, start, end }
          : existingEvent;
      });
      setEvents(updatedEvents);
    } else {
      message.warning(
        "Bạn không thể thay đổi kích thước sự kiện vào thời gian đã qua!"
      );
    }
  };

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return `${text.slice(0, maxLength)}...`;
    }
    return text;
  };

  const CustomEvent = ({ event }) => {
    const isPastEvent = new Date() > new Date(event.start);
    const openMeet = () => {
      window.open(
        `https://meet.google.com/new?email=${encodeURIComponent(email)}`,
        "_blank"
      );
    };
    const isCurrentEvent =
      new Date() >= new Date(event.start) && new Date() <= new Date(event.end);

      console.log({
        eventStart: new Date(event.start),
        eventEnd: new Date(event.end),
        now: new Date(),
        isPastEvent,
        isCurrentEvent,
      });

    return (
      <Tooltip
        title={
          <div>
            <p className="remove-default-style-p">{event.tooltip}</p>
          </div>
        }
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            flexDirection: "column",
            display: "flex",
            alignItems: "start",
            justifyContent: "center",
            fontWeight: "600",
            padding: "10px 8px",
            backgroundColor: isPastEvent
              ? "grey"
              : isCurrentEvent
              ? "#C7E6C1" // Màu khác cho sự kiện đang diễn ra
              : "#e4e0c2",
          }}
        >
          <span style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
            {event.group}
          </span>
          <span
            style={{ fontSize: "0.7rem", fontWeight: "400", marginTop: "3px" }}
          >
            {truncateText(event.title, 22)}
          </span>
          <div
            style={{
              marginTop: "5px",
              display: "flex",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <Tag
              color={isPastEvent ? "#a5a6a8" : "#008000"}
              style={{
                fontSize: "0.6rem",
                fontWeight: "600",
                color: "#FFF",
                borderRadius: "4px",
                margin: "0px",
                padding: "0px 5px",
              }}
            >
              {moment(event.start).format("HH:mm")} -{" "}
              {moment(event.end).format("HH:mm")}
            </Tag>
            <Tag
              color={isPastEvent ? "#a5a6a8" : "#EC9A26"}
              style={{
                cursor: "pointer",
                fontSize: "0.7rem",
                margin: "0px",
                padding: "0px 5px",
              }}
              onClick={() => openMeet()}
            >
              MeetUrl
            </Tag>
          </div>
        </div>
      </Tooltip>
    );
  };

  return (
    <div style={{ maxHeight: "600px", overflowY: "auto", padding: "20px" }}>
      <h4>Lịch họp các nhóm</h4>
      <Button
        type="primary"
        onClick={() => setIsDragAndDropEnabled(!isDragAndDropEnabled)}
        style={{ marginBottom: "20px", display: "none" }}
      >
        {isDragAndDropEnabled ? "Bật chế độ kéo thả" : "Tắt chế độ kéo thả"}
      </Button>
      <div style={{ height: "700px" }}>
        {isDragAndDropEnabled ? (
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
                  return `Tháng ${moment(start).format("MM")} - Tháng ${moment(
                    end
                  ).format("MM")} năm ${moment(start).format("YYYY")}`;
                }
              },
              monthHeaderFormat: (date, culture, localizer) => {
                return `Tháng ${moment(date).format("MM")} năm ${moment(
                  date
                ).format("YYYY")}`;
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
              noEventsInRange:
                "Không có sự kiện nào trong khoảng thời gian này.",
              showMore: (total) => `+ Xem thêm (${total})`,
            }}
          />
        ) : (
          <Calendar
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
                  return `Tháng ${moment(start).format("MM")} - Tháng ${moment(
                    end
                  ).format("MM")} năm ${moment(start).format("YYYY")}`;
                }
              },
              monthHeaderFormat: (date, culture, localizer) => {
                return `Tháng ${moment(date).format("MM")} năm ${moment(
                  date
                ).format("YYYY")}`;
              },
            }}
            step={10}
            timeslots={6} // Chia thành các slot theo giờ
            min={minTime} // Thời gian bắt đầu
            max={maxTime} // Thời gian kết thúc
            defaultDate={new Date(2024, 10, 20)}
            components={{
              event: CustomEvent,
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
              noEventsInRange:
                "Không có sự kiện nào trong khoảng thời gian này.",
              showMore: (total) => `+ Xem thêm (${total})`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CustomCalendar;
