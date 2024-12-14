import React, { useEffect, useState } from "react";
import { Modal, Form, Input, DatePicker, Select, Button, message } from "antd";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Option } = Select;

const EditSemesterModal = ({
  visible,
  onOk,
  onCancel,
  semester,
  apiErrors,
}) => {
  const [form] = Form.useForm();
  console.log(semester);

  // State to store initial values
  const [initialValues, setInitialValues] = useState({});

  // State to control the Save button
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  useEffect(() => {
    if (semester) {
      const initialData = {
        name: semester.name,
        startDate: semester.startDate ? dayjs(semester.startDate) : null,
        endDate: semester.endDate ? dayjs(semester.endDate) : null,
        status: semester.status || "Upcoming",
      };
      form.setFieldsValue(initialData);
      setInitialValues(initialData);
      setIsSaveDisabled(true); // Disable save button when loading initial data
    } else {
      form.resetFields();
      setIsSaveDisabled(true); // Disable save button when no data is present
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

  // Handle Save button click
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // Check if changing to "Finished" status
        if (values.status === "Finished") {
          const endDate = dayjs(values.endDate); // Convert to dayjs object
          const today = dayjs();

          // Calculate the difference between end date and today
          const daysDifference = today.diff(endDate, "day");

          // If the difference is negative (end date in future), prompt confirmation
          if (daysDifference < -5) {
            Modal.confirm({
              title: "Xác nhận thay đổi trạng thái kỳ học",
              content: `Hiện tại chưa đến thời gian kỳ học kết thúc. Bạn có chắc chắn muốn thay đổi trạng thái kỳ học về "Đã kết thúc"?`,
              okText: "Xác nhận",
              cancelText: "Hủy",
              onOk: () => {
                // Proceed with updating the semester
                onOk({
                  ...semester,
                  name: values.name,
                  startDate: values.startDate.toISOString(),
                  endDate: values.endDate.toISOString(),
                  status: values.status,
                });
              },
            });
            return;
          }
        }

        // Proceed with updating if no confirmation is needed
        onOk({
          ...semester,
          name: values.name,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
          status: values.status,
        });
      })
      .catch((info) => {
        message.error("Vui lòng kiểm tra lại thông tin đã nhập!");
      });
  };

  // Handle value changes
  const handleValuesChange = (changedValues, allValues) => {
    const isChanged =
      allValues.name !== initialValues.name ||
      !dayjs(allValues.startDate).isSame(initialValues.startDate, "day") ||
      !dayjs(allValues.endDate).isSame(initialValues.endDate, "day") ||
      allValues.status !== initialValues.status;
    setIsSaveDisabled(!isChanged); // Enable Save button if any change is detected
  };

  return (
    <Modal
      title="Chỉnh sửa kỳ học"
      open={visible}
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

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
        >
          <Select placeholder="Chọn trạng thái">
            <Option value="Upcoming">Sắp diễn ra</Option>
            <Option value="Ongoing">Đang diễn ra</Option>
            <Option value="Finished">Đã kết thúc</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditSemesterModal;
