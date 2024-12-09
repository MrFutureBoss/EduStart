import React, { useState } from "react";
import { Layout, Row, Col, Statistic, Card, Button, Modal, List } from "antd";
import { useSelector } from "react-redux";
import ClassGroupTreeView from "./ClassGroupTreeView";
import ViewMatching from "./project-overview/ViewMatching";

const { Sider, Content } = Layout;

const MatchingMentorIndex = () => {
  const { counts, classSummaries, selectedGroup } = useSelector(
    (state) => state.class
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);

  const showModal = (title, data) => {
    setModalTitle(title);
    setModalData(data);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  console.log(counts);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout>
        <Sider
          width={300}
          style={{
            background: "#fff",
            padding: "20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <ClassGroupTreeView />
        </Sider>

        <Layout>
          <Content
            style={{
              padding: "29px",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Modal hiển thị danh sách lớp */}
            <Modal
              title={modalTitle}
              visible={isModalVisible}
              onCancel={handleCancel}
              footer={null}
            >
              {modalData.length > 0 ? (
                <List
                  dataSource={modalData}
                  renderItem={(classItem) => (
                    <List.Item key={classItem.classId}>
                      <List.Item.Meta
                        title={classItem.className}
                        description={
                          classItem.pendingGroups &&
                          classItem.pendingGroups.length > 0
                            ? `Nhóm chờ duyệt: ${classItem.pendingGroups
                                .map((group) => group.groupName)
                                .join(", ")}`
                            : classItem.groupsWithoutProject &&
                              classItem.groupsWithoutProject.length > 0
                            ? `Nhóm chưa cập nhật dự án: ${classItem.groupsWithoutProject
                                .map((group) => group.groupName)
                                .join(", ")}`
                            : classItem.unmatchedGroups &&
                              classItem.unmatchedGroups.length > 0
                            ? `Nhóm chưa ghép: ${classItem.unmatchedGroups
                                .map((group) => group.groupName)
                                .join(", ")}`
                            : null
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <p>Không có lớp nào trong danh sách này</p>
              )}
            </Modal>
            {selectedGroup && <ViewMatching />}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MatchingMentorIndex;
