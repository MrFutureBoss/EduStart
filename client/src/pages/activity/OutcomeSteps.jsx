import React, { useEffect, useState } from "react";
import { Steps, message } from "antd";
import axios from "axios";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Step } = Steps;

const OutcomeSteps = ({ classId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState({
    outcomes: [],
    projectCompleted: false,
  });

  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId"); 
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:9999/activity/${userId}`,
          config
        );
        const activities = response.data.activities;

        // Filter outcomes based on the assignmentType and classId
        const outcomes = activities.filter(
          (activity) =>
            activity.activityType === "outcome" && activity.classId === classId
        );

        if (outcomes.length > 0) {
          setStepData({ projectCompleted: true, outcomes });

          const sortedOutcomes = outcomes.sort((a, b) =>
            a.assignmentType.localeCompare(b.assignmentType)
          );

          const highestCompletedOutcome = sortedOutcomes.reduce(
            (acc, outcome) =>
              outcome.completed && outcome.assignmentType > acc.assignmentType
                ? outcome
                : acc,
            { assignmentType: "outcome 0" }
          );

          switch (highestCompletedOutcome.assignmentType) {
            case "outcome 3":
              setCurrentStep(3);
              break;
            case "outcome 2":
              setCurrentStep(2);
              break;
            case "outcome 1":
            default:
              setCurrentStep(1);
              break;
          }
        } else {
          setStepData({ projectCompleted: false, outcomes: [] });
        }
      } catch (error) {
        message.error("Error fetching steps data.");
      }
    };

    fetchStatus();
  }, [classId, userId, config]);

  const renderIcon = (index) => {
    const outcome = stepData.outcomes[index - 1];
    if (!outcome) return <LoadingOutlined />;
    if (outcome.completed)
      return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
  };

  return (
    <Steps current={currentStep} size="default" direction="horizontal">
      <Step
        title="Outcome 1"
        icon={renderIcon(1)}
        description={
          stepData.outcomes[0] &&
          `Deadline: ${new Date(
            stepData.outcomes[0].deadline
          ).toLocaleDateString()}`
        }
      />
      <Step
        title="Outcome 2"
        icon={renderIcon(2)}
        description={
          stepData.outcomes[1] &&
          `Deadline: ${new Date(
            stepData.outcomes[1].deadline
          ).toLocaleDateString()}`
        }
      />
      <Step
        title="Outcome 3"
        icon={renderIcon(3)}
        description={
          stepData.outcomes[2] &&
          `Deadline: ${new Date(
            stepData.outcomes[2].deadline
          ).toLocaleDateString()}`
        }
      />
    </Steps>
  );
};

export default OutcomeSteps;
