import React, { useEffect, useState } from "react";
import { Tree, Spin } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { fetchTreeData } from "../../api";
import PropTypes from "prop-types";
import {
  setProfession,
  setProfessions,
  setSpecialty,
} from "../../redux/slice/SelectMentorSlice"; // Sử dụng đúng slice từ Redux

const TreeView = ({
  onSelect,
  onFirstProfessionRefReady,
  onFirstSpecialtyRefReady,
}) => {
  const dispatch = useDispatch();
  const { professions, selectedProfessionId, selectedSpecialtyId } =
    useSelector((state) => state.selectMentor); // Lấy dữ liệu từ slice selectMentor

  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);

  useEffect(() => {
    const getTreeData = async () => {
      setLoading(true);
      try {
        const response = await fetchTreeData();
        const data = response.data.map((profession, professionIndex) => ({
          title: profession.name,
          key: profession._id,
          professionId: profession._id,
          professionName: profession.name,
          isFirstProfession: professionIndex === 0,
          children: profession.specialty.map((specialty, specialtyIndex) => ({
            title: specialty.name,
            key: `${profession._id}-${specialty._id}`,
            isLeaf: true,
            professionId: profession._id,
            specialtyId: specialty._id,
            specialtyName: specialty.name,
            isFirstSpecialty: professionIndex === 0 && specialtyIndex === 0,
          })),
        }));

        dispatch(setProfessions({ data })); // Lưu professions vào redux

        // Expand the first profession if needed
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
  }, [dispatch]);

  const handleSelect = (selectedKeys, info) => {
    const selectedKey = selectedKeys[0];
    if (selectedKey) {
      if (!info.node.isLeaf) {
        const professionId = selectedKey;
        const professionName = info.node.title;
        dispatch(setProfession({ professionId, professionName }));
        onSelect(professionId, null, professionName, null);
      } else {
        const [professionId, specialtyId] = selectedKey.split("-");
        const professionNode = professions.data.find(
          (item) => item.key === professionId
        );
        const professionName = professionNode ? professionNode.title : "";
        const specialtyName = info.node.title;
        dispatch(setSpecialty({ specialtyId, specialtyName }));
        onSelect(professionId, specialtyId, professionName, specialtyName);
      }
    }
  };

  const handleExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };

  const titleRender = (nodeData) => {
    if (nodeData.isFirstProfession) {
      return (
        <span
          ref={(node) =>
            onFirstProfessionRefReady && onFirstProfessionRefReady(node)
          }
          style={{ cursor: "pointer" }}
        >
          {nodeData.title}
        </span>
      );
    }
    if (nodeData.isFirstSpecialty) {
      return (
        <span
          ref={(node) =>
            onFirstSpecialtyRefReady && onFirstSpecialtyRefReady(node)
          }
          style={{ cursor: "pointer" }}
        >
          {nodeData.title}
        </span>
      );
    }
    return <span>{nodeData.title}</span>;
  };

  return (
    <div>
      {loading ? (
        <Spin />
      ) : (
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
      )}
    </div>
  );
};

TreeView.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onFirstProfessionRefReady: PropTypes.func,
  onFirstSpecialtyRefReady: PropTypes.func,
};

export default TreeView;
