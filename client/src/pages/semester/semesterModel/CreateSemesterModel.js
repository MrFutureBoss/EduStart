// CreateSemesterModal.jsx
import React, { useEffect, useState } from "react";
import { Modal, Form, Input, DatePicker, Button, Space } from "antd";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const CreateSemesterModal = ({ visible, onOk, onCancel, apiErrors }) => {
  const [form] = Form.useForm();
  const [outcomes, setOutcomes] = useState([
    { name: "Outcome 1" },
    { name: "Outcome 2" },
    { name: "Outcome 3" },
  ]);

  const addOutcome = () => {
    const newOutcome = { name: `Outcome ${outcomes.length + 1}` };
    setOutcomes([...outcomes, newOutcome]);
  };

  const removeOutcome = (index) => {
    const updatedOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(updatedOutcomes);
  };

  useEffect(() => {
    if (apiErrors) {
      const errors = Object.keys(apiErrors).map((field) => ({
        name: field,
        errors: [apiErrors[field]],
      }));
      form.setFields(errors);
    }
  }, [apiErrors, form]);

  // const handleOk = () => {
  //   form
  //     .validateFields()
  //     .then((values) => {
  //       onOk({
  //         ...values,
  //         startDate: values.startDate.toISOString(),
  //         endDate: values.endDate.toISOString(),
  //       });
  //     })
  //     .catch((info) => {});
  // };
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const newSemester = {
          ...values,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
          outcomes,
        };
        onOk(newSemester);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const disabledPastDates = (current) => {
    return current && current.isBefore(dayjs(), "day");
  };
  return (
    <Modal
      title="Tạo kỳ học mới"
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Tạo
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên kỳ học"
          rules={[
            { required: true, message: "Vui lòng nhập tên kỳ học!" },
            {
              pattern: /^(SP|SU|FA)\d{2}$/,
              message:
                "Tên kỳ học không đúng định dạng! Vui lòng sử dụng định dạng: SPxx, SUxx, FAxx.",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="Ngày bắt đầu"
          dependencies={["endDate"]}
          rules={[
            { required: true, message: "Vui lòng chọn ngày bắt đầu!" },
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.resolve();
                }
                if (!value.isValid()) {
                  return Promise.reject(
                    new Error("Ngày bắt đầu không hợp lệ!")
                  );
                }
                const endDate = form.getFieldValue("endDate");
                if (endDate) {
                  if (value.isSameOrAfter(endDate, "day")) {
                    return Promise.reject(
                      new Error(
                        "Ngày bắt đầu phải trước ngày kết thúc và không được trùng!"
                      )
                    );
                  }

                  const durationInMonths = endDate.diff(value, "month", true);
                  if (durationInMonths < 2) {
                    return Promise.reject(
                      new Error("Kỳ học phải kéo dài ít nhất 2 tháng!")
                    );
                  }
                  if (durationInMonths > 4) {
                    return Promise.reject(
                      new Error("Kỳ học không thể kéo dài hơn 4 tháng!")
                    );
                  }
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder="Chọn ngày bắt đầu"
            disabledDate={disabledPastDates}
          />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="Ngày kết thúc"
          dependencies={["startDate"]}
          rules={[
            { required: true, message: "Vui lòng chọn ngày kết thúc!" },
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.resolve();
                }
                if (!value.isValid()) {
                  return Promise.reject(
                    new Error("Ngày kết thúc không hợp lệ!")
                  );
                }
                const startDate = form.getFieldValue("startDate");
                if (startDate) {
                  if (value.isSame(startDate, "day")) {
                    return Promise.reject(
                      new Error(
                        "Ngày kết thúc không được trùng với ngày bắt đầu!"
                      )
                    );
                  }
                  if (value.isSameOrBefore(startDate, "day")) {
                    return Promise.reject(
                      new Error("Ngày kết thúc phải sau ngày bắt đầu!")
                    );
                  }
                  const durationInMonths = value.diff(startDate, "month", true);
                  if (durationInMonths < 2) {
                    return Promise.reject(
                      new Error("Kỳ học phải kéo dài ít nhất 2 tháng!")
                    );
                  }
                  if (durationInMonths > 4) {
                    return Promise.reject(
                      new Error("Kỳ học không thể kéo dài hơn 4 tháng!")
                    );
                  }
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder="Chọn ngày kết thúc"
            disabledDate={disabledPastDates}
          />
        </Form.Item>

        <Form.Item label="Số lượng Outcome">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "flex-start",
            }}
          >
            {outcomes.map((outcome, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  padding: "2px",
                  border: "1px solid #d9d9d9",
                  borderRadius: "8px",
                  backgroundColor: "#fafafa",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                  width: "auto",
                  minWidth: "60px",
                }}
              >
                <Input
                  value={outcome.name}
                  onChange={(e) => {
                    const updatedOutcomes = [...outcomes];
                    updatedOutcomes[index].name = e.target.value;
                    setOutcomes(updatedOutcomes);
                  }}
                  placeholder={`Outcome ${index + 1}`}
                  style={{
                    textAlign: "center",
                    border: "none",
                    width: "100%",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    padding: 0,
                  }}
                />
                {outcomes.length > 1 && (
                  <Button
                    type="text"
                    size="small"
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      color: "red",
                      fontWeight: "bold",
                      padding: "0",
                      borderRadius: "50%",
                    }}
                    onClick={() => removeOutcome(index)}
                  >
                    X
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="dashed"
            onClick={addOutcome}
            style={{ marginTop: 16 }}
            icon={<PlusOutlined />}
          >
            Thêm Outcome
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateSemesterModal;
