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
import { Link } from "react-router-dom";

const { Text } = Typography;

const GroupOutcomeCard = ({ groupId, active }) => {
  const [outcomes, setOutcomes] = useState([]);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [hasOpenedModal, setHasOpenedModal] = useState(false); // Thêm state này để kiểm soát việc mở modal

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
    if (active && !hasOpenedModal) {
      // Kiểm tra thêm hasOpenedModal
      const currentOutcome = outcomes.find((outcome) => {
        if (!outcome.startDate || !outcome.deadline) return false;
        const startDate = moment(outcome.startDate);
        const deadline = moment(outcome.deadline);
        return (
          nowDate.isSameOrAfter(startDate) &&
          nowDate.isSameOrBefore(deadline) &&
          !outcome.completed
        );
      });

      if (currentOutcome) {
        openSubmitModal(currentOutcome);
        setHasOpenedModal(true); // Đánh dấu đã mở modal để tránh mở lại nhiều lần
      }
    }
  }, [active, outcomes, hasOpenedModal, nowDate]);

  useEffect(() => {
    const fetchOutcomes = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/activity/group-outcomes/${groupId}`,
          config
        );

        const outcomesWithDetails = await Promise.all(
          response.data.map(async (outcome) => {
            try {
              const outcomeTypeResponse = await axios.get(
                `${BASE_URL}/activity/outcome-type/${outcome.outcomeId}`,
                config
              );

              const materialResponse = await axios.get(
                `${BASE_URL}/activity?classId=${outcome.classId}`,
                config
              );

              const materials = materialResponse.data.filter(
                (activity) =>
                  activity.activityType === "material" &&
                  activity.classId === outcome.classId
              );

              return {
                ...outcome,
                name: outcomeTypeResponse.data.name,
                materials,
              };
            } catch (error) {
              console.error(
                `Error fetching details for outcome ID ${outcome._id}:`,
                error
              );
              return { ...outcome, name: "Unknown Outcome", materials: [] };
            }
          })
        );

        setOutcomes(outcomesWithDetails);
      } catch (error) {
        console.error("Error fetching outcomes:", error);
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
  const handleDownload = async (materialUrl) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/submission/download/${materialUrl.split("/").pop()}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", materialUrl.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error("Error downloading the file.");
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

      setSelectedOutcome({
        ...outcome,
        submissionId: submissionData._id,
      });

      setSubmittedFiles(submissionData.files || []);
      setIsEditModalVisible(true);
    } catch (error) {
      console.error("Error fetching submission details:", error);
      message.error("Không thể tải thông tin bài nộp.");
    }
  };

  const handleEditSubmit = async () => {
    try {
      if (!selectedOutcome?.submissionId) {
        message.error("Không thể xác định bài nộp để cập nhật.");
        return;
      }

      const formData = new FormData();

      if (fileList.length > 0) {
        fileList.forEach((file) => {
          formData.append("files", file.originFileObj || file);
        });
      }

      formData.append("existingFiles", JSON.stringify(submittedFiles));

      formData.append("description", "Updated submission description");

      const response = await axios.patch(
        `${BASE_URL}/submission/${selectedOutcome.submissionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      message.success("Cập nhật bài nộp thành công!");

      setOutcomes((prev) =>
        prev.map((outcome) =>
          outcome._id === selectedOutcome._id
            ? { ...outcome, files: response.data.submission.files }
            : outcome
        )
      );

      setFileList([]);
      setSubmittedFiles(response.data.submission.files || []);
      setIsEditModalVisible(false);
    } catch (error) {
      console.error(
        "Error updating submission:",
        error.response || error.message
      );
      message.error(
        error.response?.data?.message || "Đã xảy ra lỗi khi cập nhật bài nộp."
      );
    }
  };

  const handleRemoveExistingFile = (fileIndex) => {
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
    <>
      {filteredOutcomes.length > 0 && (
        <Card
          title={
            <span style={{ fontSize: "16px", fontWeight: "700" }}>
              Outcome của nhóm
            </span>
          }
          className="group-outcomes-card"
          // hoverable
          style={{ marginBottom: "20px" }}
          extra={
            role === 4 &&
            isLeader &&
            filteredOutcomes.length > 0 &&
            (filteredOutcomes.some((outcome) => !outcome.completed) ? (
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() =>
                  openSubmitModal(
                    filteredOutcomes.find((outcome) => !outcome.completed)
                  )
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
                  description={
                    <div>
                      <p>
                        {" "}
                        <Text strong>Loại: {outcome.name}</Text>
                      </p>
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
                      {outcome.materials.length > 0 && (
                        <p>
                          <Text strong>Tài liệu: </Text>
                          {outcome.materials.map((material, index) => (
                            <Link
                              key={index}
                              style={{
                                marginRight: "8px",
                                textDecoration: "none",
                                color: "black",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                handleDownload(material.materialUrl);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#1890ff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "black";
                              }}
                            >
                              {material.materialUrl.split("/").pop()}
                            </Link>
                          ))}
                        </p>
                      )}
                      <p>
                        <Text strong>Trạng thái: </Text>
                        <Tag color={outcome.completed ? "green" : "orange"}>
                          {outcome.completed ? "Hoàn thành" : "Chưa hoàn thành"}
                        </Tag>
                      </p>
                      {isNextOutcomeComingSoon && (
                        <p>
                          <ExclamationCircleOutlined
                            style={{
                              color: "#faad14",
                              marginRight: "8px",
                            }}
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
          <Modal
            visible={isSubmitModalVisible}
            title={<h5>Nộp Outcome</h5>}
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
                setFileList((prev) => [...prev, file]);
                return false;
              }}
              onRemove={(file) => {
                setFileList((prev) =>
                  prev.filter((item) => item.uid !== file.uid)
                );
              }}
              multiple
            >
              <Button icon={<UploadOutlined />}>Tải tệp lên</Button>
            </Upload>
            <List
              dataSource={fileList}
              renderItem={(file, index) => (
                <List.Item key={index}>
                  <a>{file.name}</a>
                </List.Item>
              )}
            />
          </Modal>

          {/* Edit Modal */}
          <Modal
            visible={isEditModalVisible}
            title={<h5>Chỉnh sửa bài nộp</h5>}
            onCancel={() => setIsEditModalVisible(false)}
            onOk={handleEditSubmit}
          >
            <p>
              <Text strong>Loại Outcome: </Text>
              {selectedOutcome?.name}
            </p>
            <p>
              <Text strong>Tệp hiện tại: </Text>
            </p>
            <List
              dataSource={submittedFiles}
              renderItem={(file, index) => (
                <List.Item
                  key={index}
                  actions={[
                    <Button
                      type="link"
                      danger
                      onClick={() => handleRemoveExistingFile(index)}
                    >
                      Xóa
                    </Button>,
                  ]}
                >
                  <Link
                    onClick={(e) => {
                      e.preventDefault();
                      const fileName = file.name || file.split("/").pop();
                      handleDownload(fileName);
                    }}
                    style={{
                      marginRight: "8px",
                      textDecoration: "none",
                      color: "black",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1890ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "black";
                    }}
                  >
                    {file.name || file.split("/").pop()}
                  </Link>
                </List.Item>
              )}
            />
            <p style={{ marginTop: "20px" }}>
              <Text strong>Thay thế tệp mới:</Text>
            </p>
            <Upload
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList((prev) => [...prev, file]); // Thêm file mới
                return false;
              }}
              onRemove={(file) => {
                setFileList((prev) =>
                  prev.filter((item) => item.uid !== file.uid)
                ); // Xóa file khỏi danh sách tải lên mới
              }}
              multiple
            >
              <Button icon={<UploadOutlined />}>Tải tệp mới</Button>
            </Upload>
          </Modal>
        </Card>
      )}
    </>
  );
};

export default GroupOutcomeCard;
