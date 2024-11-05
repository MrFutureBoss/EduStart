// ViewMatching.js
import React, { useEffect, useState } from "react";
import { Card, message } from "antd";
import { useSelector } from "react-redux";
import { getProjectGroupData, getMatchedProject } from "../../../api";
import MatchedProjectDetails from "../../../components/Card/MatchedProjectDetails";

const ViewMatching = () => {
  const { selectedGroup } = useSelector((state) => state.class);
  const [data, setData] = useState(null);
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    if (!selectedGroup) return;

    const fetchData = async () => {
      try {
        if (selectedGroup.isMatched) {
          // Call API cho dự án đã ghép
          const response = await getMatchedProject(selectedGroup.groupId);
          setData(response.data);
          setIsMatched(true);
        } else if (selectedGroup.isProjectUpdated) {
          // Call API cho dữ liệu nhóm dự án
          const response = await getProjectGroupData(selectedGroup.groupId);
          setData(response.data);
          setIsMatched(false);
        } else if (!selectedGroup.isProjectUpdated) {
          message.warning(
            "Dự án chưa cập nhật! Vui lòng yêu cầu sinh viên cập nhật để tiếp tục"
          );
          setData([]);
        }
      } catch (error) {
        message.error("Không thể tải dữ liệu.");
      }
    };

    fetchData();
  }, [selectedGroup]);

  if (!selectedGroup) return <p>Vui lòng chọn một nhóm để xem chi tiết.</p>;

  return (
    <Card
      style={{
        marginLeft: "-12px",
        width: "104%",
        backgroundColor: "#fbfbfb75",
      }}
    >
      {data && <MatchedProjectDetails data={data} isMatched={isMatched} />}
    </Card>
  );
};

export default ViewMatching;
