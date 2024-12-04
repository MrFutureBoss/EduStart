import React, { useEffect } from "react";
import { Card, Descriptions } from "antd";
import { useSelector } from "react-redux";
import calculateWeekAndPhase from "../class/calculateWeekAndPhase";

const TeacherSemester = ({ onSemesterIdChange }) => {
  const classInfo = useSelector((state) => state.classManagement.classinfo);

  const ongoingSemester = classInfo?.semesters?.find(
    (semester) => semester.status === "Ongoing"
  );
  useEffect(() => {
    if (ongoingSemester && ongoingSemester._id) {
      onSemesterIdChange(ongoingSemester._id);
    }
  }, [ongoingSemester, onSemesterIdChange]);
  const { week } = ongoingSemester
    ? calculateWeekAndPhase(ongoingSemester.startDate)
    : { week: null };

  return (
    <div>
      <Card
        title="Thông tin kỳ học"
        bordered={false}
        size="small"
        headStyle={{
          minHeight: "33px",
          fontSize: "16px",
        }}
        bodyStyle={{
          padding: "0",
        }}
      >
        {ongoingSemester ? (
          <Descriptions
            column={1}
            size="small"
            bordered
            labelStyle={{ width: "150px", fontSize: "14px", color: "black" }}
            contentStyle={{ fontSize: "13px" }}
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
          </Descriptions>
        ) : (
          <p style={{ fontSize: "12px" }}>Hiện tại chưa có kì học nào</p>
        )}
      </Card>
    </div>
  );
};

export default TeacherSemester;
// headStyle={{
//   backgroundColor: "rgb(96, 178, 199)",
//   minHeight: "33px",
//   color: "white",
//   fontSize: "16px",
// }}
// bodyStyle={{
//   padding: "0",
// }}
