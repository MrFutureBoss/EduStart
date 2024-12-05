// src/components/PostActivity.js

import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Upload,
  message,
  Layout,
  Dropdown,
  Menu,
  Avatar,
  Tooltip,
  Steps,
} from "antd";
import {
  UploadOutlined,
  MoreOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ProfileOutlined,
  FlagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassList } from "../../redux/slice/ClassSlice";
import moment from "moment";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";
import "../../style/Activity/postActivity.css";
import MaterialList from "./MaterialList";
import OutcomeList from "./OutcomeActivity";
import { useNavigate, useParams } from "react-router-dom";

const PostActivity = () => {
  const { className } = useParams(); // Lấy className từ URL
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const jwt = localStorage.getItem("jwt");
  const username = localStorage.getItem("username");

  const classList = useSelector((state) => state.class.classList); // Sửa selector đúng tên slice

  const config = {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  };

  const [posts, setPosts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [noPosts, setNoPosts] = useState(false);
  const [outcomes, setOutcomes] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const [classId, setClassId] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/${localStorage.getItem("userId")}/user`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
        dispatch(setClassList(response.data));
      } catch (error) {
        message.error("Error fetching class list");
      }
    };
    if (classList?.length === 0) { // Sử dụng optional chaining
      fetchClasses();
    }
  }, [classList?.length, dispatch, jwt]); // Sửa dependency

  useEffect(() => {
    if (className && classList?.length > 0) { // Kiểm tra classList có tồn tại
      const selectedClass = classList.find(
        (cls) => cls.className.toLowerCase() === className.toLowerCase()
      );
      if (selectedClass) {
        setClassId(selectedClass._id);
        fetchPosts(selectedClass._id);
        fetchOutcomes(selectedClass._id);
      } else {
        message.error("Class not found");
      }
    }
  }, [className, classList]);

  const fetchPosts = async (classId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity?classId=${classId}&activityType=post`,
        config
      );
      const postData = response.data.filter(
        (post) => post.activityType === "post"
      );

      if (postData.length === 0) {
        setNoPosts(true);
      } else {
        setNoPosts(false);
        setPosts(postData);
      }
    } catch (error) {
      setNoPosts(true);
      message.error("Error fetching posts");
    }
  };

  const fetchOutcomes = async (classId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity?activityType=outcome&classId=${classId}`,
        config
      );

      const filteredOutcomes = response.data.filter(
        (activity) => activity.activityType === "outcome"
      );

      setOutcomes(filteredOutcomes || []);
      determineCurrentStep(filteredOutcomes);
    } catch (error) {
      message.error("Error fetching outcomes. Please try again.");
      setOutcomes([]);
      setCurrentStep(0);
    }
  };

  const determineCurrentStep = (outcomesList) => {
    let step = 1; // Start từ Outcome 1

    while (step <= 3) {
      const outcome = outcomesList.find(
        (outcome) =>
          outcome.assignmentType.toLowerCase() === `outcome ${step}`
      );

      if (!outcome) {
        setCurrentStep(step);
        return;
      }

      const deadline = moment(outcome.deadline);
      const now = moment();

      if (now.isBefore(deadline)) {
        setCurrentStep(step);
        return;
      }

      if (outcome.status !== "Hoàn thành") {
        setCurrentStep(step);
        return;
      }

      step += 1;
    }

    setCurrentStep(3);
  };

  const handlePost = async () => {
    if (!postContent || !classId) {
      message.error("Please enter content before posting.");
      return;
    }

    const cleanContent = DOMPurify.sanitize(postContent);

    const formData = new FormData();
    formData.append("description", cleanContent);
    formData.append("activityType", "post");
    formData.append("classId", classId);

    if (fileToUpload) {
      formData.append("materialFile", fileToUpload);
    }

    try {
      setUploading(true);
      await axios.post(`${BASE_URL}/activity`, formData, config);
      message.success("Post created successfully");
      setIsModalVisible(false);
      setPostContent("");
      setFileToUpload(null);
      await fetchPosts(classId);
    } catch (error) {
      message.error("Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  const showModal = () => {
    if (!classId) {
      message.error("Class not found. Cannot create post.");
      return;
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setPostContent("");
    setFileToUpload(null);
  };

  const uploadProps = {
    beforeUpload: (file) => {
      setFileToUpload(file);
      return false;
    },
    onRemove: () => {
      setFileToUpload(null);
    },
    fileList: fileToUpload
      ? fileToUpload instanceof File
        ? [fileToUpload]
        : [
            {
              uid: "-1",
              name: fileToUpload.name,
              status: "done",
              url: fileToUpload.url,
            },
          ]
      : [],
  };

  const postActionsMenu = (postId) => (
    <Menu>
      <Menu.Item key="edit" onClick={() => handleEditPost(postId)}>
        Chỉnh sửa
      </Menu.Item>
      <Menu.Item key="delete" onClick={() => confirmDeletePost(postId)}>
        Xóa
      </Menu.Item>
    </Menu>
  );

  const handleEditPost = async (postId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity/${postId}`,
        config
      );
      const post = response.data;
      setSelectedPostId(postId);
      setPostContent(post.description);
      setFileToUpload(
        post.materialUrl
          ? {
              uid: "-1",
              name: post.materialUrl.split("/").pop(),
              status: "done",
              url: post.materialUrl,
            }
          : null
      );
      setEditModalVisible(true);
    } catch (error) {
      message.error("Failed to load post data for editing");
    }
  };

  const handleUpdatePost = async () => {
    if (!postContent) {
      message.error("Please enter content");
      return;
    }

    const formData = new FormData();
    formData.append("description", DOMPurify.sanitize(postContent));

    if (fileToUpload && fileToUpload instanceof File) {
      formData.append("materialFile", fileToUpload);
    }

    try {
      setUploading(true);
      await axios.patch(
        `${BASE_URL}/activity/${selectedPostId}`,
        formData,
        config
      );
      message.success("Post updated successfully");
      setEditModalVisible(false);
      setPostContent("");
      setFileToUpload(null);
      await fetchPosts(classId);
    } catch (error) {
      message.error("Failed to update post");
    } finally {
      setUploading(false);
    }
  };

  const { confirm } = Modal;
  const confirmDeletePost = (postId) => {
    confirm({
      title: "Xác nhận xóa",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn xóa bài viết này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        handleDeletePost(postId);
      },
      onCancel() {
        console.log("Hủy xóa bài viết");
      },
    });
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`${BASE_URL}/activity/${postId}`, config);
      message.success("Bài viết đã được xóa thành công");

      const updatedPosts = posts.filter((post) => post._id !== postId);
      setPosts(updatedPosts);
    } catch (error) {
      message.error("Xóa bài viết thất bại");
    }
  };

  const handleDownload = async (materialUrl) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity/download/${materialUrl}`,
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
      message.error("Error downloading the file");
    }
  };

  const isNewPost = (createdAt) => {
    const postTime = moment(createdAt);
    const currentTime = moment();
    return currentTime.diff(postTime, "minutes") <= 10;
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setPostContent("");
    setFileToUpload(null);
  };

  return (
    <Layout>
      <div style={{ padding: "24px", width: "100%", backgroundColor: "#fff" }}>
        {/* Hiển thị tên lớp */}
        <div style={{ marginBottom: "16px" }}>
          <h2>Class: {className}</h2>
        </div>

        {/* Hiển thị giai đoạn hiện tại */}
        {classId && (
          <Steps
            current={currentStep}
            size="default"
            direction="horizontal"
            style={{ margin: "24px 0", position: "relative" }}
          >
            {[1, 2, 3].map((stepNumber) => {
              const assignmentType = `outcome ${stepNumber}`;
              const outcome = outcomes.find(
                (outcome) =>
                  outcome.assignmentType.toLowerCase() === assignmentType
              );
              const progressPercentage = outcome
                ? getProgressPercentage(outcome.startDate, outcome.deadline)
                : 0;

              return (
                <Steps.Step
                  key={stepNumber}
                  title={`Outcome ${stepNumber}`}
                  description={
                    outcome ? (
                      <div style={{ position: "relative" }}>
                        <Tooltip title="Start date">
                          <p style={{ color: "green" }}>
                            {moment(outcome.startDate).format("DD-MM-YYYY")}
                          </p>
                        </Tooltip>
                        <Tooltip title="Deadline">
                          <p style={{ color: "red" }}>
                            {moment(outcome.deadline).format("DD-MM-YYYY")}
                          </p>
                        </Tooltip>
                        <Tooltip
                          title={`${
                            outcome.totalGroups - outcome.assignedGroups
                          }/${outcome.totalGroups} nhóm chưa nộp`}
                        >
                          <FlagOutlined
                            style={{
                              position: "absolute",
                              top: "-38%",
                              left: "110%",
                              transform: "translate(-50%, -50%)",
                              color:
                                outcome.status === "Quá hạn"
                                  ? "red"
                                  : outcome.status === "Hoàn thành"
                                  ? "#52c41a"
                                  : "orange",
                              fontSize: "16px",
                            }}
                          />
                        </Tooltip>
                        <Tooltip
                          title={`${outcome.assignedGroups}/${outcome.totalGroups} nhóm đã nộp`}
                        >
                          <FlagOutlined
                            style={{
                              position: "absolute",
                              top: "-38%",
                              left: "405%",
                              transform: "translate(-50%, -50%)",
                              color:
                                outcome.status === "Hoàn thành"
                                  ? "#52c41a"
                                  : "green",
                              fontSize: "16px",
                            }}
                          />
                        </Tooltip>
                      </div>
                    ) : (
                      `Chưa tạo Outcome ${stepNumber}`
                    )
                  }
                />
              );
            })}
          </Steps>
        )}

        {classId && (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              border: "1px solid #d3e4f3",
              backgroundColor: "#f0f8ff",
            }}
            onClick={showModal}
          >
            <p>
              Đăng bài viết nào đó cho lớp của bạn. Bấm vào đây!{" "}
              <EditOutlined style={{ marginRight: "8px", fontSize: "18px" }} />
              <br />
              <ProfileOutlined
                style={{ marginRight: "5px", fontSize: "16px" }}
              />
              {posts.length > 0 ? (
                <b style={{ color: "#1890ff" }}>{posts.length} Bài viết</b>
              ) : (
                <b style={{ color: "#1890ff" }}>0 Bài viết</b>
              )}
            </p>
          </div>
        )}

        <div style={{ display: "flex" }}>
          <div style={{ flex: 8 }}>
            {noPosts ? (
              <p>Chưa có bài đăng nào!</p>
            ) : (
              <div className="post-container">
                {posts
                  .slice()
                  .reverse()
                  .map((post) => (
                    <div
                      key={post._id}
                      className={`post-card gradient-animated ${
                        isNewPost(post.createdAt) ? "new-post-border" : ""
                      }`}
                    >
                      <div className="post-card-body">
                        {isNewPost(post.createdAt) && (
                          <span className="new-post-badge">Bài mới</span>
                        )}
                        <span className="tag tag-blue">
                          {post.tag || "Bài đăng"}
                        </span>
                        <div
                          className="post-content"
                          dangerouslySetInnerHTML={{ __html: post.description }}
                        />
                        {post.materialUrl ? (
                          <Button
                            type="link"
                            onClick={() => handleDownload(post.materialUrl)}
                            style={{ padding: 0 }}
                          >
                            <h6>
                              Tài liệu: {post.materialUrl.split("/").pop()}
                            </h6>
                          </Button>
                        ) : null}

                        <div className="user">
                          <Avatar icon={<UserOutlined />} />
                          <div className="user-info">
                            <h5>{username}</h5>
                            <small>{moment(post.createdAt).fromNow()}</small>
                          </div>
                          <Dropdown
                            overlay={postActionsMenu(post._id)}
                            trigger={["click"]}
                          >
                            <MoreOutlined
                              className="more-options"
                              style={{
                                cursor: "pointer",
                                fontSize: "18px",
                              }}
                            />
                          </Dropdown>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <Modal
            title="Đăng bài viết"
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button
                key="submit"
                type="primary"
                onClick={handlePost}
                loading={uploading}
              >
                Đăng
              </Button>,
            ]}
          >
            <ReactQuill
              value={postContent}
              onChange={setPostContent}
              theme="snow"
              style={{ marginBottom: "16px" }}
            />
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Đính kèm file</Button>
            </Upload>
          </Modal>

          <Modal
            title="Chỉnh sửa bài viết"
            visible={editModalVisible}
            onCancel={handleCancelEdit}
            footer={[
              <Button
                key="submit"
                type="primary"
                onClick={handleUpdatePost}
                loading={uploading}
              >
                Cập nhật
              </Button>,
            ]}
          >
            <ReactQuill
              theme="snow"
              value={postContent}
              onChange={setPostContent}
              style={{ marginBottom: "16px" }}
            />
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Cập nhật file đính kèm</Button>
            </Upload>
          </Modal>

          <div style={{ width: "24%", marginLeft: "16px" }}>
            {classId ? (
              <>
                <MaterialList selectedClassId={classId} />
                <OutcomeList
                  selectedClassId={classId}
                  refreshPosts={fetchPosts}
                />
              </>
            ) : (
              <p></p>
            )}
          </div>
        </div>

        {posts.length > 0 ? (
          <Tooltip title="Kéo vào thùng rác để xóa">
            <Button
              type="primary"
              shape="circle"
              icon={<DeleteOutlined />}
              danger
              size="large"
              // onClick={handleBulkDelete} // Implement bulk delete if needed
              style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                zIndex: 1000,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
            />
          </Tooltip>
        ) : null}
      </div>
    </Layout>
  );
};

// Helper function to get progress percentage
const getProgressPercentage = (startDate, deadline) => {
  const now = moment();
  const start = moment(startDate);
  const end = moment(deadline);

  if (now.isBefore(start)) {
    return 0;
  } else if (now.isAfter(end)) {
    return 100;
  } else {
    const totalDuration = end.diff(start);
    const elapsed = now.diff(start);
    return Math.round((elapsed / totalDuration) * 100);
  }
};

export default PostActivity;
