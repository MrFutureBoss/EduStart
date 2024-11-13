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

  // Tạo danh sách các lớp có nhóm chưa cập nhật dự án
  const classesWithUnupdatedProjects = classSummaries.filter(
    (classItem) =>
      classItem.groupsWithoutProject &&
      classItem.groupsWithoutProject.length > 0
  );

  const matchedClasses = classSummaries.filter(
    (classItem) => classItem.isFullyMatched
  );
  const notMatchedClasses = classSummaries.filter(
    (classItem) => !classItem.isFullyMatched
  );

  // Đếm số nhóm có trạng thái "Pending" và gom nhóm theo lớp
  const classesWithPendingGroups = classSummaries
    .map((classItem) => ({
      classId: classItem.classId,
      className: classItem.className,
      pendingGroups: classItem.groupDetails.filter(
        (group) => group.matchStatus === "Pending"
      ),
    }))
    .filter((classItem) => classItem.pendingGroups.length > 0); // Lọc các lớp có nhóm "Pending"

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
      <div style={{ backgroundColor: "#FFFF" }}>
        <Row
          style={{
            marginBottom: 20,
            gap: "39px",
            marginLeft: -18,
            marginRight: -18,
          }}
          justify="center"
        >
          <Col span={4}>
            <Card
              style={{
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                height: "112px",
                width: " 188px",
              }}
            >
              <Statistic
                title="Tổng số lớp"
                value={counts?.totalClasses || 0}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card
              style={{
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                height: "112px",
                width: " 188px",
              }}
            >
              <Statistic
                title="Lớp đã ghép xong"
                value={matchedClasses.length}
                valueStyle={{ color: "#52c41a" }}
              />
              <Button
                type="link"
                style={{ position: "absolute", right: 10, bottom: 10 }}
                onClick={() =>
                  showModal("Lớp đã ghép Mentor xong", matchedClasses)
                }
              >
                Xem
              </Button>
            </Card>
          </Col>
          <Col span={4}>
            <Card
              style={{
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                height: "112px",
                width: " 188px",
              }}
            >
              <Statistic
                title="Lớp chưa ghép xong"
                value={notMatchedClasses.length}
                valueStyle={{ color: "orange" }}
              />
              <Button
                type="link"
                style={{ position: "absolute", right: 10, bottom: 10 }}
                onClick={() =>
                  showModal("Lớp chưa ghép Mentor xong", notMatchedClasses)
                }
              >
                Xem
              </Button>
            </Card>
          </Col>
          <Col span={4}>
            <Card
              style={{
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                height: "112px",
                width: " 188px",
              }}
            >
              <Statistic
                title="Lớp có nhóm chưa cập nhật dự án"
                value={classesWithUnupdatedProjects.length}
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
          <Col span={4}>
            <Card
              style={{
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                height: "112px",
                width: " 188px",
              }}
            >
              <Statistic
                title="Số nhóm chờ duyệt"
                value={classesWithPendingGroups.reduce(
                  (sum, classItem) => sum + classItem.pendingGroups.length,
                  0
                )}
                valueStyle={{ color: "orange" }}
              />
              <Button
                type="link"
                style={{ position: "absolute", right: 10, bottom: 10 }}
                onClick={() =>
                  showModal(
                    "Danh sách lớp với nhóm chờ duyệt",
                    classesWithPendingGroups
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
