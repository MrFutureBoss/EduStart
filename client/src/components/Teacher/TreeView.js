import React, { useEffect, useState } from "react";
import { Tree, Spin } from "antd";
import { fetchTreeData } from "../../api";
import PropTypes from "prop-types";

const TreeView = ({
  onSelect,
  onFirstProfessionRefReady,
  onFirstSpecialtyRefReady,
  selectedProfession,
  selectedSpecialty,
}) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]); // Track selected keys

  useEffect(() => {
    const getTreeData = async () => {
      setLoading(true);
      try {
        const response = await fetchTreeData();
        const data = response.data.map((profession, professionIndex) => ({
          title: profession.name,
          key: profession._id,
          professionId: profession._id,
          professionName: profession.name, // Thêm tên chuyên ngành
          isFirstProfession: professionIndex === 0,
          children: profession.specialty.map((specialty, specialtyIndex) => ({
            title: specialty.name,
            key: `${profession._id}-${specialty._id}`,
            isLeaf: true,
            professionId: profession._id,
            specialtyId: specialty._id,
            specialtyName: specialty.name, // Thêm tên chuyên môn
            isFirstSpecialty: professionIndex === 0 && specialtyIndex === 0,
          })),
        }));
        setTreeData(data);

        // Expand the first profession if needed
        const guidedTourCompleted = localStorage.getItem("guidedTourCompleted");
        if (!guidedTourCompleted && data.length > 0) {
          const firstProfessionKey = data[0].key;
          setExpandedKeys([firstProfessionKey]);
        }
      } catch (error) {
        console.error("Error fetching tree data:", error);
      }
      setLoading(false);
    };

    getTreeData();
  }, [onFirstProfessionRefReady, onFirstSpecialtyRefReady, onSelect]);

  useEffect(() => {
    if (selectedProfession && selectedSpecialty) {
      setSelectedKeys([`${selectedProfession}-${selectedSpecialty}`]); // Highlight specialty
    } else if (selectedProfession) {
      setSelectedKeys([selectedProfession]); // Highlight profession
    }
  }, [selectedProfession, selectedSpecialty]);
  const handleSelect = (selectedKeys, info) => {
    const selectedKey = selectedKeys[0];
    if (selectedKey) {
      if (!info.node.isLeaf) {
        // Chọn chuyên ngành, không thay đổi tên chuyên môn
        const professionId = selectedKey;
        const professionName = info.node.title; // Lấy tên chuyên ngành
        onSelect(professionId, null, professionName, null); // Không thay đổi tên chuyên môn
      } else {
        // Chọn chuyên môn (leaf node)
        const [professionId, specialtyId] = selectedKey.split("-");
        const professionNode = treeData.find(
          (item) => item.key === professionId
        );
        const professionName = professionNode ? professionNode.title : "";
        const specialtyName = info.node.title; // Cập nhật tên chuyên môn mới
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
          data-tour="first-profession"
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
          data-tour="first-specialty"
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
          selectedKeys={selectedKeys} // Pass selectedKeys to Tree component
          expandAction="click"
          treeData={treeData}
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
  selectedProfession: PropTypes.string,
  selectedSpecialty: PropTypes.string,
};

export default TreeView;
