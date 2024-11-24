import React from "react";
import CustomCalendar from "./MeetingSchedule";
import HugeModal from "../../components/Modal/HugeModal";

const ManageMeetingTime = ({open, close}) => {
  return (
    <HugeModal
      title=""
      content={<CustomCalendar />}
      isModalOpen={open}
      handleCancel={close}
      closeable={true}
      footer=""
    />
  );
};

export default ManageMeetingTime;
