import React, { useEffect, useMemo, useState } from "react";
import SmallModal from "../../../components/Modal/SmallModal";
import { Badge, Col, message, Popconfirm, Row } from "antd";
import ConfirmButton from "../../../components/Button/ConfirmButton";
import CancelButton from "../../../components/Button/CancelButton";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../../../utilities/initalValue";
import { setMatchedGroups } from "../../../redux/slice/MatchedGroupSlice";
import axios from "axios";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";
import EditMeetingDay from "./EditMeetingDay";

const MeetingTimeDetail = ({ open, close, eventId, eventGroup }) => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State để quản lý EditMeetingDay modal
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

  const selectedEvent = useMemo(() => {
    for (let group of groups) {
      const event = group.matchedDetails.time.find(
        (meet) => meet._id === eventId
      );
      if (event) {
        return event;
      }
    }
    return null;
  }, [groups, eventId]);

  const handleDeleteEvent = async () => {
    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/matched/time/${eventId}`, config);

      const updatedGroups = groups.map((group) => {
        if (group.matchedDetails.time.some((meet) => meet._id === eventId)) {
          return {
            ...group,
            matchedDetails: {
              ...group.matchedDetails,
              time: group.matchedDetails.time.filter(
                (meet) => meet._id !== eventId
              ),
            },
          };
        }
        return group;
      });

      dispatch(setMatchedGroups(updatedGroups));
      message.success("Đã xóa cuộc họp thành công");
      close(); // Đóng modal sau khi xóa thành công
    } catch (error) {
      console.error(
        error.response ? error.response.data.message : error.message
      );
      message.error("Có lỗi xảy ra khi xóa cuộc họp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const isPastEvent = selectedEvent
    ? new Date() > new Date(selectedEvent.end)
    : false;

  const modalContent = (() => {
    let selectedEvent = null;
    let eventIndex = null;
    let matchedGroup = null;

    for (let group of groups) {
      const { time } = group.matchedDetails;

      eventIndex = time.findIndex((meet) => meet._id === eventId);

      if (eventIndex !== -1) {
        const sortedTimes = [...time].sort(
          (a, b) => new Date(a.start) - new Date(b.start)
        );
        selectedEvent = sortedTimes.find((meet) => meet._id === eventId);
        eventIndex = sortedTimes.findIndex((meet) => meet._id === eventId) + 1;

        matchedGroup = group;
        break;
      }
    }

    if (!selectedEvent) {
      return (
        <Row
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Col xs={24} style={{ textAlign: "center" }}>
            <p>Không tìm thấy thông tin chi tiết cuộc họp</p>
          </Col>
        </Row>
      );
    }

    return (
      <Row
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Col
          xs={24}
          md={20}
          lg={16}
          style={{
            textAlign: "left", // Căn chữ về lề trái
            lineHeight: "1.6", // Tăng khoảng cách giữa các dòng
          }}
        >
          <p>
            <strong>Lớp và nhóm:</strong> {eventGroup}
          </p>
          <p>
            <strong>Buổi {eventIndex}:</strong>{" "}
            {format(new Date(selectedEvent.start), "EEEE, dd'-'MM'-'yyyy", {
              locale: vi,
            })}
          </p>
          <p>
            <strong>Thời gian:</strong>{" "}
            {format(new Date(selectedEvent.start), "HH:mm", { locale: vi })} -{" "}
            {format(new Date(selectedEvent.end), "HH:mm", { locale: vi })}
          </p>
          <p>
            <strong>Tiêu đề lịch họp:</strong> {selectedEvent.title}
          </p>
          <p>
            <strong>Tình trạng:&nbsp;</strong>{" "}
            <Badge
              status={
                new Date() < new Date(selectedEvent.start)
                  ? "success"
                  : new Date() > new Date(selectedEvent.end)
                  ? "default"
                  : "processing"
              }
              text={
                new Date() < new Date(selectedEvent.start)
                  ? "Sắp diễn ra"
                  : new Date() > new Date(selectedEvent.end)
                  ? "Đã diễn ra"
                  : "Đang diễn ra"
              }
            />
          </p>
        </Col>
      </Row>
    );
  })();

  const modalFooter = (
    <Row>
      <Col
        span={24}
        style={{ display: "flex", gap: "10px", justifyContent: "end" }}
      >
        <ConfirmButton
          content="Chỉnh sửa"
          disabled={isPastEvent}
          onClick={openEditModal}
        />
        <Popconfirm
          title="Bạn có chắc chắn muốn hủy bỏ cuộc họp này không?"
          onConfirm={handleDeleteEvent}
          okText="Đồng ý"
          cancelText="Hủy"
          disabled={isPastEvent}
        >
          <CancelButton content="Bỏ cuộc họp" disabled={isPastEvent} />
        </Popconfirm>
        <CancelButton content="Hủy" onClick={close} />
      </Col>
    </Row>
  );

  return (
    <>
      <SmallModal
        title="Chi tiết lịch họp"
        content={modalContent}
        footer={modalFooter}
        isModalOpen={open}
        closeable={true}
        handleCancel={close}
      />
      <EditMeetingDay
        open={isEditModalOpen}
        close={closeEditModal}
        eventId={eventId}
        selectedEvent={selectedEvent}
      />
    </>
  );
};

export default MeetingTimeDetail;
