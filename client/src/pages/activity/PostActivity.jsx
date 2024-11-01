import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Upload,
  message,
  Layout,
  List,
  Avatar,
  Dropdown,
  Menu,
  Card,
  Tooltip,
  Input,
  Steps,
} from "antd";
import {
  UploadOutlined,
  MoreOutlined,
  SendOutlined,
  FileOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DownOutlined,
  ProfileOutlined,
  DeleteOutlined,
  UserOutlined,
  FlagOutlined,
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

const PostActivity = () => {
  const [posts, setPosts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedText, setSuggestedText] = useState("");
  const [noPosts, setNoPosts] = useState(false);
  const [outcomes, setOutcomes] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const jwt = localStorage.getItem("jwt");
  const username = localStorage.getItem("username");

  const dispatch = useDispatch();
  const classList = useSelector((state) => state.class.classList);

  const config = {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  };

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
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/${localStorage.getItem("userId")}/user`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
          }
        );
        dispatch(setClassList(response.data));
      } catch (error) {
        message.error("Error fetching class list");
      }
    };
    if (classList.length === 0) {
      fetchClasses();
    }
  }, [classList.length, dispatch]);

  const handleClassSelect = (classItem) => {
    setSelectedClassId(classItem._id);
    setSelectedClassName(classItem.className);
    fetchPosts(classItem._id);
    fetchOutcomes(classItem._id);
  };

  const handlePost = async () => {
    if (!postContent || !selectedClassId) {
      message.error("Please enter content and select a class before posting.");
      return;
    }

    const cleanContent = DOMPurify.sanitize(postContent);

    const formData = new FormData();
    formData.append("description", cleanContent);
    formData.append("activityType", "post");
    formData.append("classId", selectedClassId);

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
      await fetchPosts(selectedClassId);
    } catch (error) {
      message.error("Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  const showModal = () => {
    if (!selectedClassId) {
      message.error("Please select a class before creating a post.");
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
    fileList: fileToUpload ? [fileToUpload] : [],
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

    if (fileToUpload) {
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
      fetchPosts(selectedClassId);
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
        `${BASE_URL}/activity/download?filename=${materialUrl}`,
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
  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };
  const handleDropdownClick = () => {
    setIsSearching(true);
    setSearchValue("");
  };
  const classDropdown = (
    <div style={{ padding: "8px" }}>
      {isSearching ? (
        <div style={{ position: "relative" }}>
          <Input
            placeholder="Tìm kiếm lớp học"
            value={searchValue}
            onChange={handleInputChange}
            style={{ marginBottom: "8px", paddingRight: "8px" }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: `${searchValue.length * 8.5 + 12}px`,
              transform: "translateY(-50%)",
              color: "#bfbfbf",
              pointerEvents: "none",
            }}
          >
            {suggestedText}
          </span>
        </div>
      ) : null}
      <Menu>
        {filteredClasses.length > 0 ? (
          filteredClasses.map((classItem) => (
            <Menu.Item
              key={classItem._id}
              onClick={() => handleClassSelect(classItem)}
            >
              {classItem.className}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item disabled>Không tìm thấy lớp</Menu.Item>
        )}
      </Menu>
    </div>
  );
  useEffect(() => {
    if (searchValue) {
      const filtered = classList.filter((classItem) =>
        classItem.className.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredClasses(filtered);

      const suggestion = filtered.length > 0 ? filtered[0].className : "";
      setSuggestedText(
        suggestion.startsWith(searchValue)
          ? suggestion.slice(searchValue.length)
          : ""
      );
    } else {
      setFilteredClasses(classList);
      setSuggestedText("");
    }
  }, [searchValue, classList]);
  const refreshPosts = () => {
    if (selectedClassId) {
      fetchPosts(selectedClassId);
    }
  };
  useEffect(() => {
    if (selectedClassId) {
      fetchOutcomes(selectedClassId);
    } else {
      setOutcomes([]);
      setCurrentStep(0);
    }
  }, [selectedClassId]);
  const determineCurrentStep = (outcomesList) => {
    let step = 0;

    while (step <= 3) {
      const outcome = outcomesList.find(
        (outcome) => outcome.assignmentType.toLowerCase() === `outcome ${step}`
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

      step += 1;
    }

    setCurrentStep(3);
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

  return (
    <Layout>
      <div style={{ padding: "24px", width: "100%", backgroundColor: "#fff" }}>
        <Dropdown
          overlay={classDropdown}
          trigger={["click"]}
          onOpenChange={handleDropdownClick}
        >
          <Button>
            {selectedClassName ? `Lớp: ${selectedClassName}` : "Chọn lớp"}{" "}
            <DownOutlined />
          </Button>
        </Dropdown>
        {selectedClassId && (
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
                        <Tooltip title="5/6 nhóm chưa nộp">
                          <FlagOutlined
                            style={{
                              position: "absolute",
                              top: "-38%",
                              // left: `${progressPercentage}%`,
                              left: "110%",
                              transform: "translate(-50%, -50%)",
                              color:
                                progressPercentage === 100 ? "#52c41a" : "red",
                              fontSize: "16px",
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="1/6 nhóm đã nộp ">
                          <FlagOutlined
                            style={{
                              position: "absolute",
                              top: "-38%",
                              // left: `${progressPercentage}%`,
                              left: "405%",
                              transform: "translate(-50%, -50%)",
                              color:
                                progressPercentage === 100
                                  ? "#52c41a"
                                  : "green",
                              fontSize: "16px",
                            }}
                          />
                        </Tooltip>
                      </div>
                    ) : (
                      "Chưa tạo Outcome " + stepNumber
                    )
                  }
                />
              );
            })}
          </Steps>
        )}

        {selectedClassId ? (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              border: "1px solid #d3e4f3",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e6f7ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f8ff";
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
              {posts ? (
                <b style={{ color: "#1890ff" }}>{posts.length} Bài viết</b>
              ) : (
                ""
              )}
            </p>
          </div>
        ) : (
          ""
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
                        ) : (
                          <h4></h4>
                        )}

                        <div className="user">
                          <Avatar icon={<FileOutlined />} />
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
          <div style={{ width: "24%" }}>
            {selectedClassId ? (
              <>
                <MaterialList
                  style={{ flex: 2 }}
                  selectedClassId={selectedClassId}
                />
                <OutcomeList
                  selectedClassId={selectedClassId}
                  refreshPosts={refreshPosts}
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
              onClick={{}}
              style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                zIndex: 1000,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
            />
          </Tooltip>
        ) : (
          ""
        )}
      </div>
    </Layout>
  );
};

export default PostActivity;
