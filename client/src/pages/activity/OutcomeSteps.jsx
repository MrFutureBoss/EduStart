import React, { useEffect, useState } from "react";
import { Steps, Tooltip } from "antd";
import { UserOutlined } from "@ant-design/icons";
import moment from "moment";
import "../../style/Activity/outcomeSteps.css";

const { Step } = Steps;

const OutcomeSteps = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [personPosition, setPersonPosition] = useState(0);
  const [percent, setPercent] = useState(0); // Thêm biến phần trăm
  const [today, setToday] = useState(moment());

  // Định nghĩa các ngày bắt đầu và kết thúc của từng outcome
  const START_DATE = moment("2024-09-15");
  const OUTCOME_1_END = moment("2024-10-10");
  const OUTCOME_2_END = moment("2024-11-05");
  const END_DATE = moment("2024-11-30");

  useEffect(() => {
    // Cập nhật ngày hiện tại khi component render
    setToday(moment());

    // Tính toán bước tiến trình dựa trên ngày hiện tại
    const today = moment();
    let totalDuration = END_DATE.diff(START_DATE, "days");
    let currentOutcomeDuration, outcomeProgress, currentPercent;

    // Outcome 1
    if (today.isBefore(OUTCOME_1_END)) {
      setCurrentStep(0);
      currentOutcomeDuration = OUTCOME_1_END.diff(START_DATE, "days");
      outcomeProgress = today.diff(START_DATE, "days");
      currentPercent = Math.round((outcomeProgress / currentOutcomeDuration) * 100); // Tính phần trăm tiến trình
      setPersonPosition((outcomeProgress / currentOutcomeDuration) * 33); // Trong phạm vi outcome 1
    }
    // Outcome 2
    else if (today.isBefore(OUTCOME_2_END)) {
      setCurrentStep(1);
      currentOutcomeDuration = OUTCOME_2_END.diff(OUTCOME_1_END, "days");
      outcomeProgress = today.diff(OUTCOME_1_END, "days");
      currentPercent = Math.round((outcomeProgress / currentOutcomeDuration) * 100); // Tính phần trăm tiến trình
      setPersonPosition(33 + (outcomeProgress / currentOutcomeDuration) * 33); // Di chuyển giữa outcome 1 và 2
    }
    // Outcome 3
    else if (today.isBefore(END_DATE)) {
      setCurrentStep(2);
      currentOutcomeDuration = END_DATE.diff(OUTCOME_2_END, "days");
      outcomeProgress = today.diff(OUTCOME_2_END, "days");
      currentPercent = Math.round((outcomeProgress / currentOutcomeDuration) * 100); // Tính phần trăm tiến trình
      setPersonPosition(66 + (outcomeProgress / currentOutcomeDuration) * 34); // Di chuyển giữa outcome 2 và 3
    }
    // Sau khi tất cả outcomes đã hoàn tất
    else {
      setCurrentStep(3);
      currentPercent = 100;
      setPersonPosition(100); // Đã hoàn thành tất cả các outcome
    }

    setPercent(currentPercent); // Cập nhật phần trăm vào state
  }, [today]);

  return (
    <div className="outcome-steps-container">
      {/* Thanh tiến trình chính giữa các Step */}
      <div className="step-progress-bar">
        <Tooltip title={`Tiến trình hiện tại: ${today.format("DD/MM/YYYY")}`}>
          <div
            className="person-icon"
            style={{ left: `${personPosition}%` }} // Điều chỉnh vị trí icon theo thời gian
          >
            <UserOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
          </div>
        </Tooltip>
      </div>

      {/* Các Step (các outcome) */}
      <Steps current={currentStep} size="default" direction="horizontal">
        <Step title="Outcome 1" description="15/09 - 10/10/2024" />
        <Step title="Outcome 2" percent="70%" description="11/10 - 05/11/2024" />
        <Step title="Outcome 3" description="06/11 - 30/11/2024" />
      </Steps>
    </div>
  );
};

export default OutcomeSteps;
