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

const { Step } = Steps;

const AssignOutcome = ({ onAssigned }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [form] = Form.useForm();
  const [outcomes, setOutcomes] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [activityExists, setActivityExists] = useState(false);
  const [hover, setHover] = useState(false);

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
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
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
    const fetchSemester = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/semester/current`,
          config
        );
        setSemester(response.data);
        const calculatedOutcomes = calculateStartdateAndEnddateOfOutcomes(
          response.data.startDate,
          response.data.endDate
        );

        const initializedOutcomes = [
          {
            ...calculatedOutcomes.outcome1,
            assignmentType: "outcome 1",
            deadline: calculatedOutcomes.outcome1.endDate,
            description: "",
          },
          {
            ...calculatedOutcomes.outcome2,
            assignmentType: "outcome 2",
            deadline: calculatedOutcomes.outcome2.endDate,
            description: "",
          },
          {
            ...calculatedOutcomes.outcome3,
            assignmentType: "outcome 3",
            deadline: calculatedOutcomes.outcome3.endDate,
            description: "",
          },
        ];
        setOutcomes(initializedOutcomes);
      } catch (error) {
        message.error("Không thể lấy thông tin kỳ học hiện tại.");
      } finally {
        setLoading(false);
      }
    };

    fetchSemester();
  }, [config]);

  useEffect(() => {
    const checkActivityType = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const response = await axios.get(
          `http://localhost:9999/activity/${userId}?activityType=outcome`,
          config
        );

        if (
          response.data &&
          response.data.activities &&
          Array.isArray(response.data.activities) &&
          response.data.activities.length > 0
        ) {
          setActivityExists(true);
        } else {
          setActivityExists(false);
        }
      } catch (error) {
        console.error("Error checking activity type:", error);
        setActivityExists(false);
      }
    };

    checkActivityType();
  }, [config]);

  const showModal = () => {
    if (classList.length === 0) {
      message.warning("Không có lớp nào để giao Outcome.");
      return;
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setCurrentStep(0);
    if (semester) {
      const recalculatedOutcomes = calculateStartdateAndEnddateOfOutcomes(
        semester.startDate,
        semester.endDate
      );
      const resetOutcomes = [
        {
          ...recalculatedOutcomes.outcome1,
          assignmentType: "outcome 1",
          deadline: recalculatedOutcomes.outcome1.endDate,
          description: "",
        },
        {
          ...recalculatedOutcomes.outcome2,
          assignmentType: "outcome 2",
          deadline: recalculatedOutcomes.outcome2.endDate,
          description: "",
        },
        {
          ...recalculatedOutcomes.outcome3,
          assignmentType: "outcome 3",
          deadline: recalculatedOutcomes.outcome3.endDate,
          description: "",
        },
      ];
      setOutcomes(resetOutcomes);
    }
  };

  const handleAssign = async () => {
    try {
      setAssignLoading(true);

      const classIds = classList.map((classItem) => classItem._id);
      if (classIds.length === 0) {
        message.error("Không có lớp nào để giao Outcome.");
        return;
      }

      const payloadOutcomes = outcomes.map((outcome) => ({
        assignmentType: outcome.assignmentType,
        startDate: outcome.startDate,
        deadline: outcome.deadline,
        description: outcome.description,
      }));

      const payload = {
        outcomes: payloadOutcomes,
        classIds,
      };

      const response = await axios.post(
        `${BASE_URL}/Activity/assign-outcome`,
        payload,
        config
      );

      if (response.status === 201 || response.status === 207) {
        message.success(response.data.message);

        // Set activityExists to true to trigger the display of TableOutcome
        setActivityExists(true);

        if (onAssigned && typeof onAssigned === "function") {
          onAssigned();
        }
        handleCancel();
      }
    } catch (error) {
      console.error("Error assigning Outcome:", error);
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          message.error(`Đã xảy ra lỗi: ${error.response.data.message}`);
        } else {
          message.error("Đã xảy ra lỗi khi giao Outcome.");
        }
      } else if (error.request) {
        message.error("Không nhận được phản hồi từ máy chủ.");
      } else {
        message.error("Đã xảy ra lỗi khi thiết lập yêu cầu.");
      }
    } finally {
      setAssignLoading(false);
    }
  };

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
    return <Spin size="large" tip="Đang tải thông tin kỳ học..." />;
  }

  return (
    <>
      {!activityExists ? (
        <Tooltip title="Giao Outcome cho các lớp">
          <Button
            type="primary"
            onClick={showModal}
            icon={<SendOutlined />}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: hover ? "#45A049" : "#4CAF50",
              borderColor: hover ? "#45A049" : "#4CAF50",
              color: "#FFF",
              borderRadius: "8px",
              padding: "0 20px",
              cursor: "pointer",
            }}
          >
            Giao Outcome
          </Button>
        </Tooltip>
      ) : (
        <TableOutcome classList={classList} />
      )}

      <Modal
        title="Giao Outcome tới tất cả các lớp"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{}}
          onValuesChange={(changedValues, allValues) => {
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
              <Step key={index} title={`Outcome ${index + 1}`} />
            ))}
          </Steps>

          <div style={{ marginTop: 24 }}>
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                style={{ display: currentStep === index ? "block" : "none" }}
              >
                <p style={{ fontWeight: "bold", color: "#40a9ff" }}>
                  Giai đoạn: {outcome.assignmentType}
                </p>

                <Form.Item
                  name={`outcome-${index}-description`}
                  label="Mô tả Outcome (Tùy chọn)"
                  rules={[
                    {
                      max: 500,
                      message: "Mô tả không được vượt quá 500 ký tự!",
                    },
                  ]}
                >
                  <Input.TextArea
                    placeholder={`Nhập mô tả cho Outcome ${index + 1}`}
                    rows={4}
                  />
                </Form.Item>
                <div
                  style={{ display: "flex", justifyContent: "space-around" }}
                >
                  <Form.Item
                    name={`outcome-${index}-startDate`}
                    label="Ngày bắt đầu (Mặc định)"
                    initialValue={moment(outcome.startDate, "YYYY-MM-DD")}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ngày bắt đầu!",
                      },
                    ]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                      disabledDate={(currentDate) =>
                        currentDate && currentDate < moment().startOf("day")
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    name={`outcome-${index}-deadline`}
                    label="Deadline (Mặc định)"
                    initialValue={moment(outcome.deadline, "YYYY-MM-DD")}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn Deadline!",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const startDate = getFieldValue(
                            `outcome-${index}-startDate`
                          );
                          if (
                            value &&
                            startDate &&
                            value.isAfter(startDate, "day")
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject();
                        },
                      }),
                    ]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                      disabledDate={(currentDate) =>
                        currentDate && currentDate < moment().startOf("day")
                      }
                    />
                  </Form.Item>
                </div>
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
              {currentStep > 0 && (
                <Button
                  onClick={prev}
                  style={{ backgroundColor: "#ffc53d", borderColor: "#ffc53d" }}
                >
                  Previous
                </Button>
              )}
              {currentStep < outcomes.length - 1 && (
                <Button
                  type="primary"
                  onClick={next}
                  style={{ backgroundColor: "#40a9ff", borderColor: "#40a9ff" }}
                >
                  Next
                </Button>
              )}
              {currentStep === outcomes.length - 1 && (
                <Button
                  type="primary"
                  onClick={() => {
                    form
                      .validateFields()
                      .then(() => {
                        handleAssign();
                      })
                      .catch((info) => {
                        console.log("Validate Failed:", info);
                      });
                  }}
                  loading={assignLoading}
                  style={{ backgroundColor: "#73d13d", borderColor: "#73d13d" }}
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
