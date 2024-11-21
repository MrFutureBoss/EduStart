import React, { useEffect, useState } from "react";
import {
  Tag,
  Input,
  Button,
  Form,
  message,
  Spin,
  Row,
  Col,
  Tooltip,
  Divider,
  Card,
  Badge,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import CustomModal from "../../components/Modal/LargeModal";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";

const { CheckableTag } = Tag;

const ProjectUpdateModal = ({
  show,
  onHide,
  projectData,
  onUpdateSuccess,
  isUpdating,
}) => {
  const [form] = Form.useForm();
  const [professions, setProfessions] = useState([]);
  const [filteredProfessions, setFilteredProfessions] = useState([]);
  const [selectedProfessions, setSelectedProfessions] = useState([]);
  const [specialtiesMap, setSpecialtiesMap] = useState({});
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
        };
        const res = await axios.get(`${BASE_URL}/profession/get-all`, config);
        setProfessions(res.data);
        setFilteredProfessions(res.data);

        const professionNameToIdMap = {};
        const specialtyMap = {};

        res.data.forEach((prof) => {
          professionNameToIdMap[prof.name] = prof._id;
          specialtyMap[prof._id] = prof.specialty;
        });

        setSpecialtiesMap(specialtyMap);

        if (projectData && projectData.professionDetails) {
          const selectedProfIds = projectData.professionDetails
            .map((profName) => professionNameToIdMap[profName])
            .filter((id) => id);

          setSelectedProfessions(selectedProfIds);
        }

        if (projectData && projectData.specialtyDetails) {
          const selectedSpecIds = projectData.specialtyDetails
            .flatMap(
              (specName) =>
                Object.values(specialtyMap)
                  .flat()
                  .find((spec) => spec.name === specName)?._id
            )
            .filter((id) => id);

          setSelectedSpecialties(selectedSpecIds);
        }

        form.setFieldsValue({
          name: projectData.project?.name || "",
          description: projectData.project?.description || "",
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching professions:", error);
        message.error("Lỗi khi tải dữ liệu ngành nghề.");
        setIsLoading(false);
      }
    };

    fetchProfessions();
  }, [projectData, form]);

  const handleProfessionChange = (professionId, checked) => {
    let nextSelectedProfessions = [...selectedProfessions];
    if (checked) {
      if (nextSelectedProfessions.length >= 2) {
        message.warning("Bạn chỉ có thể chọn tối đa 2 ngành nghề.");
        return;
      }
      nextSelectedProfessions.push(professionId);
    } else {
      nextSelectedProfessions = nextSelectedProfessions.filter(
        (id) => id !== professionId
      );

      const specsToRemove =
        specialtiesMap[professionId]?.map((spec) => spec._id) || [];
      setSelectedSpecialties((prevSpecs) =>
        prevSpecs.filter((specId) => !specsToRemove.includes(specId))
      );
    }
    setSelectedProfessions(nextSelectedProfessions);
  };

  const handleSpecialtyChange = (specId, checked) => {
    let nextSelectedSpecialties = [...selectedSpecialties];
    if (checked) {
      nextSelectedSpecialties.push(specId);
    } else {
      nextSelectedSpecialties = nextSelectedSpecialties.filter(
        (id) => id !== specId
      );
    }
    setSelectedSpecialties(nextSelectedSpecialties);
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTerm(searchTerm);
    setFilteredProfessions(
      professions.filter((prof) => prof.name.toLowerCase().includes(searchTerm))
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (selectedProfessions.length === 0) {
        message.error("Vui lòng chọn ít nhất một ngành nghề!");
        return;
      }

      if (selectedSpecialties.length === 0) {
        message.error("Vui lòng chọn ít nhất một chuyên môn!");
        return;
      }

      const professionId = selectedProfessions;
      const specialtyIds = selectedSpecialties;

      const payload = {
        name: values.name,
        description: values.description,
        professionId: professionId,
        specialtyIds: specialtyIds,
      };

      const apiUrl = isUpdating
        ? `${BASE_URL}/project/${projectData._id}/revise_project`
        : `${BASE_URL}/project/${projectData._id}/update_project`;

      const jwt = localStorage.getItem("jwt");
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      };

      if (isUpdating) {
        await axios.patch(apiUrl, payload, config);
      } else {
        await axios.put(apiUrl, payload, config);
      }

      message.success("Cập nhật dự án thành công!");
      onUpdateSuccess();
    } catch (error) {
      console.error("Error updating project:", error);
      message.error("Lỗi khi cập nhật dự án.");
    }
  };

  return (
    <CustomModal
      show={show}
      onHide={onHide}
      title={isUpdating ? "Sửa Lại Dự Án" : "Cập Nhật Dự Án"}
      content={
        <div style={{ width: "730px", maxWidth: "100%" }}>
          {isLoading ? (
            <Spin tip="Đang tải dữ liệu..." />
          ) : (
            <Form form={form} layout="vertical">
              <Form.Item
                label="Tên Dự Án"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên dự án!" },
                ]}
              >
                <Input placeholder="Nhập tên dự án" />
              </Form.Item>

              <Form.Item
                label="Mô Tả Dự Án"
                name="description"
                rules={[
                  { required: true, message: "Vui lòng nhập mô tả dự án!" },
                ]}
              >
                <Input.TextArea placeholder="Nhập mô tả dự án" rows={4} />
              </Form.Item>

              <Divider orientation="left">
                Lĩnh Vực{" "}
                <Badge
                  count={filteredProfessions.length}
                  style={{
                    backgroundColor: "#52c41a",
                    marginLeft: "1px",
                    top: -8,
                    transform: "scale(0.9)",
                  }}
                />
              </Divider>

              <Form.Item>
                <Input
                  placeholder="Tìm kiếm lĩnh vực..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={handleSearch}
                  style={{ borderRadius: "6px" }}
                />
              </Form.Item>

              <Card bordered={false} style={{ backgroundColor: "#fafafa" }}>
                <Row gutter={[8, 8]}>
                  {filteredProfessions.map((prof) => (
                    <Col key={prof._id}>
                      <Tooltip title={prof.description || prof.name}>
                        <CheckableTag
                          checked={selectedProfessions.includes(prof._id)}
                          onChange={(checked) =>
                            handleProfessionChange(prof._id, checked)
                          }
                          style={{
                            borderRadius: "6px",
                            padding: "8px 12px",
                            fontSize: "14px",
                            cursor: "pointer",
                            backgroundColor: selectedProfessions.includes(
                              prof._id
                            )
                              ? "#cceeff"
                              : "#f5f5f5",
                            borderColor: selectedProfessions.includes(prof._id)
                              ? "#40a9ff"
                              : "transparent",
                            color: selectedProfessions.includes(prof._id)
                              ? "#096dd9"
                              : "#595959",
                            transition: "all 0.3s",
                          }}
                        >
                          {selectedProfessions.includes(prof._id) ? (
                            <CheckCircleOutlined
                              style={{ marginRight: "4px" }}
                            />
                          ) : (
                            <CloseCircleOutlined
                              style={{ marginRight: "4px" }}
                            />
                          )}
                          {prof.name}
                          {selectedProfessions.includes(prof._id) && (
                            <Badge
                              count={
                                selectedSpecialties.filter((specId) =>
                                  specialtiesMap[prof._id]?.some(
                                    (spec) => spec._id === specId
                                  )
                                ).length
                              }
                              style={{
                                backgroundColor: "#108ee9",
                                marginLeft: "-2px",
                                top: -7,
                                transform: "scale(0.8)",
                              }}
                            />
                          )}
                        </CheckableTag>
                      </Tooltip>
                    </Col>
                  ))}
                </Row>
              </Card>

              {selectedProfessions.length > 0 && (
                <>
                  <Divider orientation="left">Chuyên Môn</Divider>
                  {selectedProfessions.map((profId) => (
                    <Card
                      key={profId}
                      title={
                        professions.find((prof) => prof._id === profId)?.name
                      }
                      bordered={false}
                      style={{
                        marginBottom: "16px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Row gutter={[8, 8]}>
                        {specialtiesMap[profId]?.map((spec) => (
                          <Col key={spec._id}>
                            <Tooltip title={spec.name}>
                              <CheckableTag
                                checked={selectedSpecialties.includes(spec._id)}
                                onChange={(checked) =>
                                  handleSpecialtyChange(spec._id, checked)
                                }
                                style={{
                                  borderRadius: "6px",
                                  padding: "6px 10px",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                  backgroundColor: selectedSpecialties.includes(
                                    spec._id
                                  )
                                    ? "#e6f7e6"
                                    : "#f5f5f5",
                                  borderColor: selectedSpecialties.includes(
                                    spec._id
                                  )
                                    ? "#52c41a"
                                    : "transparent",
                                  color: selectedSpecialties.includes(spec._id)
                                    ? "#389e0d"
                                    : "#595959",
                                  transition: "all 0.3s",
                                }}
                              >
                                {spec.name}
                              </CheckableTag>
                            </Tooltip>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  ))}
                </>
              )}
            </Form>
          )}
        </div>
      }
      footer={
        <Button type="primary" onClick={handleSubmit}>
          Lưu Thay Đổi
        </Button>
      }
    />
  );
};

export default ProjectUpdateModal;
