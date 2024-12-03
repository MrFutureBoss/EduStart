import React, { useState, useEffect, useMemo } from "react";
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
import { ExclamationCircleOutlined, UserOutlined } from "@ant-design/icons";
import AdminHeader from "../../layouts/admin/AdminHeader";
import ConfirmButton from "../../components/Button/ConfirmButton";
import CustomButton from "../../components/Button/Button";
import CancelButton from "../../components/Button/CancelButton";
import { BASE_URL } from "../../utilities/initalValue";
import { useLocation } from "react-router-dom";
import confirm from "antd/es/modal/confirm";

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
  const [matchedGroups, setMatchedGroups] = useState([]);
  console.log("matchedGroups", matchedGroups);

  const jwt = localStorage.getItem("jwt");
  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const groupResponse = await axios.get(
          `${BASE_URL}/matched/mentor/${mentorId}`,
          config
        );
        setMatchedGroups(groupResponse.data?.groups || []);
      } catch (error) {
        console.error(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [config, mentorId]);

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

    return mentorData.professions.map((professionName) => {
      const profession = professionsList.find(
        (prof) => prof.name === professionName
      );
      const specialties = mentorData.specialties
        .filter((spec) => spec.profession === professionName)
        .map((spec) => {
          return profession.specialty.find((s) => s.name === spec.name);
        })
        .filter((spec) => spec !== undefined);

      return {
        profession: professionName,
        specialties,
      };
    });
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

    const isFirstUpdate = mentorData.professions.length === 0;

    const proceedWithAdd = () => {
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

    if (isFirstUpdate) {
      confirm({
        title: "Xác nhận cập nhật",
        icon: <ExclamationCircleOutlined />,
        content:
          "Bạn có chắc chắn với các lựa chọn Lĩnh vực và Chuyên môn của mình hay không? Sau khi bạn chấp nhận trong trường hợp có nhóm chọn Lĩnh vực và Chuyên môn đó thì bạn sẽ không thể xoá đi!",
        onOk() {
          proceedWithAdd();
        },
        onCancel() {
          // Không làm gì khi hủy
        },
      });
    } else {
      proceedWithAdd();
    }
  };

  const isSpecialtyUsed = (specialtyName) => {
    return matchedGroups.some((group) =>
      group.projectCategory?.specialties?.some(
        (spec) => spec.name === specialtyName
      )
    );
  };

  const removeProfession = (professionName) => {
    // Kiểm tra điều kiện để cho phép xóa
    if (matchedGroups.length > 0) {
      const relatedGroups = matchedGroups.filter((group) =>
        group.projectCategory.profession.some(
          (prof) => prof.name === professionName
        )
      );

      const allRejected = relatedGroups.every(
        (group) => group.matchedDetails.status === "Rejected"
      );

      if (!allRejected) {
        notification.warning({
          message: "Cảnh báo",
          description:
            "Không thể xóa Lĩnh vực này vì có nhóm liên quan đã được ghép với bạn!",
        });
        return;
      }
    }

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
        professions: mentorData.professions
          .map((profession) => {
            const prof = professionsList.find((p) => p.name === profession);
            return prof ? prof._id : null; // Return ObjectId
          })
          .filter((id) => id !== null), // Remove null values
        specialties: mentorData.specialties
          .map((specialty) => {
            const prof = professionsList.find((p) =>
              p.specialty.some((s) => s.name === specialty.name)
            );
            if (!prof) return null;

            const spec = prof.specialty.find((s) => s.name === specialty.name);
            return spec ? { specialtyId: spec._id } : null; // Return ObjectId
          })
          .filter((spec) => spec !== null), // Remove null values
      };

      console.log("Update Data:", updateData); // Log the data being sent

      await axios.post(`${BASE_URL}/mentor/update/${mentorId}`, updateData);
      notification.success({
        message: "Thành công",
        description: "Cập nhật thành công!",
      });
      fetchMentorProfile();
      setIsChanged(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Update failed:", error.response || error);
      notification.error({
        message: "Lỗi",
        description: "Cập nhật không thành công.",
      });
    }
  };
  console.log(mentorData);

  const handleDeleteSpecialty = (professionName, specialtyName) => {
    confirm({
      title: "Xác nhận xóa Chuyên Môn",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa Chuyên môn "${specialtyName}" trong Lĩnh vực "${professionName}" không?`,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk() {
        // Cập nhật dữ liệu tạm thời khi xóa chuyên môn
        const updatedSpecialties = mentorData.specialties.filter(
          (spec) =>
            !(spec.name === specialtyName && spec.profession === professionName)
        );

        // Kiểm tra nếu profession còn specialty nào không
        const hasSpecialties = updatedSpecialties.some(
          (spec) => spec.profession === professionName
        );

        let updatedProfessions = mentorData.professions;
        if (!hasSpecialties) {
          // Nếu không còn specialty nào, xóa profession
          updatedProfessions = mentorData.professions.filter(
            (prof) => prof !== professionName
          );
        }

        setMentorData({
          ...mentorData,
          professions: updatedProfessions,
          specialties: updatedSpecialties,
        });

        setIsChanged(true);
      },
      onCancel() {
        // Không làm gì khi người dùng chọn "Hủy"
        notification.info({
          message: "Thông báo",
          description: `Bạn đã hủy xóa chuyên môn "${specialtyName}"`,
        });
      },
    });
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
                        max={15}
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
                  header={<b>Danh sách đã chọn</b>}
                  bordered
                  dataSource={selectedData}
                  renderItem={(item) => {
                    let canDelete = true;

                    if (matchedGroups.length > 0) {
                      const relatedGroups = matchedGroups.filter(
                        (group) => group.profession === item.profession
                      );
                      canDelete = relatedGroups.every(
                        (group) => group.status === "Rejected"
                      );
                    }

                    return (
                      <List.Item
                        actions={[
                          isEditing && canDelete ? (
                            <Button
                              type="link"
                              danger
                              onClick={() => removeProfession(item.profession)}
                            >
                              Xóa
                            </Button>
                          ) : null,
                        ]}
                      >
                        <div>
                          <b>{item.profession}</b>
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
                    );
                  }}
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
                            {item.specialties.map((spec) => {
                              const canDelete =
                                isEditing && !isSpecialtyUsed(spec.name);
                              return (
                                <Tag
                                  key={spec.name}
                                  closable={canDelete}
                                  onClose={() =>
                                    canDelete &&
                                    handleDeleteSpecialty(
                                      item.profession,
                                      spec.name
                                    )
                                  }
                                  style={{
                                    marginBottom: 4,
                                    borderRadius: 5,
                                    padding: "0 8px",
                                    backgroundColor: canDelete
                                      ? "#e6f7e6"
                                      : "#f5f5f5",
                                    borderColor: canDelete
                                      ? "#52c41a"
                                      : "#d9d9d9",
                                    color: canDelete ? "#389e0d" : "#bfbfbf",
                                    cursor: canDelete
                                      ? "pointer"
                                      : "not-allowed",
                                  }}
                                >
                                  {spec.name}
                                </Tag>
                              );
                            })}
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
