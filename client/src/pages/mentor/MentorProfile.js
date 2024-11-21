import React, { useState, useEffect } from "react";
import {
  Form,
  Select,
  InputNumber,
  Button,
  Card,
  List,
  Typography,
  Divider,
  Row,
  Col,
  notification,
  Descriptions,
  Space,
  Avatar,
  Tag,
} from "antd";
import axios from "axios";
import { getAllProfesionAndSpeciatly, getMentorProfile } from "../../api";
import { UserOutlined } from "@ant-design/icons";
import AdminHeader from "../../layouts/admin/AdminHeader";
import ConfirmButton from "../../components/Button/ConfirmButton";
import CustomButton from "../../components/Button/Button";
import CancelButton from "../../components/Button/CancelButton";
import { BASE_URL } from "../../utilities/initalValue";
import { useLocation } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;

const MentorProfile = () => {
  const [mentorData, setMentorData] = useState(null);
  const [professionsList, setProfessionsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [maxLoad, setMaxLoad] = useState(0);
  const [currentProfession, setCurrentProfession] = useState(null);
  const [currentSpecialties, setCurrentSpecialties] = useState([]);
  const [isChanged, setIsChanged] = useState(false);
  const mentorId = localStorage.getItem("userId");
  const location = useLocation();
  const fromWarning = location.state?.fromWarning || false;

  useEffect(() => {
    fetchMentorProfile();
    fetchProfessions();
  }, []);

  const fetchMentorProfile = async () => {
    try {
      const response = await getMentorProfile(mentorId);
      setMentorData(response.data);
      setMaxLoad(response.data.maxLoad || 0);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể tải thông tin mentor.",
      });
    }
  };

  useEffect(() => {
    if (fromWarning) {
      setIsEditing(true);
    }
  }, [fromWarning]);

  const fetchProfessions = async () => {
    try {
      const response = await getAllProfesionAndSpeciatly();
      setProfessionsList(response.data);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể tải danh sách professions.",
      });
    }
  };

  const mapSelectedData = () => {
    if (!mentorData || professionsList.length === 0) return [];

    return professionsList
      .filter((profession) => mentorData.professions.includes(profession.name))
      .map((profession) => ({
        profession: profession.name,
        specialties: profession.specialty.filter((specialty) =>
          mentorData.specialties.some(
            (mentorSpecialty) => mentorSpecialty.name === specialty.name
          )
        ),
      }));
  };

  const selectedData = mapSelectedData();

  const addSelection = () => {
    if (!currentProfession || currentSpecialties.length === 0) {
      notification.warning({
        message: "Cảnh báo",
        description: "Vui lòng chọn Profession và Specialty.",
      });
      return;
    }

    if (selectedData.some((data) => data.profession === currentProfession)) {
      notification.warning({
        message: "Cảnh báo",
        description: "Profession này đã được chọn.",
      });
      return;
    }

    const updatedSpecialties = [
      ...selectedData,
      {
        profession: currentProfession,
        specialties: currentSpecialties.map((name) => ({ name })),
      },
    ];

    setMentorData({
      ...mentorData,
      professions: updatedSpecialties.map((item) => item.profession),
      specialties: updatedSpecialties.flatMap((item) =>
        item.specialties.map((spec) => ({
          name: spec.name,
          profession: item.profession,
        }))
      ),
    });

    setCurrentProfession(null);
    setCurrentSpecialties([]);
    setIsChanged(true);
  };

  const removeProfession = (professionName) => {
    const updatedData = selectedData.filter(
      (data) => data.profession !== professionName
    );

    setMentorData({
      ...mentorData,
      professions: updatedData.map((item) => item.profession),
      specialties: updatedData.flatMap((item) =>
        item.specialties.map((spec) => ({
          name: spec.name,
          profession: item.profession,
        }))
      ),
    });
    setIsChanged(true);
  };

  const handleMaxLoadChange = (value) => {
    setMaxLoad(value);
    setIsChanged(true); // Đánh dấu đã thay đổi
  };

  const handleUpdate = async () => {
    if (maxLoad === 0) {
      notification.warning({
        message: "Cảnh báo",
        description:
          "Số nhóm đăng ký không được là 0. Vui lòng nhập số hợp lệ.",
      });
      return;
    }
    try {
      const updateData = {
        maxLoad,
        professions: mentorData.professions.map((profession) => {
          const prof = professionsList.find((p) => p.name === profession);
          return prof ? prof._id : null; // Trả về ObjectId
        }),
        specialties: mentorData.specialties.map((specialty) => {
          const prof = professionsList.find((p) =>
            p.specialty.some((s) => s.name === specialty.name)
          );
          if (!prof) return null;

          const spec = prof.specialty.find((s) => s.name === specialty.name);
          return {
            specialtyId: spec._id, // Trả về ObjectId
            proficiencyLevel: specialty.proficiencyLevel,
          };
        }),
      };

      await axios.post(`${BASE_URL}/mentor/update/${mentorId}`, updateData);
      notification.success({
        message: "Thành công",
        description: "Cập nhật thành công!",
      });
      fetchMentorProfile();
      setIsChanged(false);
      setIsEditing(false);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Cập nhật không thành công.",
      });
    }
  };

  const handleCancelEdit = () => {
    fetchMentorProfile();
    setIsChanged(false);
    setIsEditing(false);
  };

  const availableProfessions = professionsList.filter(
    (profession) =>
      !selectedData.some((selected) => selected.profession === profession.name)
  );

  return (
    <div>
      <AdminHeader content="Thông tin người dùng" />
      <Card
        bordered={false}
        style={{
          maxWidth: 1200,
          margin: "auto",
          marginTop: 20,
          backgroundColor: "#f9f9f9",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          borderRadius: 10,
        }}
      >
        <Row gutter={[24, 24]}>
          {/* Thông Tin Mentor */}
          <Col xs={24} md={10}>
            <Card bordered style={{ borderRadius: 10 }}>
              <Space size="large" align="center" style={{ display: "flex" }}>
                <Avatar
                  size={45}
                  style={{
                    backgroundColor: "#62b6cb",
                    color: "#fff",
                    fontSize: "18px",
                  }}
                >
                  {mentorData?.username
                    ? mentorData.username
                        .split(" ")
                        .pop()
                        .charAt(0)
                        .toUpperCase()
                    : "?"}
                </Avatar>

                <Space direction="vertical">
                  <Title level={4} style={{ margin: 0 }}>
                    {mentorData?.username || "Đang tải..."}
                  </Title>
                  <Text type="secondary">Mentor</Text>
                </Space>
              </Space>
              <Divider />
              {mentorData ? (
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Email">
                    {mentorData.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {mentorData.phoneNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số nhóm đăng ký">
                    {isEditing ? (
                      <InputNumber
                        min={0}
                        max={100}
                        value={maxLoad}
                        onChange={handleMaxLoadChange}
                      />
                    ) : (
                      mentorData.maxLoad
                    )}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Text>Đang tải...</Text>
              )}
              {!isEditing && (
                <CustomButton
                  style={{ marginTop: 20 }}
                  onClick={() => setIsEditing(true)}
                  content=" Cập nhật"
                />
              )}
            </Card>
          </Col>
          {/* Profession và Specialty */}
          <Col xs={24} md={14}>
            <Card
              bordered
              style={{
                borderRadius: 10,
                background: "white",
              }}
              title={
                <Title level={5} style={{ margin: 0 }}>
                  {isEditing ? "Cập Nhật Chuyên Môn" : "Lĩnh Vực Và Chuyên Môn"}
                </Title>
              }
            >
              {!isEditing ? (
                <List
                  header={<b style={{ fontSize: "14px" }}>Danh sách đã chọn</b>}
                  bordered
                  dataSource={selectedData}
                  renderItem={(item) => (
                    <List.Item>
                      <div>
                        <b style={{ fontSize: "13px" }}>{item.profession}</b>
                        <div style={{ marginTop: 8 }}>
                          {item.specialties.map((spec) => (
                            <Tag
                              key={spec.name}
                              style={{
                                marginBottom: 4,
                                borderRadius: 5,
                                padding: "0 8px",
                                backgroundColor: "rgb(173 238 255 / 45%)",
                                borderColor: "rgb(26 144 174)",
                                color: "rgb(0 125 157)",
                              }}
                            >
                              {spec.name}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <>
                  <Form layout="vertical">
                    <Form.Item label="Chọn Lĩnh Vực">
                      <Select
                        showSearch // Thêm tính năng tìm kiếm
                        placeholder="Chọn lĩnh vực"
                        value={currentProfession}
                        onChange={(value) => {
                          setCurrentProfession(value);
                          setCurrentSpecialties([]);
                        }}
                        allowClear
                        style={{ width: "100%" }}
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        } // Tìm kiếm không phân biệt chữ hoa chữ thường
                      >
                        {availableProfessions.map((prof) => (
                          <Option key={prof.name} value={prof.name}>
                            {prof.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {currentProfession && (
                      <Form.Item label="Chọn Chuyên Môn">
                        <Select
                          mode="multiple"
                          showSearch // Thêm tính năng tìm kiếm
                          placeholder="Chọn chuyên môn"
                          value={currentSpecialties}
                          onChange={(value) => setCurrentSpecialties(value)}
                          allowClear
                          style={{ width: "100%" }}
                          filterOption={(input, option) =>
                            option.children
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          } // Tìm kiếm không phân biệt chữ hoa chữ thường
                        >
                          {professionsList
                            .find((prof) => prof.name === currentProfession)
                            ?.specialty.map((specialty) => (
                              <Option
                                key={specialty.name}
                                value={specialty.name}
                              >
                                {specialty.name}
                              </Option>
                            ))}
                        </Select>
                      </Form.Item>
                    )}

                    {currentProfession && currentSpecialties.length > 0 && (
                      <ConfirmButton
                        onClick={addSelection}
                        style={{ marginBottom: 20 }}
                        content={" Thêm vào danh sách"}
                      />
                    )}
                  </Form>

                  <List
                    header={<b>Danh sách đã chọn</b>}
                    bordered
                    dataSource={selectedData}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Button
                            type="link"
                            danger
                            onClick={() => removeProfession(item.profession)}
                          >
                            Xóa
                          </Button>,
                        ]}
                      >
                        <div>
                          <b>{item.profession}</b>
                          <div style={{ marginTop: 8 }}>
                            {item.specialties.map((spec) => (
                              <Tag
                                color="blue"
                                key={spec.name}
                                style={{
                                  marginBottom: 4,
                                  borderRadius: 5,
                                  padding: "0 8px",
                                  backgroundColor: "#e6f7e6",
                                  borderColor: "#52c41a",
                                  color: "#389e0d",
                                }}
                              >
                                {spec.name}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />

                  <Space>
                    {isChanged && (
                      <ConfirmButton
                        onClick={handleUpdate}
                        content="Lưu Thay Đổi"
                        style={{ marginTop: 20 }}
                      />
                    )}
                    <CancelButton
                      style={{ marginTop: 20 }}
                      onClick={handleCancelEdit}
                      content="Huỷ"
                    />
                  </Space>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default MentorProfile;
