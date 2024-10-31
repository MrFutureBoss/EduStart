import React, { useEffect, useState } from "react";
import { Tree, Spin, Badge } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchClassSummaryData } from "../../../api";
import {
  setClassSummaries,
  setSelectedGroup,
  setCounts,
  setMatchedClasses,
  setNotMatchedClasses,
  setEmptyClasses,
  setClassesWithUnupdatedProjects,
} from "../../../redux/slice/ClassSlice";

const ClassGroupTreeView = () => {
  const dispatch = useDispatch();
  const teacherId = localStorage.getItem("userId");

  // Lấy dữ liệu từ Redux
  const { classSummaries, selectedGroup, classesWithUnupdatedProjects } =
    useSelector((state) => state.class);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);

  useEffect(() => {
    const loadClassData = async () => {
      setLoading(true);
      try {
        const response = await fetchClassSummaryData(teacherId);
        const {
          classSummaries: fetchedClassSummaries,
          counts,
          matchedClasses,
          notMatchedClasses,
          emptyClasses,
          classesWithUnupdatedProjects,
        } = response.data;

        // Dispatch toàn bộ dữ liệu lên Redux
        dispatch(setClassSummaries(fetchedClassSummaries));
        dispatch(setCounts(counts));
        dispatch(setMatchedClasses(matchedClasses));
        dispatch(setNotMatchedClasses(notMatchedClasses));
        dispatch(setEmptyClasses(emptyClasses));
        dispatch(setClassesWithUnupdatedProjects(classesWithUnupdatedProjects));
      } catch (error) {
        console.error("Error fetching class data:", error);
      }
      setLoading(false);
    };

    if (classSummaries.length === 0) {
      loadClassData();
    }
  }, [teacherId, dispatch, classSummaries.length]);

  // Chuyển đổi `classSummaries` từ Redux thành `treeData` cho `Tree`
  const treeData = classSummaries.map((classItem) => ({
    title: classItem.className,
    key: classItem.classId,
    children: classItem.groupDetails.map((group) => ({
      title: group.groupName,
      key: `${classItem.classId}-${group.groupId}`,
      isLeaf: true,
      groupId: group.groupId,
      groupName: group.groupName,
      isMatched: group.isMatched,
      isProjectUpdated: group.isProjectUpdated,
    })),
  }));
  console.log(classesWithUnupdatedProjects);

  // Hàm kiểm tra nếu nhóm nằm trong danh sách `classesWithUnupdatedProjects`
  const isGroupInUnupdatedProjects = (classId, groupId) => {
    const classWithUnupdatedProjects = classesWithUnupdatedProjects.find(
      (classItem) => classItem.classId === classId
    );
    return (
      classWithUnupdatedProjects &&
      classWithUnupdatedProjects.groupsWithoutProject.some(
        (group) => group.groupId === groupId
      )
    );
  };

  // Xử lý mở rộng hoặc đóng nhánh khi nhấp vào tên lớp
  const handleExpandToggle = (classId) => {
    setExpandedKeys(
      (prevExpandedKeys) =>
        prevExpandedKeys.includes(classId)
          ? prevExpandedKeys.filter((key) => key !== classId) // Đóng nếu đã mở
          : [...prevExpandedKeys, classId] // Mở nếu đang đóng
    );
  };

  const handleSelect = (selectedKeys, info) => {
    if (info.node.isLeaf) {
      const { groupId, groupName } = info.node;
      if (selectedGroup.groupId !== groupId) {
        dispatch(setSelectedGroup({ groupId, groupName }));
      }
    } else {
      handleExpandToggle(info.node.key); // Toggle mở/đóng nhánh
    }
  };

  const titleRender = (nodeData) => {
    if (nodeData.children) {
      const totalGroups = nodeData.children.length;
      const matchedCount = nodeData.children.filter(
        (group) => group.isMatched
      ).length;

      let badgeColor = "gray";
      if (matchedCount === totalGroups) {
        badgeColor = "green";
      } else if (matchedCount > 0) {
        badgeColor = "orange";
      }

      return (
        <span style={{ display: "flex", alignItems: "center" }}>
          {nodeData.title}
          <Badge
            count={`${matchedCount}/${totalGroups}`}
            style={{
              backgroundColor: badgeColor,
              marginLeft: 8,
            }}
          />
        </span>
      );
    }

    // Kiểm tra nếu nhóm nằm trong `classesWithUnupdatedProjects`
    const badgeColor = isGroupInUnupdatedProjects(
      nodeData.key.split("-")[0],
      nodeData.groupId
    )
      ? "#CC0000"
      : nodeData.isMatched
      ? "green"
      : "orange";

    return (
      <span>
        {nodeData.title}
        <Badge
          status={nodeData.isMatched ? "success" : "warning"}
          color={badgeColor}
          style={{ marginLeft: 8 }}
        />
      </span>
    );
  };

  return (
    <div>
      {loading ? (
        <Spin />
      ) : (
        <Tree
          showLine
          onExpand={(expandedKeys) => setExpandedKeys(expandedKeys)}
          onSelect={handleSelect}
          expandedKeys={expandedKeys}
          treeData={treeData}
          titleRender={titleRender}
        />
      )}
    </div>
  );
};

export default ClassGroupTreeView;
