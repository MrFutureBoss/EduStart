// MainStep.js
import React, { useState, useRef, useEffect } from "react";
import Step1SelectProfession from "./Step1SelectProfession";
import Step2SelectSpecialty from "./Step2SelectSpecialty";
import MentorSelection from "../chooseMentor/MentorSelection";
import { Steps, Button } from "antd";
import { useSelector } from "react-redux";
import CustomButton from "../../../components/Button/Button";

const { Step } = Steps;

const MainStep = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { stepCheck } = useSelector((state) => state.selectMentor);
  const selectedProfessionId = useSelector(
    (state) => state.selectMentor.selectedProfessionId
  );
  const selectedSpecialtyId = useSelector(
    (state) => state.selectMentor.selectedSpecialtyId
  );

  useEffect(() => {
    if (
      selectedProfessionId &&
      selectedSpecialtyId &&
      currentStep === 0 &&
      stepCheck === 2
    ) {
      setCurrentStep(2);
    } else if (
      !selectedSpecialtyId &&
      selectedProfessionId &&
      stepCheck === 2
    ) {
      setCurrentStep(0);
    } else if (
      !selectedSpecialtyId &&
      selectedProfessionId &&
      stepCheck === 1
    ) {
      setCurrentStep(1);
    } else if (stepCheck === 0) {
      setCurrentStep(0);
    }
  }, [selectedProfessionId, selectedSpecialtyId, stepCheck]);
  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Hàm kiểm tra xem nút "Tiếp theo" có nên bị vô hiệu hóa không
  const isNextDisabled = () => {
    if (currentStep === 0 && !selectedProfessionId) {
      return true;
    }
    if (currentStep === 1 && !selectedSpecialtyId) {
      return true;
    }
    return false;
  };

  return (
    <div>
      <Steps current={currentStep}>
        <Step title="Chọn Lĩnh Vực" />
        <Step title="Chọn Chuyên Môn" />
        <Step title="Chọn Mentor và Lưu" />
      </Steps>

      <div style={{ marginTop: 20 }}>
        {currentStep === 0 && <Step1SelectProfession onNext={handleNext} />}
        {currentStep === 1 && selectedProfessionId ? (
          <Step2SelectSpecialty onNext={handleNext} />
        ) : null}
        {currentStep === 2 && selectedSpecialtyId ? (
          <MentorSelection
            professionId={selectedProfessionId}
            specialtyId={selectedSpecialtyId}
          />
        ) : null}
      </div>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {currentStep > 0 && (
          <Button type="default" onClick={handleBack}>
            Quay lại
          </Button>
        )}
        {currentStep < 2 && (
          <div style={{ display: "flex", alignItems: "center" }}>
            {currentStep === 1 && !selectedSpecialtyId && (
              <span style={{ marginRight: 10, color: "red" }}>
                Vui lòng chọn chuyên môn trước khi tiếp tục.
              </span>
            )}{" "}
            <CustomButton
              type="primary"
              onClick={handleNext}
              disabled={isNextDisabled()}
              content={"Tiếp theo"}
            />
            {currentStep === 0 && !selectedProfessionId && (
              <span style={{ marginLeft: 10, color: "red" }}>
                Vui lòng chọn lĩnh vực trước khi tiếp tục.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainStep;
