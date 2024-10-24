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
} from "antd";
import {
  UploadOutlined,
  MoreOutlined,
  SendOutlined,
  FileOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import AppHeader from "../../layouts/admin/AdminHeader";
import TeacherSidebar from "./TeacherSidebar";
import { useDispatch, useSelector } from "react-redux";
import { setClassList } from "../../redux/slice/ClassSlice";
import moment from "moment";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";
import "../../style/Activity/postActivity.css";

const PostActivity = () => {
  const [posts, setPosts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

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
      setPosts(response.data.filter((post) => post.activityType === "post"));
    } catch (error) {
      message.error("Error fetching posts");
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/${localStorage.getItem("userId")}/user`,
          config
        );
        dispatch(setClassList(response.data));
      } catch (error) {
        message.error("Error fetching class list");
      }
    };
    if (classList.length === 0) {
      fetchClasses();
    }
  }, [classList.length, config, dispatch]);

  const handleClassSelect = ({ key }) => {
    const selectedClass = classList.find((classItem) => classItem._id === key);
    setSelectedClassId(key);
    setSelectedClassName(selectedClass.className);
    fetchPosts(key);
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
      fetchPosts(selectedClassId); // Fetch lại posts sau khi đăng bài
    } catch (error) {
      message.error("Failed to create post");
    } finally {
      setUploading(false);
    }
  };
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
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
      setPostContent(""); // Reset lại nội dung sau khi chỉnh sửa
      fetchPosts(selectedClassId); // Fetch lại posts sau khi cập nhật
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

  const handleComment = (postId) => {
    message.info(`Gửi nhận xét cho bài viết ${postId}`);
    setCommentContent("");
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
  const classMenu = {
    items: classList.map((classItem) => ({
      key: classItem._id,
      label: classItem.className,
    })),
    onClick: handleClassSelect,
  };
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />
      <Layout>
        <TeacherSidebar collapsed={collapsed} toggleCollapse={toggleCollapse} />
        <div style={{ padding: "24px", width: "100%" }}>
          <Dropdown menu={classMenu} trigger={["click"]}>
            <Button style={{ marginBottom: "16px" }}>
              {selectedClassName
                ? `Selected Class: ${selectedClassName}`
                : "Select a class"}
            </Button>
          </Dropdown>

          <div
            style={{
              backgroundColor: "white",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
            onClick={showModal}
          >
            <p>
              Đăng bài viết nào đó cho lớp của bạn. Bấm vào đây!{" "}
              <EditOutlined style={{ marginRight: "8px", fontSize: "18px" }} />
            </p>
          </div>
          {posts.length > 0 ? (
            <h2 style={{ textAlign: "center" }}>Danh sách bài viết</h2>
          ) : (
            ""
          )}
          <List
            grid={{ gutter: 16, column: 1 }}
            dataSource={posts.slice().reverse()}
            renderItem={(post) => (
              <List.Item>
                <Card
                  className={isNewPost(post.createdAt) ? "new-post-border" : ""}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    border: isNewPost(post.createdAt)
                      ? "2px solid #1890ff"
                      : "1px solid #f0f0f0",
                    transition: "border 0.5s ease-in-out",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileOutlined />} />}
                      title={username}
                      description={new Date(
                        post.createdAt
                      ).toLocaleTimeString()}
                    />
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {isNewPost(post.createdAt) && (
                        <span
                          style={{
                            backgroundColor: "#1890ff",
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            marginRight: "8px",
                            fontSize: "12px",
                          }}
                        >
                          Bài mới
                        </span>
                      )}
                      <Dropdown
                        overlay={postActionsMenu(post._id)}
                        trigger={["click"]}
                      >
                        <MoreOutlined
                          style={{ cursor: "pointer", fontSize: "18px" }}
                        />
                      </Dropdown>
                    </div>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: post.description }} />
                  Tài liệu:{post.materialUrl && (
                    <Button
                      type="link"
                      onClick={() =>
                        handleDownload(post.materialUrl.split("/").pop())
                      }
                    >
                      {post.materialUrl.split("/").pop()}
                    </Button>
                  )}
                  <ul
                    className="ant-card-actions"
                    style={{ borderTop: "1px solid #f0f0f0" }}
                  >
                    <li
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        display: "flex",
                      }}
                    >
                      <Input
                        placeholder="Thêm nhận xét cho bài viết..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        style={{ width: "100%", borderRadius: "18px" }}
                      />
                      <Tooltip title="Send Comment">
                        <SendOutlined
                          onClick={() => handleComment(post._id)}
                          style={{
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#1890ff",
                          }}
                        />
                      </Tooltip>
                    </li>
                  </ul>
                </Card>
              </List.Item>
            )}
          />

          {/* Modal thêm bài viết mới */}
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

          {/* Modal chỉnh sửa bài viết */}
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
        </div>
      </Layout>
    </Layout>
  );
};

export default PostActivity;
