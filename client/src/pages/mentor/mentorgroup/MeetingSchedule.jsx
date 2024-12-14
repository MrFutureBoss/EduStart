import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "../../../style/Calendar/CustomCalendar.css";
import { Button, message, Modal, Tag, Tooltip } from "antd";

// Đặt ngôn ngữ là tiếng Việt cho Moment
import "moment/locale/vi";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../../../utilities/initalValue";
import { setMatchedGroups } from "../../../redux/slice/MatchedGroupSlice";
import axios from "axios";
import MeetingTimeDetail from "./MeetingTimeDetail";
import CreateFastMeetingDay from "./CreateFastMeetingDay";
import { StarFilled } from "@ant-design/icons";
moment.locale("vi");

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Thiết lập các khung thời gian theo slot
const minTime = new Date();
minTime.setHours(7, 0, 0);

const maxTime = new Date();
maxTime.setHours(23, 59, 0);

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
const CustomCalendar = ({ selectedEvent }) => {
  const dispatch = useDispatch();
  const [events, setEvents] = useState([]);
  const [isDragAndDropEnabled, setIsDragAndDropEnabled] = useState(false);
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("email");
  const [loading, setLoading] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [eventGroup, setEventGroup] = useState("");
  const groups = useSelector((state) => state.matchedGroup.data || []);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);
  const [selectedRange, setSelectedRange] = useState({
    start: null,
    end: null,
  });
  const [currentView, setCurrentView] = useState("week");

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  const selectedEventIds = useMemo(
    () => selectedEvent?.time?.map((event) => event._id) || [],
    [selectedEvent]
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

  useEffect(() => {
    if (groups.length > 0) {
      const mappedEvents = groups.flatMap((group) =>
        group.matchedDetails.time.map((meet) => ({
          id: meet._id,
          group: `${group.class.className} - ${group.group.name}`,
          title: `${meet.title}`,
          start: new Date(meet.start),
          end: new Date(meet.end),
          // color: assignGroupColor(group.group.name),
          tooltip: `Nội dung cuộc họp: ${meet.title}`,
        }))
      );

      setEvents(mappedEvents);
    }
  }, [groups]);

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

  const HandleOpenSchedule = (id, group) => {
    setEventId(id);
    setEventGroup(group);
    setIsScheduleOpen(true);
  };

  const HandleCloseSchedule = () => {
    setIsScheduleOpen(false);
    setEventId("");
    setEventGroup("");
    setSelectedRange({
      start: null,
      end: null,
    });
  };

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return `${text.slice(0, maxLength)}...`;
    }
    return text;
  };

  const CustomEvent = ({ event, view }) => {
    const isCurrentEvent =
      new Date() >= new Date(event.start) && new Date() <= new Date(event.end);
    const isSelectedEvent = selectedEventIds.includes(event.id);
    const isPastEvent = new Date() > new Date(event.start);
    const openMeet = () => {
      window.open(
        `https://meet.google.com/new?email=${encodeURIComponent(email)}`,
        "_blank"
      );
    };
    if (view === "month") {
      return (
        <div
          style={{
            backgroundColor: isPastEvent
              ? "grey"
              : isSelectedEvent
              ? "#bdd8ee" // Nhóm bạn chọn
              : isCurrentEvent
              ? "#C7E6C1" // Nhóm khác bạn chọn
              : "#e4e0c2", // Cuộc họp đã qua
            cursor: "pointer",
          }}
        >
          <span>{event.group}</span>
        </div>
      );
    } else {
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
              justifyContent: "space-evenly",
              fontWeight: "600",
              padding: "0.55rem 0.5rem",
              backgroundColor: isPastEvent
                ? "grey"
                : isSelectedEvent
                ? "#bdd8ee" // Nhóm bạn chọn
                : isCurrentEvent
                ? "#C7E6C1" // Nhóm khác bạn chọn
                : "#e4e0c2", // Cuộc họp đã qua
              cursor: "pointer",
            }}
            onClick={() => HandleOpenSchedule(event.id, event.group)}
          >
            <div style={{ lineHeight: "1.2rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>
                {event.group}{" "}
                <StarFilled
                  style={{
                    fontSize: "1rem",
                    color: isPastEvent
                      ? "grey"
                      : isSelectedEvent
                      ? "#F6E601" // Nhóm bạn chọn
                      : isCurrentEvent
                      ? "#C7E6C1" // Nhóm khác bạn chọn
                      : "#e4e0c2",
                  }}
                />
              </span>
              <br />
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: "400",
                  marginTop: "3px",
                }}
              >
                {truncateText(event.title, 20)}
              </span>
            </div>
            <div
              style={{
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
                  color: isPastEvent ? "grey" : "#FFF",
                  borderRadius: "4px",
                  margin: "0px",
                  padding: "0px 0.2rem",
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
                  padding: "0px 0.2rem",
                  color: isPastEvent ? "grey" : "#FFF",
                }}
                onClick={() => openMeet()}
              >
                MeetUrl
              </Tag>
            </div>
          </div>
        </Tooltip>
      );
    }
  };

  const handleSlotClick = (slot) => {
    const now = new Date();

    if (slot.start < now) {
      message.warning("Không thể tạo lịch họp với thời gian đã qua");
      return;
    }

    // Kiểm tra nếu thời gian kết thúc vượt qua 23:59
    const selectedEndTime = moment(slot.start).add(150, "minutes");
    const endOfDay = moment(slot.start).endOf("day");
    if (selectedEndTime.isAfter(endOfDay)) {
      message.error(
        "Không thể tạo lịch họp kéo dài sang ngày hôm sau. Vui lòng chọn lại thời gian!"
      );
      return;
    }

    if (doesOverlapWithExistingEvents(slot)) {
      message.error(
        "Không thể thêm lịch họp này vì đã vướng thời gian trước hoặc sau"
      );
      return;
    }

    const startMoment = moment(slot.start);
    const endMoment = startMoment.clone().add(150, "minutes");
    setSelectedRange({
      start: startMoment.toDate(),
      end: endMoment.toDate(),
    });

    openModalWithSlotInfo(slot);
  };

  const slotPropGetter = (date) => {
    if (
      selectedRange.start &&
      selectedRange.end &&
      date >= selectedRange.start &&
      date < selectedRange.end
    ) {
      const isFirstSlot = date.getTime() === selectedRange.start.getTime();
      const isLastSlot =
        moment(date).add(10, "minutes").toDate().getTime() ===
        selectedRange.end.getTime();
      if (isFirstSlot) {
        // If it's the first slot in the selected range
        return {
          style: {
            backgroundColor: "rgba(0, 123, 255, 0.5)",
            border: "1px solid #007bff",
            borderBottom: "none", // Remove the bottom border
          },
        };
      } else if (isLastSlot) {
        return {
          style: {
            backgroundColor: "rgba(0, 123, 255, 0.5)",
            border: "1px solid #007bff",
            borderTop: "none",
          },
        };
      } else {
        return {
          style: {
            backgroundColor: "rgba(0, 123, 255, 0.5)",
            border: "1px solid #007bff",
            borderTop: "none",
            borderBottom: "none",
          },
        };
      }
    }
    return {};
  };

  const doesOverlapWithExistingEvents = (selectedSlot) => {
    const selectedStart = moment(selectedSlot.start);
    const selectedEnd = moment(selectedSlot.start).add(150, "minutes");

    for (const event of events) {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);

      if (
        selectedStart.isBetween(eventStart, eventEnd, null, "[)") ||
        selectedEnd.isBetween(eventStart, eventEnd, null, "[)")
      ) {
        return true;
      }
    }

    return false;
  };

  const openModalWithSlotInfo = (slot) => {
    setSelectedSlotInfo(slot);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedSlotInfo(null);
    setSelectedRange({
      start: null,
      end: null,
    });
  };

  const CustomToolbar = ({ label, onNavigate, onView, view }) => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#f0f2f5",
          borderRadius: "8px",
          marginBottom: "10px",
        }}
      >
        {/* Navigation Buttons */}
        <div className="rbc-btn-group" style={{ display: "flex" }}>
          <Tooltip title="Trước">
            <Button onClick={() => onNavigate("PREV")} type="default">
              {"<"} Trước
            </Button>
          </Tooltip>
          <Tooltip title="Hôm nay">
            <Button onClick={() => onNavigate("TODAY")} type="default">
              Hôm nay
            </Button>
          </Tooltip>
          <Tooltip title="Tiếp theo">
            <Button onClick={() => onNavigate("NEXT")} type="default">
              Sau {">"}
            </Button>
          </Tooltip>
        </div>

        {/* Current Date Label */}
        <div
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            color: "#333",
          }}
        >
          {label}
        </div>

        {/* View Switcher */}
        <div className="rbc-btn-group" style={{ display: "flex" }}>
          <Tooltip title="Chế độ tuần">
            <Button
              type={view === "week" ? "primary" : "default"}
              onClick={() => onView("week")}
            >
              Tuần
            </Button>
          </Tooltip>
          <Tooltip title="Chế độ tháng">
            <Button
              type={view === "month" ? "primary" : "default"}
              onClick={() => onView("month")}
            >
              Tháng
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <div>
      <CreateFastMeetingDay
        open={isModalVisible}
        close={closeModal}
        selectedSlotInfo={selectedSlotInfo}
        content={
          selectedSlotInfo && (
            <div>
              <p>
                <strong>Ngày:</strong>{" "}
                {moment(selectedSlotInfo.start).format("dddd, DD-MM-YYYY")}
              </p>
              <p>
                <strong>Giờ Bắt Đầu:</strong>{" "}
                {moment(selectedSlotInfo.start).format("HH:mm")}
              </p>
              <p>
                <strong>Giờ Kết Thúc:</strong>{" "}
                {moment(selectedSlotInfo.start)
                  .add(2.5, "hours")
                  .format("HH:mm")}
              </p>
            </div>
          )
        }
      />
      <MeetingTimeDetail
        open={isScheduleOpen}
        close={HandleCloseSchedule}
        eventId={eventId}
        eventGroup={eventGroup}
      />
      <Button
        type="primary"
        onClick={() => setIsDragAndDropEnabled(!isDragAndDropEnabled)}
        style={{ marginBottom: "20px", display: "none" }}
      >
        {isDragAndDropEnabled ? "Bật chế độ kéo thả" : "Tắt chế độ kéo thả"}
      </Button>
      <div style={{ height: "600px" }}>
        {isDragAndDropEnabled ? (
          <DragAndDropCalendar
            localizer={localizer}
            events={events}
            defaultView="week"
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
            defaultView="week"
            onView={(view) => setCurrentView(view)}
            views={{
              week: true,
              month: true,
            }}
            formats={{
              dayRangeHeaderFormat: ({ start, end }, culture, localizer) => {
                if (start.getMonth() === end.getMonth()) {
                  return `Năm ${moment(start).format("YYYY")}`;
                } else {
                  return `Năm ${moment(start).format("YYYY")}`;
                }
              },
              monthHeaderFormat: (date, culture, localizer) => {
                return `Tháng ${moment(date).format("MM")} năm ${moment(
                  date
                ).format("YYYY")}`;
              },
            }}
            step={10}
            timeslots={6}
            min={minTime}
            max={maxTime}
            resizable={false}
            selectable
            onSelectSlot={(slot) => handleSlotClick(slot)}
            slotPropGetter={slotPropGetter}
            components={{
              event: (props) => <CustomEvent {...props} view={currentView} />,
              week: {
                header: CustomDateHeader,
              },
              day: {
                header: CustomDateHeader,
              },
              toolbar: CustomToolbar,
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
