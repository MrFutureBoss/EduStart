import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTreeData } from "../../../api";
import {
  setProfessions,
  setProfession,
  setStepCheck,
} from "../../../redux/slice/SelectMentorSlice";
import { List, Button, Typography, Spin } from "antd";
import CustomButton from "../../../components/Button/Button";

const Step1SelectProfession = ({ onNext }) => {
  const dispatch = useDispatch();
  const professions = useSelector(
    (state) => state.selectMentor.professions.data
  );
  const [loading, setLoading] = useState(false);
  const teacherId = localStorage.getItem("userId");

  useEffect(() => {
    if (professions.length === 0) {
      const loadProfessions = async () => {
        setLoading(true);
        try {
          const response = await fetchTreeData(teacherId);
          dispatch(setProfessions(response.data.treeData));
        } catch (error) {
          console.error("Error loading professions:", error);
        }
        setLoading(false);
      };

      loadProfessions();
    }
  }, [dispatch, professions]);

  const handleSelectProfession = (profession) => {
    dispatch(
      setProfession({
        professionId: profession.professionId,
        professionName: profession.professionName,
      })
    );
    dispatch(setStepCheck(1));
    onNext();
  };

  const updatedSpecialtyCounts = professions.map((profession) => {
    const updatedSpecialtyCount = profession.children.filter(
      (specialty) => specialty.isUpdated
    ).length;

    return {
      professionId: profession.professionId,
      updatedSpecialtyCount,
      totalSpecialties: profession.children.length,
    };
  });

  return (
    <div>
      {loading ? (
        <Spin />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={professions}
          renderItem={(profession) => {
            const professionCountInfo = updatedSpecialtyCounts.find(
              (countInfo) => countInfo.professionId === profession.professionId
            );

            const descriptionColor =
              professionCountInfo.updatedSpecialtyCount === 0
                ? "gray"
                : professionCountInfo.updatedSpecialtyCount ===
                  professionCountInfo.totalSpecialties
                ? "green"
                : "orange";

            // Kiểm tra nếu totalSpecialties = 0, hiển thị thông báo khác
            const description =
              professionCountInfo.totalSpecialties === 0
                ? "Chưa có Mentor nào chọn lĩnh vực này"
                : `(${professionCountInfo.updatedSpecialtyCount}/${professionCountInfo.totalSpecialties}) chuyên môn đã chọn`;

            return (
              <List.Item>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Typography.Title level={5}>
                      {profession.title}
                    </Typography.Title>
                    <Typography.Text style={{ color: descriptionColor }}>
                      {description}
                    </Typography.Text>
                  </div>
                  <CustomButton
                    type="primary"
                    onClick={() => handleSelectProfession(profession)}
                    content={"Chọn Mentor trong lĩnh vực này"}
                  />
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};

export default Step1SelectProfession;
