import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Steps,
  DatePicker,
  Tooltip,
  Divider,
  List,
  Typography,
} from "antd";
import axios from "axios";
import calculateStartdateAndEnddateOfOutcomes from "./calculateStartdateAndEnddateOfOutcomes";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { setClassList } from "../../redux/slice/ClassSlice";
import { BASE_URL } from "../../utilities/initalValue";
import PropTypes from "prop-types";
import TableOutcome from "../class/TableOutcome";
import { SendOutlined } from "@ant-design/icons";
import Title from "antd/es/skeleton/Title";
const { Step } = Steps;
const { Text } = Typography;

const AssignOutcome = ({ onAssigned }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [form] = Form.useForm();
  const [outcomes, setOutcomes] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [activityExists, setActivityExists] = useState(false);
  const [semesterId, setSemesterId] = useState(null);

  const dispatch = useDispatch();
  const classList = useSelector((state) => state.class.classList);

  const jwt = localStorage.getItem("jwt");
  const config = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${jwt}` },
    }),
    [jwt]
  );

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
    if (classList?.length === 0) {
      fetchClasses();
    }
  }, [classList?.length, dispatch, jwt]);

  useEffect(() => {
    const fetchSemesterAndOutcomes = async () => {
      try {
        setLoading(true);
        const semesterResponse = await axios.get(
          `${BASE_URL}/semester/current`,
          config
        );
        console.log(semesterResponse.data);

        const fetchedSemester = semesterResponse.data;
        setSemester(fetchedSemester);
        setSemesterId(fetchedSemester._id);
        const outcomesResponse = await axios.get(
          `${BASE_URL}/activity/outcome-type/semester/${fetchedSemester._id}`,
          config
        );

        const sortedOutcomes = outcomesResponse.data.sort((a, b) => {
          const numberA = parseInt(a.name.replace(/[^0-9]/g, ""), 10);
          const numberB = parseInt(b.name.replace(/[^0-9]/g, ""), 10);
          return numberA - numberB;
        });

        const calculatedOutcomes = calculateStartdateAndEnddateOfOutcomes(
          fetchedSemester.startDate,
          fetchedSemester.endDate,
          sortedOutcomes.length
        );

        const updatedOutcomes = sortedOutcomes.map((outcome, index) => {
          const calculatedOutcome =
            calculatedOutcomes[`outcome${index + 1}`] || {};
          return {
            ...outcome,
            startDate: moment(
              calculatedOutcome.startDate || fetchedSemester.startDate
            ),
            endDate: moment(
              calculatedOutcome.endDate || fetchedSemester.endDate
            ),
          };
        });

        setOutcomes(updatedOutcomes);
      } catch (error) {
        message.error("Cannot fetch current semester or outcomes.");
      } finally {
        setLoading(false);
      }
    };

    fetchSemesterAndOutcomes();
  }, [config]);

  useEffect(() => {
    const checkActivityType = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const response = await axios.get(
          `${BASE_URL}/activity/user/${userId}?activityType=outcome`,
          config
        );

        setActivityExists(
          response.data &&
            response.data.activities &&
            Array.isArray(response.data.activities) &&
            response.data.activities.length > 0
        );
      } catch (error) {
        console.error("Error checking activity type:", error);
        setActivityExists(false);
      }
    };

    checkActivityType();
  }, [config]);

  const showModal = () => {
    if (classList.length === 0) {
      message.warning("No class to assign Outcome.");
      return;
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setCurrentStep(0);
  };

  const handleAssign = async () => {
    try {
      setAssignLoading(true);

      const classIds = classList.map((classItem) => classItem._id);
      if (classIds.length === 0) {
        message.error("No class to assign Outcome.");
        return;
      }

      const payloadOutcomes = outcomes.map((outcome) => ({
        outcomeId: outcome._id,
        startDate: outcome.startDate
          ? outcome.startDate.format("YYYY-MM-DD")
          : null,
        deadline: outcome.endDate ? outcome.endDate.format("YYYY-MM-DD") : null,
        description: outcome.description || "",
      }));

      const payload = {
        outcomes: payloadOutcomes,
        classIds,
        semesterId: semester._id,
      };

      const response = await axios.post(
        `${BASE_URL}/activity/assign-outcome`,
        payload,
        config
      );

      if (response.status === 201 || response.status === 207) {
        message.success(response.data.message);
        setActivityExists(true);

        if (onAssigned && typeof onAssigned === "function") {
          onAssigned();
        }
        handleCancel();
      }
    } catch (error) {
      console.error("Error assigning Outcome:", error);
      if (error.response && error.response.data) {
        message.error(`Error: ${error.response.data.message}`);
      } else {
        message.error("Error assigning Outcome.");
      }
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue(
      outcomes.reduce((acc, outcome, index) => {
        acc[`outcome-${index}-startDate`] = outcome.startDate;
        acc[`outcome-${index}-endDate`] = outcome.endDate;
        return acc;
      }, {})
    );
  }, [outcomes, form]);

  const next = () => {
    form
      .validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  if (loading) {
    return (
      <Spin size="large" tip="Loading semester and outcome information..." />
    );
  }

  return (
    <>
      {!activityExists ? (
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>Thông tin kỳ học hiện tại</Title>
          {semester && (
            <>
              <Text strong>Tên kỳ học:</Text> <Text>{semester.name}</Text>
              <br />
              <Text strong>Thời gian:</Text>{" "}
              <Text>
                {moment(semester.startDate).format("DD/MM/YYYY")} -{" "}
                {moment(semester.endDate).format("DD/MM/YYYY")}
              </Text>
              <Divider />
            </>
          )}
          <h5 style={{ fontWeight: 'bold' }}>Thời gian Outcome dự kiến</h5>
          <List
            bordered
            dataSource={outcomes}
            renderItem={(outcome) => (
              <List.Item>
                <Text strong>{outcome.name}</Text>:{" "}
                {outcome.startDate.format("DD/MM/YYYY")} -{" "}
                {outcome.endDate.format("DD/MM/YYYY")}
              </List.Item>
            )}
          />
          <Divider />
          <Tooltip title="Giao Outcome cho các lớp học">
            <Button type="primary" onClick={showModal} icon={<SendOutlined />}>
              Giao Outcome ngay!
            </Button>
          </Tooltip>
        </div>
      ) : (
        <TableOutcome classList={classList} semesterId={semesterId} />
      )}

      <Modal
        title="Giao outcome cho các lớp"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{}}
          onValuesChange={(changedValues) => {
            const updatedOutcomes = [...outcomes];

            outcomes.forEach((outcome, index) => {
              const descriptionKey = `outcome-${index}-description`;
              const startDateKey = `outcome-${index}-startDate`;
              const deadlineKey = `outcome-${index}-deadline`;

              if (changedValues[descriptionKey] !== undefined) {
                updatedOutcomes[index].description =
                  changedValues[descriptionKey];
              }

              if (changedValues[startDateKey] !== undefined) {
                updatedOutcomes[index].startDate =
                  changedValues[startDateKey].format("YYYY-MM-DD");
              }

              if (changedValues[deadlineKey] !== undefined) {
                updatedOutcomes[index].deadline =
                  changedValues[deadlineKey].format("YYYY-MM-DD");
              }
            });

            setOutcomes(updatedOutcomes);
          }}
        >
          <Steps current={currentStep}>
            {outcomes.map((outcome, index) => (
              <Step key={index} title={`${outcome.name}`} />
            ))}
          </Steps>

          <div style={{ marginTop: 24 }}>
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                style={{ display: currentStep === index ? "block" : "none" }}
              >
                <p style={{ fontWeight: "bold", color: "#40a9ff" }}>
                  Loại: {outcome.name}
                </p>

                <Form.Item
                  name={`outcome-${index}-description`}
                  label="Mô tả outcome (Optional)"
                >
                  <Input.TextArea
                    placeholder={`Thêm mô tả cho ${outcome.name}`}
                    onChange={(e) => {
                      const updatedOutcomes = [...outcomes];
                      updatedOutcomes[index].description = e.target.value;
                      setOutcomes(updatedOutcomes);
                    }}
                    rows={4}
                  />
                </Form.Item>

                <Form.Item
                  name={`outcome-${index}-startDate`}
                  label="Ngày bắt đầu"
                  initialValue={outcome.startDate}
                >
                  <DatePicker
                    value={outcome.startDate}
                    format="DD/MM/YYYY"
                    onChange={(date) => {
                      const updatedOutcomes = [...outcomes];
                      updatedOutcomes[index].startDate = date;
                      setOutcomes(updatedOutcomes);

                      // Cập nhật giá trị trong form
                      form.setFieldsValue({
                        [`outcome-${index}-startDate`]: date,
                      });
                    }}
                    style={{ width: "40%" }}
                  />
                </Form.Item>

                <Form.Item
                  name={`outcome-${index}-endDate`}
                  label="Ngày kết thúc"
                  initialValue={outcome.endDate}
                >
                  <DatePicker
                    value={outcome.endDate}
                    format="DD/MM/YYYY"
                    onChange={(date) => {
                      const updatedOutcomes = [...outcomes];
                      updatedOutcomes[index].endDate = date;
                      setOutcomes(updatedOutcomes);

                      // Cập nhật giá trị trong form
                      form.setFieldsValue({
                        [`outcome-${index}-endDate`]: date,
                      });
                    }}
                    style={{ width: "40%" }}
                  />
                </Form.Item>
              </div>
            ))}
          </div>

          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 24,
              }}
            >
              {currentStep > 0 && <Button onClick={prev}>Previous</Button>}
              {currentStep < outcomes.length - 1 ? (
                <Button type="primary" onClick={next}>
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleAssign}
                  loading={assignLoading}
                >
                  Submit
                </Button>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

AssignOutcome.propTypes = {
  onAssigned: PropTypes.func,
};

AssignOutcome.defaultProps = {
  onAssigned: () => {},
};

export default AssignOutcome;
