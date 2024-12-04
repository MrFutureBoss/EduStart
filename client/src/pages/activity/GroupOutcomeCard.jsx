import React, { useEffect, useState } from "react";
import {
  Card,
  List,
  Typography,
  Tag,
  message,
  Button,
  Upload,
  Modal,
} from "antd";
import {
  UploadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "../../utilities/initalValue";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";

const { Text } = Typography;

const GroupOutcomeCard = ({ groupId }) => {
  const [outcomes, setOutcomes] = useState([]);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const nowDate = moment();
  const { userLogin } = useSelector((state) => state.user);
  const role = userLogin?.role;
  const isLeader = userLogin?.isLeader;

  const jwt = localStorage.getItem("jwt");
  const config = {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  };

  useEffect(() => {
    const fetchOutcomes = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/activity/group-outcomes/${groupId}`,
          config
        );

        const outcomesWithNames = await Promise.all(
          response.data.map(async (outcome) => {
            try {
              const outcomeTypeResponse = await axios.get(
                `${BASE_URL}/activity/outcome-type/${outcome.outcomeId}`,
                config
              );
              return { ...outcome, name: outcomeTypeResponse.data.name };
            } catch (error) {
              console.error(
                `Error fetching name for outcome ID ${outcome.outcomeId}`,
                error
              );
              return { ...outcome, name: "Unknown Outcome" };
            }
          })
        );

        setOutcomes(outcomesWithNames);
      } catch (error) {
        console.error("Error fetching outcomes:", error);
        message.error("Unable to load group outcomes.");
      }
    };

    if (groupId) {
      fetchOutcomes();
    }
  }, [groupId]);

  const handleSubmit = async () => {
    if (!selectedOutcome) {
      message.warning("Please select an outcome to submit.");
      return;
    }

    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("groupId", groupId);
    formData.append("classId", userLogin?.classId);
    formData.append("submitId", selectedOutcome._id);
    formData.append("leaderId", userLogin?._id);

    try {
      const response = await axios.post(
        `${BASE_URL}/submission`,
        formData,
        config
      );
      message.success("Submission successful!");

      setOutcomes((prev) =>
        prev.map((outcome) =>
          outcome._id === selectedOutcome._id
            ? {
                ...outcome,
                completed: true,
                files: response.data.submittedFiles,
              }
            : outcome
        )
      );

      setSubmittedFiles(response.data.submittedFiles || []);
      setFileList([]);
      setIsSubmitModalVisible(false);
    } catch (error) {
      console.error("Submission error:", error);
      message.error("Submission failed!");
    }
  };

  const openSubmitModal = (outcome) => {
    setSelectedOutcome(outcome);
    setSubmittedFiles(outcome.files || []);
    setIsSubmitModalVisible(true);
  };

  const openEditModal = async (outcome) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/submission/submitId/${outcome._id}`,
        config
      );
      const submissionData = response.data;

      setSelectedOutcome(outcome);
      setSubmittedFiles(submissionData.files || []);
      setIsEditModalVisible(true);
    } catch (error) {
      console.error("Error fetching submission details:", error);
      message.error("Không thể tải thông tin bài nộp.");
    }
  };
  const handleEditSubmit = async () => {
    try {
      const formData = new FormData();

      // Thêm file mới (nếu có)
      submittedFiles.forEach((file) => {
        if (file.originFileObj) {
          formData.append("files", file.originFileObj); // Tệp mới
        }
      });

      // Lọc danh sách file cũ và thêm vào FormData
      const existingFiles = submittedFiles
        .filter((file) => !file.originFileObj && file.url) // Lọc các file hợp lệ
        .map((file) => file.url); // Lấy URL của các file cũ hợp lệ

      if (existingFiles.length > 0) {
        formData.append("existingFiles", JSON.stringify(existingFiles));
      } else {
        formData.append("existingFiles", JSON.stringify([])); // Gửi mảng trống nếu không có file cũ
      }

      // Thêm thông tin khác
      formData.append("description", "Updated submission description");

      console.log("FormData Content:", Array.from(formData.entries())); // Debug FormData

      const response = await axios.patch(
        `${BASE_URL}/submission/${selectedOutcome._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      message.success("Cập nhật bài nộp thành công!");
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Error updating submission:", error);
      message.error("Đã xảy ra lỗi khi cập nhật bài nộp.");
    }
  };

  const removeFile = (fileIndex) => {
    if (submittedFiles.length <= 1) {
      message.warning("Phải có ít nhất một tệp.");
      return;
    }
    setSubmittedFiles((prev) => prev.filter((_, index) => index !== fileIndex));
  };

  const filteredOutcomes = outcomes.filter((outcome) => {
    if (!outcome.startDate || !outcome.deadline) return false;
    const startDate = moment(outcome.startDate);
    const deadline = moment(outcome.deadline);
    return nowDate.isSameOrAfter(startDate) && nowDate.isSameOrBefore(deadline);
  });

  const nextOutcome = outcomes.find((outcome) => {
    const startDate = moment(outcome.startDate);
    return startDate.isAfter(nowDate);
  });
  const daysUntilNextOutcome = nextOutcome
    ? moment(nextOutcome.startDate).diff(nowDate, "days")
    : null;
  const isNextOutcomeComingSoon =
    nextOutcome &&
    moment(nextOutcome.startDate).diff(nowDate, "days") <= 3 &&
    moment(nextOutcome.startDate).diff(nowDate, "days") > 0;
  return (
    <Card
      title={
        <span style={{ fontSize: "20px", fontWeight: "bold" }}>
          Tiến độ outcome
        </span>
      }
      className="group-outcomes-card"
      hoverable
      style={{ marginTop: "20px", marginBottom: "20px" }}
      extra={
        role === 4 &&
        isLeader &&
        (filteredOutcomes.some((outcome) => !outcome.completed) ? (
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() =>
              openSubmitModal(outcomes.find((outcome) => !outcome.completed))
            }
          >
            Nộp Outcome
          </Button>
        ) : (
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => {
              if (filteredOutcomes.length > 0) {
                openEditModal(filteredOutcomes[0]);
              } else {
                message.warning("Không có Outcome hiện tại để chỉnh sửa.");
              }
            }}
          >
            Sửa bài nộp
          </Button>
        ))
      }
    >
      <List
        dataSource={filteredOutcomes}
        renderItem={(outcome) => (
          <List.Item key={outcome._id} style={{ padding: "10px" }}>
            <List.Item.Meta
              title={<Text strong>Loại: {outcome.name}</Text>}
              description={
                <div>
                  <p>
                    <Text strong>Deadline: </Text>
                    <Tag
                      color={
                        moment(outcome.deadline).isBefore(moment())
                          ? "red"
                          : "green"
                      }
                    >
                      {moment(outcome.deadline).format("DD/MM/YYYY")}
                    </Tag>
                  </p>
                  <p>
                    <Text strong>Trạng thái: </Text>
                    <Tag color={outcome.completed ? "green" : "orange"}>
                      {outcome.completed ? "Hoàn thành" : "Chưa hoàn thành"}
                    </Tag>
                  </p>
                  {isNextOutcomeComingSoon && (
                    <p>
                      <ExclamationCircleOutlined
                        style={{ color: "#faad14", marginRight: "8px" }}
                      />
                      <Text type="warning">
                        Sắp tới thời gian {nextOutcome.name}, còn{" "}
                        {daysUntilNextOutcome} ngày.
                      </Text>
                    </p>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />

      {/* Submit Modal */}
      <Modal
        visible={isSubmitModalVisible}
        title="Nộp Outcome"
        onCancel={() => setIsSubmitModalVisible(false)}
        onOk={handleSubmit}
      >
        <p>
          <Text strong>Outcome: </Text>
          {selectedOutcome?.name}
        </p>
        <p style={{ marginTop: "20px" }}>
          <Text strong>Tệp mới:</Text>
        </p>
        <Upload
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList([file]);
            return false;
          }}
          onRemove={() => setFileList([])}
        >
          <Button icon={<UploadOutlined />}>Tải tệp lên</Button>
        </Upload>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        title={<h5>Chỉnh sửa bài nộp</h5>}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleEditSubmit} // Nút xác nhận sửa bài nộp
      >
        <p>
          <Text strong>Loại: </Text>
          {selectedOutcome?.name}
        </p>
        <p>
          <Text strong>Tệp đã nộp: </Text>
        </p>
        <List
          dataSource={submittedFiles}
          renderItem={(file, index) => (
            <List.Item
              key={index}
              actions={[
                <Button type="link" danger onClick={() => removeFile(index)}>
                  Xóa
                </Button>,
              ]}
            >
              <a href={`${BASE_URL}${file}`} target="_blank" rel="noreferrer">
                {file.name || file.split("/").pop()}
              </a>
            </List.Item>
          )}
        />
        <p style={{ marginTop: "20px" }}>
          <Text strong>Thêm tệp mới:</Text>
        </p>
        <Upload
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList((prev) => [...prev, file]);
            return false;
          }}
          onRemove={(file) => {
            setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
          }}
        >
          <Button icon={<UploadOutlined />}>Tải tệp lên</Button>
        </Upload>
      </Modal>
    </Card>
  );
};

export default GroupOutcomeCard;
