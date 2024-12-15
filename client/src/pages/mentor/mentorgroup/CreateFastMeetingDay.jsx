import React, { useEffect, useMemo, useState } from "react";
import SmallModal from "../../../components/Modal/SmallModal";
import {
  Button,
  Col,
  Popconfirm,
  Row,
  Select,
  message,
  Input,
  TimePicker,
  Collapse,
} from "antd";
import ConfirmButton from "../../../components/Button/ConfirmButton";
import CancelButton from "../../../components/Button/CancelButton";
import { setLoading } from "../../../redux/slice/ClassManagementSlice";
import { BASE_URL } from "../../../utilities/initalValue";
import { setMatchedGroups } from "../../../redux/slice/MatchedGroupSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import moment from "moment";
import runes from "runes2";
import { CaretRightOutlined } from "@ant-design/icons";
const { Panel } = Collapse;

const { Option } = Select;

const CreateFastMeetingDay = ({ open, close, content, selectedSlotInfo }) => {
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const dispatch = useDispatch();
  const [selectedClass, setSelectedClass] = useState(null); // Chọn lớp
  const [selectedGroupId, setSelectedGroupId] = useState(null); // Chọn nhóm
  const [meetingContent, setMeetingContent] = useState("");
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [customStartTime, setCustomStartTime] = useState(null);
  const [isValidTime, setIsValidTime] = useState(true);

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

  useEffect(() => {
    if (selectedSlotInfo?.start) {
      setCustomStartTime(moment(selectedSlotInfo.start));
    } else {
      setCustomStartTime(null); // Reset giá trị khi không có dữ liệu
    }
  }, [selectedSlotInfo]);

  const handleClassChange = (value) => {
    setSelectedClass(value);
    setSelectedGroupId(null);
    if (!value) {
      message.warning("Vui lòng chọn lớp trước khi chọn nhóm.");
    }
  };

  const handleGroupChange = (value) => {
    setSelectedGroupId(value);
    if (!value) {
      message.warning("Vui lòng chọn nhóm để tiếp tục.");
    }
  };

  const handleContentChange = (e) => {
    const content = e.target.value;
    if (runes(content).length > 200) {
      message.warning("Nội dung họp không được vượt quá 200 ký tự.");
    }
    setMeetingContent(content);
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
    if (runes(meetingContent).length > 200) {
      message.error("Nội dung họp không được vượt quá 200 ký tự.");
      return;
    }
    if (!customStartTime) {
      message.error("Vui lòng chọn thời gian hợp lệ.");
      return;
    }
    const now = moment();
    if (customStartTime.isBefore(now)) {
      message.error("Không thể chọn thời gian trong quá khứ.");
      return;
    }

    try {
      const start = customStartTime.toISOString();
      const end = customStartTime.add(150, "minutes").toISOString();

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

  const toggleEditStartTime = () => {
    setIsEditingStartTime((prev) => !prev);
  };

  const handleStartTimeChange = (time) => {
    if (!time) {
      message.error("Vui lòng chọn thời gian hợp lệ.");
      setIsValidTime(false);
      return;
    }

    const selectedDay = moment(selectedSlotInfo.start); // Ngày từ `selectedSlotInfo`
    const now = moment(); // Thời gian hiện tại

    if (selectedDay.isSame(now, "day") && time.isBefore(now)) {
      message.error("Không thể chọn thời gian trong quá khứ."); // Giờ quá khứ
      setIsValidTime(false);
      return;
    }

    if (time.hour() < 7 || time.hour() > 20) {
      message.warning("Giờ họp phải nằm trong khoảng từ 7h đến 20h.");
      setIsValidTime(false);
      return;
    }

    setCustomStartTime(time); // Nếu hợp lệ, cập nhật thời gian
    setIsValidTime(true);
  };

  const disabledHours = () => {
    const minHour = 7;
    const maxHour = 20;
    const hours = [];
    for (let i = 0; i < 24; i++) {
      if (i < minHour || i > maxHour) {
        hours.push(i);
      }
    }
    return hours;
  };

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

  const resetData = () => {
    setSelectedClass(null);
    setSelectedGroupId(null);
    setMeetingContent("");
    setCustomStartTime(null);
    setIsEditingStartTime(false);
    setIsValidTime(true);
  };

  const modalContent = (
    <Row
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
      }}
    >
      <Col
        span={24}
        style={{
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <div>
          <div style={{ marginBottom: "1rem", width: "fit-content" }}>
            <strong>Chọn lớp và nhóm: </strong>
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
          </div>
          <div style={{ marginBottom: "1rem", width: "fit-content" }}>
            <strong>Nội dung cuộc họp: </strong>
            <Input
              value={meetingContent}
              onChange={handleContentChange}
              placeholder="VD: Cuộc họp dự án"
              style={{ width: "15rem" }}
              count={{
                show: true,
                max: 200,
                strategy: (txt) => runes(txt).length,
                exceedFormatter: (txt, { max }) =>
                  runes(txt).slice(0, max).join(""),
              }}
              minLength={2}
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
                  {!isEditingStartTime ? (
                    <span>
                      {customStartTime
                        ? moment(customStartTime).format("HH:mm")
                        : moment(selectedSlotInfo.start).format("HH:mm")}
                      <Button
                        onClick={toggleEditStartTime}
                        type="link"
                        style={{ padding: 0, marginLeft: 8 }}
                      >
                        Chỉnh sửa
                      </Button>
                    </span>
                  ) : (
                    <span>
                      <TimePicker
                        value={
                          customStartTime || moment(selectedSlotInfo.start)
                        }
                        onChange={handleStartTimeChange}
                        format="HH:mm"
                        style={{ width: "8rem" }}
                        placeholder="Chọn giờ"
                        disabledHours={disabledHours}
                      />
                      <Button
                        onClick={() => {
                          setCustomStartTime(moment(selectedSlotInfo.start));
                          setIsEditingStartTime(false);
                        }}
                        type="link"
                        style={{
                          marginLeft: 8,
                        }}
                      >
                        Quay lại
                      </Button>
                    </span>
                  )}
                </p>
                {isEditingStartTime && (
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
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            margin: 0,
                          }}
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
                        (*) Lưu ý bạn không thể nhập hoặc chọn giờ đã qua nếu
                        chọn ngày hôm nay
                      </small>
                    </Panel>
                  </Collapse>
                )}
                <p>
                  <strong>Giờ Kết Thúc:</strong>{" "}
                  <span>
                    {customStartTime
                      ? moment(customStartTime)
                          .add(2.5, "hours")
                          .format("HH:mm")
                      : moment(selectedSlotInfo.start)
                          .add(2.5, "hours")
                          .format("HH:mm")}
                  </span>
                </p>
              </div>
            )}
          </div>
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
          disabled={!isValidTime}
        >
          <ConfirmButton
            content="Thêm vào"
            disabled={
              !isValidTime ||
              !selectedGroupId ||
              !meetingContent ||
              runes(meetingContent).length > 200
            }
          />
        </Popconfirm>
        <CancelButton
          content="Hủy"
          onClick={() => {
            resetData();
            close();
          }}
        />
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
      handleCancel={() => {
        resetData();
        close();
      }}
    />
  );
};

export default CreateFastMeetingDay;
