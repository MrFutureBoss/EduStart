import React, { useEffect, useState } from "react";
import { Tree, Spin, Badge } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { fetchTreeData } from "../../../api";
import {
  setCountsUpdate,
  setProfessions,
} from "../../../redux/slice/SelectMentorSlice";
import PropTypes from "prop-types";

const TreeView = ({ onSelect }) => {
  const dispatch = useDispatch();
  const {
    professions,
    selectedProfessionId,
    selectedSpecialtyId,
    notUpdatedCount,
    professionCount,
    specialtyCount,
    updatedCount,
  } = useSelector((state) => state.selectMentor);

  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const teacherId = localStorage.getItem("userId");
  console.log(professions);

  useEffect(() => {
    if (professionCount === 0) {
      const getTreeData = async () => {
        setLoading(true);
        try {
          const response = await fetchTreeData(teacherId);
          const {
            professionCount,
            specialtyCount,
            treeData,
            updatedCount,
            notUpdatedCount,
          } = response.data;

          const data = treeData.map((profession) => ({
            title: profession.name,
            key: profession._id,
            professionId: profession._id,
            professionName: profession.name,
            children: profession.specialty.map((specialty) => ({
              title: specialty.name,
              key: `${profession._id}-${specialty._id}`,
              isLeaf: true,
              professionId: profession._id,
              specialtyId: specialty._id,
              specialtyName: specialty.name,
              isUpdated: specialty.isUpdated,
            })),
          }));

          // Cập nhật treeData và đếm vào Redux
          dispatch(setProfessions(response.data.treeData));
          dispatch(
            setCountsUpdate({
              professionCount,
              specialtyCount,
              notUpdatedCount,
              updatedCount,
            })
          );

          if (data.length > 0) {
            const firstProfessionKey = data[0].key;
            setExpandedKeys([firstProfessionKey]);
          }
        } catch (error) {
          console.error("Error fetching tree data:", error);
        }
        setLoading(false);
      };

      getTreeData();
    }
  }, [
    dispatch,
    updatedCount,
    specialtyCount,
    professionCount,
    notUpdatedCount,
  ]);

  const handleSelect = (selectedKeys, info) => {
    const selectedKey = selectedKeys[0];

    if (selectedKey && info.node.isLeaf) {
      const [professionId, specialtyId] = selectedKey.split("-");
      const professionNode = professions.data.find(
        (item) => item.key === professionId
      );

      const professionName = professionNode
        ? professionNode.professionName
        : "";
      const specialtyName = info.node.title;

      onSelect(professionId, specialtyId, professionName, specialtyName);
    }
  };

  const handleExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };

  const titleRender = (nodeData) => {
    if (nodeData.children) {
      const updatedCount = nodeData.children.filter(
        (specialty) => specialty.isUpdated
      ).length;
      const totalSpecialties = nodeData.children.length;

      let badgeColor = "gray";
      if (updatedCount === totalSpecialties) {
        badgeColor = "green";
      } else if (updatedCount > 0) {
        badgeColor = "orange";
      }

      return (
        <span style={{ display: "flex", alignItems: "center" }}>
          {nodeData.title}
          <Badge
            count={`${updatedCount}/${totalSpecialties}`}
            style={{
              backgroundColor: badgeColor,
              marginLeft: 8,
            }}
          />
        </span>
      );
    }
    return (
      <span>
        {nodeData.title}
        {nodeData.isUpdated !== undefined && (
          <Badge
            status={nodeData.isUpdated ? "success" : "warning"}
            style={{ marginLeft: 8 }}
          />
        )}
      </span>
    );
  };

  return (
    <div>
      {loading ? (
        <Spin />
      ) : (
        <>
          <Tree
            showLine
            onSelect={handleSelect}
            onExpand={handleExpand}
            expandedKeys={expandedKeys}
            selectedKeys={[
              selectedSpecialtyId
                ? `${selectedProfessionId}-${selectedSpecialtyId}`
                : selectedProfessionId,
            ]}
            expandAction="click"
            treeData={professions.data}
            titleRender={titleRender}
          />
        </>
      )}
    </div>
  );
};

TreeView.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default TreeView;
