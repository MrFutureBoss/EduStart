import React from "react";
import { Card, Descriptions } from "antd";
import { useSelector } from "react-redux";
import calculateWeekAndPhase from "../class/calculateWeekAndPhase";

const TeacherSemester = () => {
  const classInfo = useSelector((state) => state.classManagement.classinfo);

  const ongoingSemester = classInfo?.semesters?.find(
    (semester) => semester.status === "Ongoing"
  );

  const { week } = ongoingSemester
    ? calculateWeekAndPhase(ongoingSemester.startDate)
    : { week: null };

  return (
    <div>
      <Card
        bordered={true}
        title="Thông tin kỳ học"
        size="small"
        headStyle={{ fontSize: "14px" }}
        bodyStyle={{ padding: "12px" }}
      >
        {ongoingSemester ? (
          <Descriptions
            column={1}
            size="small"
            bordered
            labelStyle={{ width: "150px", fontSize: "12px" }}
            contentStyle={{ fontSize: "12px" }}
          >
            <Descriptions.Item label="Kì học hiện tại">
              {ongoingSemester.name}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {new Date(ongoingSemester.startDate).toLocaleDateString()} -{" "}
              {new Date(ongoingSemester.endDate).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Số lớp dạy kì này">
              {classInfo?.totalClasses}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng số sinh viên">
              {classInfo?.totalStudents}
            </Descriptions.Item>
            <Descriptions.Item label="Tuần học">{week}</Descriptions.Item>
          </Descriptions>
        ) : (
          <p style={{ fontSize: "12px" }}>Hiện tại chưa có kì học nào</p>
        )}
      </Card>
    </div>
  );
};

export default TeacherSemester;
