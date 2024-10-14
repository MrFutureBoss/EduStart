import React, { useEffect, useState } from "react";
import { Modal, Form, Input, DatePicker, Button } from "antd";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const EditSemesterModal = ({
  visible,
  onOk,
  onCancel,
  semester,
  apiErrors,
}) => {
  const [form] = Form.useForm();

  // State để lưu dữ liệu ban đầu
  const [initialValues, setInitialValues] = useState({});

  // State để kiểm soát việc có cho phép nhấn nút Lưu hay không
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  useEffect(() => {
    if (semester) {
      const initialData = {
        name: semester.name,
        startDate: semester.startDate ? dayjs(semester.startDate) : null,
        endDate: semester.endDate ? dayjs(semester.endDate) : null,
      };
      form.setFieldsValue(initialData);
      setInitialValues(initialData);
      setIsSaveDisabled(true); // Disable save button khi load dữ liệu ban đầu
    } else {
      form.resetFields();
      setIsSaveDisabled(true); // Disable save button khi không có dữ liệu
    }
  }, [semester, form]);

  useEffect(() => {
    if (apiErrors) {
      const fieldErrors = Object.entries(apiErrors).map(([field, error]) => ({
        name: field,
        errors: [error],
      }));
      form.setFields(fieldErrors);
    }
  }, [apiErrors, form]);

  // Xử lý khi người dùng ấn nút Lưu
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onOk({
          ...semester,
          name: values.name,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        });
      })
      .catch((info) => {});
  };

  // Hàm kiểm tra nếu dữ liệu hiện tại khác với dữ liệu ban đầu
  const handleValuesChange = (changedValues, allValues) => {
    const isChanged =
      allValues.name !== initialValues.name ||
      !dayjs(allValues.startDate).isSame(initialValues.startDate, "day") ||
      !dayjs(allValues.endDate).isSame(initialValues.endDate, "day");
    setIsSaveDisabled(!isChanged); // Enable nút Lưu nếu có thay đổi
  };

  return (
    <Modal
      title="Chỉnh sửa kỳ học"
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
        <Button
          key="submit"
          type="primary"
          onClick={handleOk}
          disabled={isSaveDisabled}
        >
          Lưu
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
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
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
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
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditSemesterModal;
