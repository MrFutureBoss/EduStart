import React, { useState, useRef, useEffect } from "react";
import { Layout, Typography, Button } from "antd";
import TreeView from "../../components/Teacher/TreeView";
import MentorSelection from "../../components/Teacher/MentorSelection";
import GuidedTour from "../../components/Teacher/GuidedTour";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const ChooseMentor = () => {
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedMentorsBySpecialty, setSelectedMentorsBySpecialty] = useState(
    {}
  );
  const [collapsed, setCollapsed] = useState(false);
  const [professionName, setProfessionName] = useState(""); // Tên chuyên ngành
  const [specialtyName, setSpecialtyName] = useState(""); // Tên chuyên môn

  // References for GuidedTour
  const firstProfessionRef = useRef(null);
  const firstSpecialtyRef = useRef(null);
  const mentorPriorityRef = useRef(null);
  const mentorAvailableRef = useRef(null);
  const saveButtonRef = useRef(null);

  // Check if guided tour is completed
  const guidedTourCompleted = !!localStorage.getItem("guidedTourCompleted");

  // Khi chọn profession hoặc specialty
  const handleSelect = (
    professionId,
    specialtyId,
    professionName,
    specialtyName
  ) => {
    setSelectedProfession(professionId);
    // Chỉ thay đổi tên profession, không làm mất tên specialty
    setProfessionName(professionName);

    // Nếu chọn mới chuyên môn thì cập nhật, nếu không thì giữ nguyên
    if (specialtyId) {
      setSelectedSpecialty(specialtyId);
      setSpecialtyName(specialtyName); // Cập nhật tên chuyên môn
    }
  };

  // Nếu dữ liệu mentor thay đổi thì reset specialtyName
  useEffect(() => {
    if (
      selectedMentorsBySpecialty[selectedSpecialty] &&
      selectedMentorsBySpecialty[selectedSpecialty].length > 0
    ) {
      setSpecialtyName(""); // Reset lại nếu có mentor mới được chọn
    }
  }, [selectedMentorsBySpecialty, selectedSpecialty]);

  const handleRestartTour = () => {
    localStorage.removeItem("guidedTourCompleted");
    window.location.reload(); // Reload to restart the tour
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!guidedTourCompleted && (
        <GuidedTour
          selectedProfession={selectedProfession}
          selectedSpecialty={selectedSpecialty}
          selectedMentors={selectedMentorsBySpecialty[selectedSpecialty] || []}
          onComplete={() => {
            if (firstProfessionRef.current) {
              firstProfessionRef.current.click(); // Simulate a click on the first profession
            }
            if (firstSpecialtyRef.current) {
              firstSpecialtyRef.current.click(); // Simulate a click on the first specialty
            }
          }}
        />
      )}

      <Sider width={250} style={{ background: "#fff", padding: "0px" }}>
        <div>
          <Title level={4}>Chọn Chuyên Ngành</Title>
        </div>
        <TreeView
          onSelect={handleSelect}
          onFirstProfessionRefReady={(node) => {
            firstProfessionRef.current = node;
            if (node) {
              node.setAttribute("data-tour", "first-profession");
            }
          }}
          onFirstSpecialtyRefReady={(node) => {
            firstSpecialtyRef.current = node;
            if (node) {
              node.setAttribute("data-tour", "first-specialty");
            }
          }}
          selectedProfession={selectedProfession}
          selectedSpecialty={selectedSpecialty}
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
          <Button
            type="primary"
            onClick={handleRestartTour}
            style={{ marginBottom: "20px" }}
          >
            Bắt đầu lại hướng dẫn
          </Button>

          <MentorSelection
            professionId={selectedProfession}
            specialtyId={selectedSpecialty}
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
