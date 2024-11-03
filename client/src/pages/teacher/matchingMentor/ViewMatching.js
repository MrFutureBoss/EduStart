import React, { useEffect, useState } from "react";
import { Card, message } from "antd";
import { useSelector } from "react-redux";
import { getProjectGroupData, getMatchedProject } from "../../../api";
import MatchedProjectDetails from "../../../components/Card/MatchedProjectDetails";
import ProjectCard from "./ProjectCard";

const ViewMatching = () => {
  const { selectedGroup } = useSelector((state) => state.class);
  const [projectData, setProjectData] = useState(null);
  const [matchedData, setMatchedData] = useState(null);

  useEffect(() => {
    if (!selectedGroup) return;

    const fetchData = async () => {
      try {
        if (selectedGroup.isMatched) {
          // Call API for matched project
          const data = await getMatchedProject(selectedGroup.groupId);
          setMatchedData(data.data);
          setProjectData(null); // Reset projectData to ensure only one component shows
        } else if (selectedGroup.isProjectUpdated) {
          // Call API for project group data
          const project = await getProjectGroupData(selectedGroup.groupId);
          setProjectData(project.data);
          setMatchedData(null); // Reset matchedData to ensure only one component shows
        }
      } catch (error) {
        message.error("Không thể tải dữ liệu.");
      }
    };

    fetchData();
  }, [selectedGroup]);

  if (!selectedGroup) return <p>Vui lòng chọn một nhóm để xem chi tiết.</p>;
  console.log("matchedData", matchedData);

  return (
    <Card style={{ marginLeft: "-12px", width: "962px" }}>
      {projectData && (
        <ProjectCard
          style={{ width: "100%" }}
          project={projectData}
          className={"always-hover"}
        />
      )}
      {matchedData && <MatchedProjectDetails matchedData={matchedData} />}
    </Card>
  );
};

export default ViewMatching;
