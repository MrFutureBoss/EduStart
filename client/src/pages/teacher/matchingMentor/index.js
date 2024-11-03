import React, { useState } from "react";
import { Layout, Row, Col, Statistic, Card, Button, Modal, List } from "antd";
import { useSelector } from "react-redux";
import ClassGroupTreeView from "./ClassGroupTreeView";

const { Sider, Content } = Layout;

const MatchingMentorIndex = () => {
  const {
    counts,
    classesWithUnupdatedProjects,
    notMatchedClasses,
    matchedClasses,
  } = useSelector((state) => state.class);

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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <div style={{ backgroundColor: "#FFFF" }}>
        <Row style={{ marginBottom: 20 }} gutter={16} justify="center">
          <Col span={6}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Statistic
                title="Tổng số lớp"
                value={counts?.totalClasses || 0}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Statistic
                title="Lớp đã ghép mentor đầy đủ"
                value={counts?.totalFullyMatchedClasses || 0}
                valueStyle={{ color: "#52c41a" }}
              />
              <Button
                type="link"
                style={{ position: "absolute", right: 10, bottom: 10 }}
                onClick={() =>
                  showModal("Lớp đã ghép mentor đầy đủ", matchedClasses)
                }
              >
                Xem
              </Button>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Statistic
                title="Lớp chưa ghép mentor đầy đủ"
                value={counts?.totalNotFullyMatchedClasses || 0}
                valueStyle={{ color: "orange" }}
              />
              <Button
                type="link"
                style={{ position: "absolute", right: 10, bottom: 10 }}
                onClick={() =>
                  showModal("Lớp chưa ghép mentor đầy đủ", notMatchedClasses)
                }
              >
                Xem
              </Button>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Statistic
                title="Lớp có nhóm chưa cập nhật dự án"
                value={classesWithUnupdatedProjects?.length || 0}
                valueStyle={{ color: "red" }}
              />
              <Button
                type="link"
                style={{ position: "absolute", right: 10, bottom: 10 }}
                onClick={() =>
                  showModal(
                    "Lớp có nhóm chưa cập nhật dự án",
                    classesWithUnupdatedProjects
                  )
                }
              >
                Xem
              </Button>
            </Card>
          </Col>
        </Row>
      </div>

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
                          classItem.unmatchedGroups &&
                          classItem.unmatchedGroups.length > 0
                            ? `Nhóm chưa ghép: ${classItem.unmatchedGroups
                                .map((group) => group.groupName)
                                .join(", ")}`
                            : classItem.groupsWithoutProject &&
                              classItem.groupsWithoutProject.length > 0
                            ? `Nhóm chưa cập nhật dự án: ${classItem.groupsWithoutProject
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
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MatchingMentorIndex;
