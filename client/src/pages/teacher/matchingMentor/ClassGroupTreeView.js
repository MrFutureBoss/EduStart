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
  setPendingGroups,
} from "../../../redux/slice/ClassSlice";

const ClassGroupTreeView = () => {
  const dispatch = useDispatch();
  const teacherId = localStorage.getItem("userId");

  // Lấy dữ liệu từ Redux
  const { classSummaries, selectedGroup } = useSelector((state) => state.class);
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
        } = response.data;
        const totalClasses = fetchedClassSummaries.length;

        const pendingGroupsByClass = fetchedClassSummaries
          .map((classItem) => ({
            classId: classItem.classId,
            className: classItem.className,
            pendingGroups: classItem.groupDetails.filter(
              (group) => group.matchStatus === "Pending"
            ),
          }))
          .filter((classItem) => classItem.pendingGroups.length > 0);
        // Dispatch toàn bộ dữ liệu lên Redux
        dispatch(setClassSummaries(fetchedClassSummaries));
        dispatch(setCounts({ totalClasses }));
        dispatch(setMatchedClasses(matchedClasses));
        dispatch(setNotMatchedClasses(notMatchedClasses));
        dispatch(setEmptyClasses(emptyClasses));
        dispatch(setPendingGroups(pendingGroupsByClass));
      } catch (error) {
        console.error("Error fetching class data:", error);
      }
      setLoading(false);
    };

    if (classSummaries.length === 0) {
      loadClassData();
    }
  }, [teacherId, dispatch, classSummaries.length]);

  // Tạo `classesWithUnupdatedProjects` từ `classSummaries`
  const classesWithUnupdatedProjects = classSummaries.filter(
    (classItem) => classItem.groupsWithoutProject.length > 0
  );

  // Chuyển đổi `classSummaries` từ Redux thành `treeData` cho `Tree`
  const treeData = classSummaries
    .filter((classItem) => classItem.groupDetails.length > 0) // Lọc các lớp có nhóm
    .map((classItem) => ({
      title: classItem.className,
      key: classItem.classId,
      children: classItem.groupDetails.map((group) => ({
        title: group.groupName,
        key: `${classItem.classId}-${group.groupId}`,
        isLeaf: true,
        classId: classItem.classId,
        groupId: group.groupId,
        groupName: group.groupName,
        isMatched: group.isMatched,
        isProjectUpdated: group.isProjectUpdated,
        matchStatus: group.matchStatus,
      })),
    }));

  // Hàm kiểm tra nếu nhóm nằm trong `groupsWithoutProject`
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
      const {
        groupId,
        groupName,
        classId,
        isProjectUpdated,
        isMatched,
        matchStatus,
      } = info.node;
      if (selectedGroup.groupId !== groupId) {
        dispatch(
          setSelectedGroup({
            groupId,
            groupName,
            classId,
            isProjectUpdated,
            isMatched,
            matchStatus,
          })
        );
      }
    } else {
      handleExpandToggle(info.node.key);
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

    // Thiết lập màu sắc cho từng trạng thái nhóm
    let badgeColor = "";
    let badgeText = "";

    if (!nodeData.isProjectUpdated) {
      // Nhóm chưa cập nhật dự án
      badgeColor = "red";
      badgeText = "Chưa cập nhật dự án";
    } else if (nodeData.isProjectUpdated && !nodeData.isMatched) {
      // Dự án cập nhật nhưng chưa chọn mentor
      badgeColor = "orange";
      badgeText = "Chưa chọn Mentor";
    } else if (nodeData.isMatched && nodeData.matchStatus === "Pending") {
      // Chọn mentor và đang chờ duyệt
      badgeColor = "purple";
      badgeText = "Chờ duyệt";
    } else if (nodeData.isMatched && nodeData.matchStatus === "Accepted") {
      // Mentor đã được duyệt
      badgeColor = "green";
      badgeText = "Đã duyệt";
    }

    return (
      <span style={{ display: "flex", alignItems: "center" }}>
        {nodeData.title}
        <Badge
          color={badgeColor}
          text={
            <span style={{ fontStyle: "italic", fontSize: "0.85em" }}>
              ({badgeText})
            </span>
          }
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
