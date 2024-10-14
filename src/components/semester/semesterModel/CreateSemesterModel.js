// CreateSemesterModal.jsx
import React, { useEffect } from "react";
import { Modal, Form, Input, DatePicker, Button } from "antd";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const CreateSemesterModal = ({ visible, onOk, onCancel, apiErrors }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (apiErrors) {
      const errors = Object.keys(apiErrors).map((field) => ({
        name: field,
        errors: [apiErrors[field]],
      }));
      form.setFields(errors);
    }
  }, [apiErrors, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onOk({
          ...values,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        });
      })
      .catch((info) => {});
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
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateSemesterModal;
