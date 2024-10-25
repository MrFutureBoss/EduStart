import React, { useState, useRef } from "react";
import { Layout, Typography } from "antd";
import { useSelector, useDispatch } from "react-redux";
import TreeView from "../../components/Teacher/TreeView";
import MentorSelection from "../../components/Teacher/MentorSelection";
import {
  setProfession,
  setSpecialty,
} from "../../redux/slice/SelectMentorSlice"; // Sử dụng đúng slice từ Redux

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const ChooseMentor = () => {
  const dispatch = useDispatch();

  const {
    selectedProfessionId,
    selectedSpecialtyId,
    professionName,
    specialtyName,
  } = useSelector((state) => state.selectMentor); // Lấy dữ liệu từ Redux

  const [selectedMentorsBySpecialty, setSelectedMentorsBySpecialty] = useState(
    {}
  );
  const [collapsed, setCollapsed] = useState(false);

  // References for TreeView
  const firstProfessionRef = useRef(null);
  const firstSpecialtyRef = useRef(null);
  const mentorPriorityRef = useRef(null);
  const mentorAvailableRef = useRef(null);
  const saveButtonRef = useRef(null);

  // Khi chọn profession hoặc specialty
  const handleSelect = (
    professionId,
    specialtyId,
    professionName,
    specialtyName
  ) => {
    if (professionId) {
      dispatch(setProfession({ professionId, professionName })); // Cập nhật profession vào Redux
    }

    if (specialtyId) {
      dispatch(setSpecialty({ specialtyId, specialtyName })); // Cập nhật specialty vào Redux
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={250} style={{ background: "#fff", padding: "0px" }}>
        <div>
          <Title level={4}>Chọn Chuyên Ngành</Title>
        </div>
        <TreeView
          onSelect={handleSelect}
          onFirstProfessionRefReady={(node) => {
            firstProfessionRef.current = node;
          }}
          onFirstSpecialtyRefReady={(node) => {
            firstSpecialtyRef.current = node;
          }}
          selectedProfession={selectedProfessionId}
          selectedSpecialty={selectedSpecialtyId}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 20px",
            marginBottom: -23,
            paddingBottom: 2,
          }}
        >
          <Title level={3}>
            {professionName
              ? `${professionName} - ${specialtyName || "Chọn chuyên môn"}`
              : "Chọn Mentor"}
          </Title>
        </Header>
        <Content style={{ background: "#fff", padding: "20px" }}>
          <MentorSelection
            professionId={selectedProfessionId}
            specialtyId={selectedSpecialtyId}
            selectedMentorsBySpecialty={selectedMentorsBySpecialty}
            setSelectedMentorsBySpecialty={setSelectedMentorsBySpecialty}
            mentorPriorityRef={mentorPriorityRef}
            mentorAvailableRef={mentorAvailableRef}
            saveButtonRef={saveButtonRef}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChooseMentor;
