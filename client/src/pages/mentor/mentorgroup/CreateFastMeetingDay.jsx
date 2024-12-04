import React, { useEffect, useMemo, useState } from "react";
import SmallModal from "../../../components/Modal/SmallModal";
import { Button, Col, Popconfirm, Row, Select, message, Input } from "antd";
import ConfirmButton from "../../../components/Button/ConfirmButton";
import CancelButton from "../../../components/Button/CancelButton";
import { setLoading } from "../../../redux/slice/ClassManagementSlice";
import { BASE_URL } from "../../../utilities/initalValue";
import { setMatchedGroups } from "../../../redux/slice/MatchedGroupSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import moment from "moment";

const { Option } = Select;

const CreateFastMeetingDay = ({ open, close, content, selectedSlotInfo }) => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const dispatch = useDispatch();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [meetingContent, setMeetingContent] = useState("");

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

  const handleSelectChange = (value) => {
    setSelectedGroupId(value);
  };

  const handleContentChange = (e) => {
    setMeetingContent(e.target.value);
  };

  const handleMakeNewEvent = async () => {
    if (!selectedGroupId) {
      message.error("Vui lòng chọn một nhóm để tạo cuộc họp.");
      return;
    }
    if (!meetingContent) {
      message.error("Vui lòng nhập nội dung cuộc họp.");
      return;
    }

    try {
      const start = moment(selectedSlotInfo.start).toISOString();
      const end = moment(selectedSlotInfo.start)
        .add(150, "minutes")
        .toISOString();

      const newEvent = {
        title: meetingContent,
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
        message.success("Cuộc họp đã được tạo thành công!");
        close();
      } else {
        console.error("Error response:", response);
        message.error("Có lỗi xảy ra khi tạo cuộc họp. Vui lòng thử lại.");
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
    <Row>
      <Col span={24}>
        <div style={{ marginBottom: "1rem", width: "fit-content" }}>
          <strong>Chọn nhóm: </strong>
          <Select
            value={selectedGroupId}
            style={{ width: "12rem" }}
            onChange={handleSelectChange}
            placeholder="Vui lòng chọn nhóm"
          >
            {groups
              .filter((group) => group?.matchedDetails.status === "Accepted")
              .map((group) => (
                <Option
                  key={group.matchedDetails._id}
                  value={group.matchedDetails._id}
                >
                  {`${group.class.className} - ${group.group.name}`}
                </Option>
              ))}
          </Select>
        </div>
        <div style={{ marginBottom: "1rem", width: "fit-content" }}>
          <strong>Nội dung cuộc họp: </strong>
          <Input
            value={meetingContent}
            onChange={handleContentChange}
            placeholder="VD: Cuộc họp dự án"
            style={{ width: "15rem" }}
          />
        </div>
        <div style={{ width: "fit-content", marginTop: "1rem" }}>
          {selectedSlotInfo && (
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
          )}
        </div>
      </Col>
    </Row>
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
          <ConfirmButton content="Thêm vào" />
        </Popconfirm>
        <CancelButton content="Hủy" onClick={close} />
      </Col>
    </Row>
  );

  return (
    <SmallModal
      title="Thêm cuộc họp nhanh"
      content={modalContent}
      footer={modalFooter}
      closeable={true}
      isModalOpen={open}
      handleCancel={close}
    />
  );
};

export default CreateFastMeetingDay;
