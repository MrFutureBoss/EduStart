import React, { useState, useEffect } from "react";
import ReactJoyride from "react-joyride";
import PropTypes from "prop-types";

const GuidedTour = ({
  onComplete,
  selectedSpecialty,
  selectedProfession,
  selectedMentors,
}) => {
  const [runTour, setRunTour] = useState(true);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    setSteps(getSteps());
  }, [selectedProfession, selectedSpecialty, selectedMentors]);

  function getSteps() {
    return [
      {
        title: "Chào mừng đến với ứng dụng",
        content: "Đây là hướng dẫn để giúp bạn sử dụng ứng dụng.",
        placement: "center",
        disableBeacon: true,
        target: "body",
      },
      {
        title: "Chọn Chuyên Ngành",
        content: "Hãy chọn một lĩnh vực từ danh sách này.",
        target: '[data-tour="first-profession"]',
        placement: "right",
        disableBeacon: true,
        disableNext: !selectedProfession, // Wait until a profession is selected
        waitForSelector: true,
      },
      {
        title: "Chọn Chuyên Môn",
        content: "Tiếp theo, chọn một chuyên môn từ danh sách.",
        target: '[data-tour="first-specialty"]',
        placement: "right",
        disableBeacon: true,
        disableNext: !selectedSpecialty, // Wait until a specialty is selected
        waitForSelector: true,
      },
      {
        title: "Danh Sách Mentor Có Sẵn",
        content:
          "Đây là danh sách các Mentor có sẵn. Bạn có thể kéo thả Mentor từ đây vào danh sách ưu tiên.",
        target: '[data-tour="mentor-available"]',
        placement: "top",
        disableBeacon: true,
        waitForSelector: true,
      },
      {
        title: "Danh Sách Mentor Ưu Tiên",
        content:
          "Đây là danh sách Mentor đã được chọn với thứ tự ưu tiên. Bạn có thể kéo thả để sắp xếp thứ tự.",
        target: '[data-tour="mentor-priority"]',
        placement: "bottom",
        disableBeacon: true,
        disableNext: selectedMentors.length === 0, // Wait until at least one mentor is selected
        waitForSelector: true,
      },
      {
        title: "Lưu Lựa Chọn",
        content: "Sau khi hoàn tất, nhấn vào nút Lưu để lưu lại lựa chọn.",
        target: '[data-tour="save-button"]',
        placement: "left",
        disableBeacon: true,
        waitForSelector: true,
      },
    ];
  }

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = ["finished", "skipped"];

    if (finishedStatuses.includes(status)) {
      localStorage.setItem("guidedTourCompleted", "true");
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <ReactJoyride
      steps={steps}
      run={runTour}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      locale={{
        back: "Quay lại",
        close: "Đóng",
        last: "Hoàn thành",
        next: "Tiếp theo",
        skip: "Bỏ qua",
      }}
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
};

GuidedTour.propTypes = {
  onComplete: PropTypes.func,
  selectedSpecialty: PropTypes.string,
  selectedProfession: PropTypes.string,
  selectedMentors: PropTypes.array,
};

export default GuidedTour;
