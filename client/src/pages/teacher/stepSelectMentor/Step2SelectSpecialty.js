import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSpecialty } from "../../../redux/slice/SelectMentorSlice";
import { List, Button, Typography } from "antd";
import CustomButton from "../../../components/Button/Button";

const { Title } = Typography;

const Step2SelectSpecialty = ({ onNext }) => {
  const dispatch = useDispatch();
  const selectedProfessionId = useSelector(
    (state) => state.selectMentor.selectedProfessionId
  );
  const selectedProfession = useSelector((state) =>
    state.selectMentor.professions.data.find(
      (profession) => profession.professionId === selectedProfessionId
    )
  );
  const professionName = useSelector(
    (state) => state.selectMentor.professionName
  );
  const handleSelectSpecialty = (specialty) => {
    dispatch(
      setSpecialty({
        specialtyId: specialty.specialtyId,
        specialtyName: specialty.title,
      })
    );
    onNext();
  };

  return (
    <div>
      <Title level={4}>
        Lĩnh vực đang chọn:
        <strong style={{ marginLeft: 5, color: "#4682B4" }}>
          {professionName}
        </strong>
      </Title>
      {selectedProfession && (
        <List
          itemLayout="horizontal"
          dataSource={selectedProfession.children}
          renderItem={(specialty) => (
            <List.Item
              actions={[
                <CustomButton
                  type="primary"
                  onClick={() => handleSelectSpecialty(specialty)}
                  content={"Chọn Mentor trong chuyên môn này"}
                />,
              ]}
            >
              <List.Item.Meta
                title={specialty.title}
                description={
                  <span
                    style={{
                      color: specialty.isUpdated ? "green" : "orange",
                    }}
                  >
                    {specialty.isUpdated ? "Đã chọn" : "Chưa chọn"}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default Step2SelectSpecialty;
