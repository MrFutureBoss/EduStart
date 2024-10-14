import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Typography,
  Button,
  List,
  Space,
  Modal,
  Tag,
  Pagination,
  message,
  Descriptions,
  Col,
  Row,
  Checkbox,
  Input,
  Select,
  Tooltip,
} from "antd";
import {
  BulbOutlined,
  InfoCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "../utilities/initialValue";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ViewGroups = () => {
  const [allGroups, setAllGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMentors, setSelectedMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const teacherId = "66f851c84223b6852309c0de";
  const [availableMentors, setAvailableMentors] = useState([]);
  const [selectedMentorIds, setSelectedMentorIds] = useState([]);
  const [mentorModalVisible, setMentorModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [professions, setProfessions] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [projectInfo, setProjectInfo] = useState({});
  const [professionInfo, setProfessionInfo] = useState({});
  const [specialtiesInfo, setSpecialtiesInfo] = useState([]);
  const [mentorSearch, setMentorSearch] = useState("");
  const [mentorPageNo, setMentorPageNo] = useState(1);
  const mentorPageSize = 2;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/tempMatching/${teacherId}`);
      const data = response.data.data;

      setAllGroups(data);
      setFilteredGroups(data);
      setTotal(data.length);
      extractFilterOptions(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      message.error("Đã có lỗi xảy ra khi tải dữ liệu.");
      setLoading(false);
    }
  };

  const fetchAvailableMentors = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/tempMatching/available-mentors`
      );
      setAvailableMentors(response.data);
    } catch (error) {
      console.error(error);
      message.error("Đã có lỗi xảy ra khi tải danh sách mentor.");
    }
  };

  const extractFilterOptions = (groups) => {
    const professionsSet = new Set();
    const specialtiesSet = new Set();

    groups.forEach((group) => {
      if (group.professionInfo) {
        professionsSet.add(JSON.stringify(group.professionInfo));
      }
      if (group.specialtiesInfo) {
        group.specialtiesInfo.forEach((specialty) => {
          specialtiesSet.add(JSON.stringify(specialty));
        });
      }
    });

    setProfessions([...professionsSet].map((item) => JSON.parse(item)));
    setSpecialties([...specialtiesSet].map((item) => JSON.parse(item)));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchAvailableMentors();
  }, [mentorModalVisible]);

  const handleClickSuggest = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/tempMatching/all-groups/${teacherId}`,
        { selectedMentorIds }
      );
      message.success(response.data.message);
      fetchData();
      setSelectedMentorIds([]);
    } catch (error) {
      console.error(error.response.data.message);
      message.error(error.response.data.message || "Đã có lỗi xảy ra.");
    }
  };

  const handleClickSaveAll = async () => {
    message.info("Chức năng lưu tất cả chưa được triển khai.");
  };

  const handleSaveMatched = async (groupId, mentorId) => {
    try {
      const response = await axios.post("/api/temp-matching/confirm-matching", {
        groupId,
        mentorId,
      });
      message.success(response.data.message);
      setPageNo(1);
    } catch (error) {
      console.error(error.response.data.message);
      message.error(error.response.data.message || "Đã có lỗi xảy ra.");
    }
  };

  const handleClickViewTemporaryMatching = (group) => {
    setSelectedMentors(group.mentorIds);
    setSelectedGroupId(group.groupInfo._id);
    setProjectInfo(group.projectInfo);
    setProfessionInfo(group.professionInfo);
    setSpecialtiesInfo(group.specialtiesInfo);
    setIsModalVisible(true);
  };

  const handleGroupDetailClick = (groupId) => {
    message.info(`Chi tiết nhóm với ID: ${groupId} chưa được triển khai.`);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedMentors([]);
  };

  const formatNumber = (number) => new Intl.NumberFormat().format(number);

  const toggleDetails = (groupId) => {
    setExpandedGroups((prevState) => ({
      ...prevState,
      [groupId]: !prevState[groupId],
    }));
  };

  const handleSelectMentor = (mentor) => {
    setAllGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.groupInfo._id === selectedGroupId) {
          return {
            ...group,
            mentorIds: [
              mentor,
              ...group.mentorIds.filter((m) => m.mentorId !== mentor.mentorId),
            ],
          };
        }
        return group;
      })
    );

    setIsModalVisible(false);
  };

  useEffect(() => {
    let filtered = allGroups;

    if (searchKeyword) {
      filtered = filtered.filter((group) =>
        group.projectInfo.name
          .toLowerCase()
          .includes(searchKeyword.toLowerCase())
      );
    }

    if (selectedProfession) {
      filtered = filtered.filter(
        (group) => group.professionInfo._id === selectedProfession
      );
    }

    if (selectedSpecialty) {
      filtered = filtered.filter((group) =>
        group.specialtiesInfo.some(
          (specialty) => specialty._id === selectedSpecialty
        )
      );
    }

    setFilteredGroups(filtered);
    setTotal(filtered.length);
    setPageNo(1);
  }, [searchKeyword, selectedProfession, selectedSpecialty, allGroups]);

  const handleSearch = (value) => {
    setSearchKeyword(value);
    setPageNo(1);
  };

  const handleFilterProfession = (value) => {
    setSelectedProfession(value);
    setPageNo(1);
  };

  const handleFilterSpecialty = (value) => {
    setSelectedSpecialty(value);
    setPageNo(1);
  };
  const paginatedGroups = filteredGroups.slice((pageNo - 1) * 3, pageNo * 3);
  const currentMentor = allGroups.find(
    (group) => group.groupInfo._id === selectedGroupId
  )?.mentorIds[0];

  const filteredMentors = selectedMentors.filter((mentor) =>
    mentor.username.toLowerCase().includes(mentorSearch.toLowerCase())
  );

  const paginatedMentors = filteredMentors.slice(
    (mentorPageNo - 1) * mentorPageSize,
    mentorPageNo * mentorPageSize
  );

  useEffect(() => {
    setMentorPageNo(1);
  }, [isModalVisible, mentorSearch]);
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 50,
          marginTop: 10,
          padding: 3,
          marginLeft: 5,
          marginRight: 5,
        }}
      >
        <Space wrap>
          <Search
            placeholder="Tìm kiếm theo tên dự án"
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="Lọc theo lĩnh vực"
            onChange={handleFilterProfession}
            style={{ width: 200 }}
            allowClear
          >
            {professions.map((profession) => (
              <Option key={profession._id} value={profession._id}>
                {profession.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Lọc theo chuyên môn"
            onChange={handleFilterSpecialty}
            style={{ width: 200 }}
            allowClear
          >
            {specialties.map((specialty) => (
              <Option key={specialty._id} value={specialty._id}>
                {specialty.name}
              </Option>
            ))}
          </Select>
        </Space>

        <Space wrap>
          <Text style={{ marginRight: 3 }}>
            Tổng: {formatNumber(total || 0)}
          </Text>
          <Button
            icon={<BulbOutlined />}
            onClick={() => setMentorModalVisible(true)}
          >
            Chọn mentor
          </Button>
          <Button icon={<BulbOutlined />} onClick={handleClickSuggest}>
            Gợi ý lại
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleClickSaveAll}>
            Lưu tất cả
          </Button>
        </Space>
      </div>

      <Modal
        title="Chọn Mentor Yêu Thích"
        open={mentorModalVisible}
        onCancel={() => setMentorModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setMentorModalVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="suggest"
            type="primary"
            icon={<BulbOutlined />}
            onClick={async () => {
              try {
                const response = await axios.post(
                  `${BASE_URL}/tempMatching/all-groups/${teacherId}`,
                  { selectedMentorIds }
                );
                message.success(response.data.message);
                fetchData();
                setSelectedMentorIds([]);
                setMentorModalVisible(false);
              } catch (error) {
                console.error(error);
                message.error(
                  error.response?.data.message || "Đã có lỗi xảy ra."
                );
              }
            }}
            disabled={selectedMentorIds.length === 0}
          >
            Gợi ý với Mentor Yêu Thích
          </Button>,
        ]}
        width={700}
      >
        <List
          dataSource={availableMentors}
          renderItem={(mentorCat) => (
            <List.Item key={mentorCat.mentorId._id}>
              <Checkbox
                checked={selectedMentorIds.includes(mentorCat.mentorId._id)}
                onChange={(e) => {
                  const mentorId = mentorCat.mentorId._id;
                  if (e.target.checked) {
                    setSelectedMentorIds([...selectedMentorIds, mentorId]);
                  } else {
                    setSelectedMentorIds(
                      selectedMentorIds.filter((id) => id !== mentorId)
                    );
                  }
                }}
              >
                {mentorCat.mentorId.username} - {mentorCat.professionId.name}
              </Checkbox>
            </List.Item>
          )}
        />
      </Modal>

      {/* Danh sách nhóm */}
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={paginatedGroups}
        loading={loading}
        renderItem={(tempMatching) => {
          const groupInfo = tempMatching.groupInfo;
          const projectInfo = tempMatching.projectInfo;
          const mentorIds = tempMatching.mentorIds;
          const professionInfo = tempMatching.professionInfo;
          const specialtiesInfo = tempMatching.specialtiesInfo;
          const topMentor = mentorIds[0];

          return (
            <List.Item key={tempMatching._id}>
              <Card
                title={
                  <Space direction="vertical">
                    <Row align="middle">
                      <Title level={4} style={{ margin: 0 }}>
                        {projectInfo?.name || "N/A"}
                      </Title>
                      <Tooltip
                        color="#fff"
                        title={
                          <div style={{ color: "#000" }}>
                            <p>
                              <strong>Lĩnh vực:</strong> Màu xanh nếu lĩnh vực
                              của mentor và nhóm trùng nhau.
                            </p>
                            <p>
                              <strong>Chuyên môn:</strong>

                              <p style={{ marginLeft: 8, marginTop: -1 }}>
                                Màu xanh nếu chuyên môn của mentor và nhóm trùng
                                nhau.
                              </p>
                              <p style={{ marginLeft: 8, marginTop: -8 }}>
                                Mục [Số/5] là chỉ mức độ thành thạo chuyên của
                                mentor trên thang điểm 5.
                              </p>
                            </p>

                            <p>
                              <strong>Nhóm đã nhận:</strong> Hiển thị số nhóm mà
                              mentor đã nhận.
                            </p>
                            <p>
                              <strong>Mentor đã chọn nhóm này:</strong> Hiển thị
                              khi mentor đã chọn nhóm này là nhóm yêu thích.
                            </p>
                            <p>
                              <strong>Mức độ phù hợp:</strong> Điểm số đánh giá
                              mức độ phù hợp của mentor với nhóm.
                            </p>
                          </div>
                        }
                      >
                        <InfoCircleOutlined
                          style={{
                            marginLeft: 10,
                            color: "#1890ff",
                            cursor: "pointer",
                          }}
                        />
                      </Tooltip>
                    </Row>
                    <Text>
                      <strong>Lĩnh vực:</strong>{" "}
                      <strong
                        style={{ marginLeft: "4px", fontWeight: "normal" }}
                      >
                        {professionInfo?.name || "N/A"}
                      </strong>
                    </Text>
                    <Text>
                      <strong>Chuyên môn cần hỗ trợ:</strong>{" "}
                      <strong
                        style={{ marginLeft: "2px", fontWeight: "normal" }}
                      >
                        {specialtiesInfo?.map((s) => s.name).join(", ") ||
                          "N/A"}
                      </strong>
                    </Text>
                  </Space>
                }
                extra={
                  topMentor && (
                    <Button
                      type="primary"
                      onClick={() =>
                        handleSaveMatched(groupInfo._id, topMentor.mentorId)
                      }
                    >
                      Lưu
                    </Button>
                  )
                }
              >
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  {topMentor ? (
                    <Card
                      type="inner"
                      title={
                        <Space>
                          Mentor Đề Xuất
                          {topMentor.isPreferredGroup && (
                            <Tag color="green" style={{ marginLeft: 10 }}>
                              Mentor đã chọn nhóm này
                            </Tag>
                          )}
                        </Space>
                      }
                      size="small"
                      style={{ marginBottom: 16 }}
                    >
                      <Descriptions
                        column={1}
                        bordered
                        size="small"
                        labelStyle={{ fontWeight: "bold", width: "30%" }}
                      >
                        <Descriptions.Item label="Tên Mentor">
                          {topMentor.username || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Lĩnh vực">
                          <Text
                            style={{
                              color: topMentor.professions.some(
                                (p) => p.professionId === professionInfo._id
                              )
                                ? "green"
                                : "black",
                            }}
                          >
                            {topMentor.professions
                              ?.map((s) => s.name)
                              .join(", ") || "N/A"}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Mức độ phù hợp">
                          <Tag
                            color={
                              topMentor.score >= 46
                                ? "blue"
                                : topMentor.score >= 36
                                ? "green"
                                : topMentor.score >= 26
                                ? "lime"
                                : topMentor.score >= 16
                                ? "orange"
                                : "red"
                            }
                          >
                            {topMentor.score >= 46
                              ? "Hoàn toàn phù hợp"
                              : topMentor.score >= 36
                              ? "Rất cao"
                              : topMentor.score >= 26
                              ? "Cao"
                              : topMentor.score >= 16
                              ? "Trung bình"
                              : "Thấp"}
                          </Tag>
                        </Descriptions.Item>

                        {expandedGroups[tempMatching._id] && (
                          <>
                            <Descriptions.Item label="Email">
                              {topMentor.email || "N/A"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chuyên môn">
                              {topMentor.specialties.map((s) => (
                                <span
                                  key={s.specialtyId}
                                  style={{
                                    color: specialtiesInfo.some(
                                      (spec) => spec._id === s.specialtyId
                                    )
                                      ? "green"
                                      : "black",
                                    marginRight: 3,
                                  }}
                                >
                                  {s.name} [{s.proficiencyLevel}/5]
                                  {topMentor.specialties.indexOf(s) !==
                                  topMentor.specialties.length - 1
                                    ? ", "
                                    : ""}
                                </span>
                              )) || "N/A"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tình trạng nhóm">
                              <Tag
                                color={
                                  topMentor.isPreferredGroup
                                    ? "green"
                                    : "default"
                                }
                              >
                                {topMentor.isPreferredGroup
                                  ? "Mentor đã chọn nhóm này"
                                  : "Mentor chưa chọn nhóm này"}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nhóm đã nhận">
                              {topMentor.currentLoad} / {topMentor.maxLoad}
                            </Descriptions.Item>
                          </>
                        )}
                      </Descriptions>

                      <Button
                        type="link"
                        onClick={() => toggleDetails(tempMatching._id)}
                      >
                        {expandedGroups[tempMatching._id]
                          ? "Thu gọn"
                          : "Xem thêm thông tin"}
                      </Button>
                    </Card>
                  ) : (
                    <Card
                      type="inner"
                      size="small"
                      style={{ marginBottom: 16 }}
                    >
                      <Text>
                        <em>Chưa tìm thấy người hướng dẫn phù hợp</em>
                      </Text>
                    </Card>
                  )}

                  <Row gutter={[16, 16]}>
                    <Col>
                      <Button
                        type="primary"
                        onClick={() =>
                          handleClickViewTemporaryMatching(tempMatching)
                        }
                      >
                        Chọn Mentor khác
                      </Button>
                    </Col>
                    <Col>
                      <Button
                        type="default"
                        onClick={() => handleGroupDetailClick(groupInfo._id)}
                      >
                        Chi tiết nhóm
                      </Button>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </List.Item>
          );
        }}
      />

      <Pagination
        current={pageNo}
        total={total}
        pageSize={3}
        onChange={(page) => setPageNo(page)}
        style={{ textAlign: "center", marginTop: "16px" }}
      />

      <Modal
        title={
          <Space direction="vertical">
            <Row align="middle">
              <Title level={4} style={{ margin: 0 }}>
                {projectInfo?.name || "N/A"}
              </Title>
              <Tooltip
                color="#fff"
                title={
                  <div style={{ color: "#000" }}>
                    <p>
                      <strong>Lĩnh vực:</strong> Màu xanh nếu lĩnh vực của
                      mentor và nhóm trùng nhau.
                    </p>
                    <p>
                      <strong>Chuyên môn:</strong>

                      <p style={{ marginLeft: 8, marginTop: -1 }}>
                        Màu xanh nếu chuyên môn của mentor và nhóm trùng nhau.
                      </p>
                      <p style={{ marginLeft: 8, marginTop: -8 }}>
                        Mục (Số/5) là chỉ mức độ thành thạo chuyên của mentor
                        trên thang điểm 5.
                      </p>
                    </p>
                    <p>
                      <strong>Chuyên môn:</strong> Mục [Số/5] là chỉ mức độ
                      thành thạo chuyên của mentor trên thang điểm 5.
                    </p>
                    <p>
                      <strong>Nhóm đã nhận:</strong> Hiển thị số nhóm mà mentor
                      đã nhận.
                    </p>
                    <p>
                      <strong>Mentor đã chọn nhóm này:</strong> Hiển thị khi
                      mentor đã chọn nhóm này là nhóm yêu thích.
                    </p>
                    <p>
                      <strong>Mức độ phù hợp:</strong> Điểm số đánh giá mức độ
                      phù hợp của mentor với nhóm.
                    </p>
                  </div>
                }
              >
                <InfoCircleOutlined
                  style={{
                    marginLeft: 10,
                    color: "#1890ff",
                    cursor: "pointer",
                  }}
                />
              </Tooltip>
            </Row>
            <Text>
              <strong>Lĩnh vực:</strong> {professionInfo?.name || "N/A"}
            </Text>
            <Text>
              <strong>Chuyên môn cần hỗ trợ:</strong>{" "}
              {specialtiesInfo?.map((s) => s.name).join(", ") || "N/A"}
            </Text>
          </Space>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="Tìm kiếm Mentor"
            onSearch={(value) => setMentorSearch(value)}
            style={{ width: 300 }}
            allowClear
          />
        </Space>
        <List
          dataSource={paginatedMentors}
          renderItem={(mentor) => {
            const isCurrentMentor = currentMentor?.mentorId === mentor.mentorId;

            const professionMatched = mentor.professions.some(
              (p) => p.professionId === professionInfo._id
            );
            const specialtiesMatched = mentor.specialties.filter((s) =>
              specialtiesInfo.some((spec) => spec._id === s.specialtyId)
            );

            return (
              <List.Item key={mentor.mentorId}>
                <Card
                  style={{
                    width: "100%",
                    backgroundColor: mentor.isPreferredGroup
                      ? "#e6f7ff"
                      : "white",
                    borderColor: isCurrentMentor ? "#1890ff" : "#f0f0f0",
                  }}
                >
                  <Row>
                    <Col span={18}>
                      <Title level={5}>{mentor.username || "N/A"}</Title>
                      <Text>
                        <strong>Email:</strong> {mentor.email || "N/A"}
                      </Text>
                      <br /> <strong>Lĩnh vực:</strong>{" "}
                      <Text
                        style={{ color: professionMatched ? "green" : "black" }}
                      >
                        {mentor.professions?.map((s) => s.name).join(", ") ||
                          "N/A"}
                      </Text>
                      <br />
                      <Text>
                        <strong>Chuyên môn:</strong>{" "}
                        {mentor.specialties.map((s) => {
                          return (
                            <span
                              key={s.specialtyId}
                              style={{
                                color: specialtiesMatched.some(
                                  (spec) => spec.specialtyId === s.specialtyId
                                )
                                  ? "green"
                                  : "black",
                                marginRight: 3,
                              }}
                            >
                              {s.name} [{s.proficiencyLevel}/5]
                              {mentor.specialties.indexOf(s) !==
                              mentor.specialties.length - 1
                                ? ", "
                                : ""}
                            </span>
                          );
                        }) || "N/A"}
                      </Text>
                      <br />
                      <Text>
                        <strong>Mức độ phù hợp:</strong>{" "}
                        <Tag
                          color={
                            mentor.score >= 46
                              ? "blue"
                              : mentor.score >= 36
                              ? "green"
                              : mentor.score >= 26
                              ? "lime"
                              : mentor.score >= 16
                              ? "orange"
                              : "red"
                          }
                        >
                          {mentor.score >= 46
                            ? "Hoàn toàn phù hợp"
                            : mentor.score >= 36
                            ? "Rất cao"
                            : mentor.score >= 26
                            ? "Cao"
                            : mentor.score >= 16
                            ? "Trung bình"
                            : "Thấp"}
                        </Tag>
                      </Text>
                      <br />
                      <Text>
                        <strong>Nhóm đã nhận:</strong> {mentor.currentLoad} /{" "}
                        {mentor.maxLoad}
                      </Text>
                      <br />
                      {mentor.isPreferredGroup && (
                        <Tag style={{ marginTop: 8 }} color="green">
                          Mentor đã chọn nhóm này
                        </Tag>
                      )}
                    </Col>
                    <Col span={6} style={{ textAlign: "right" }}>
                      {!isCurrentMentor && (
                        <Button
                          type="primary"
                          onClick={() => handleSelectMentor(mentor)}
                        >
                          Chọn
                        </Button>
                      )}
                      {isCurrentMentor && (
                        <Tag color="blue">Mentor này đang được chọn</Tag>
                      )}
                    </Col>
                  </Row>
                </Card>
              </List.Item>
            );
          }}
        />
        <Pagination
          current={mentorPageNo}
          total={filteredMentors.length}
          pageSize={mentorPageSize}
          onChange={(page) => setMentorPageNo(page)}
          style={{ textAlign: "center", marginTop: "16px" }}
        />
      </Modal>
    </>
  );
};

export default ViewGroups;
