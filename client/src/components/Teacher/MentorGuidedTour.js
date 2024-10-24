// src/components/Teacher/MentorSelectionTour.js
import React, { useState, useEffect } from "react";
import ReactJoyride from "react-joyride";
import PropTypes from "prop-types";

const MentorSelectionTour = ({
  mentorPriorityRef,
  mentorAvailableRef,
  saveButtonRef,
  onComplete,
}) => {
  const [runTour, setRunTour] = useState(false);

  const steps = [
    {
      target: mentorPriorityRef.current,
      content:
        "Đây là danh sách Mentor đã được chọn với thứ tự ưu tiên. Bạn có thể kéo thả để sắp xếp thứ tự ưu tiên cho các Mentor.",
      placement: "bottom",
    },
    {
      target: mentorAvailableRef.current,
      content:
        "Đây là danh sách Mentor có sẵn. Bạn có thể kéo thả Mentor từ danh sách này vào danh sách ưu tiên ở trên.",
      placement: "top",
    },
    {
      target: saveButtonRef.current,
      content:
        "Sau khi hoàn tất lựa chọn, hãy nhấn vào nút Lưu để lưu lại danh sách Mentor của bạn.",
      placement: "left",
    },
  ];

  useEffect(() => {
    setRunTour(true);
  }, []);

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
        last: "Kết thúc",
        next: "Tiếp theo",
        skip: "Bỏ qua",
      }}
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
      callback={(data) => {
        const { status } = data;
        if (["finished", "skipped"].includes(status)) {
          setRunTour(false);
          onComplete();
        }
      }}
    />
  );
};

MentorSelectionTour.propTypes = {
  mentorPriorityRef: PropTypes.object.isRequired,
  mentorAvailableRef: PropTypes.object.isRequired,
  saveButtonRef: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default MentorSelectionTour;
