// ChooseMentor.js
import React, { useState } from "react";
import { Layout, Row, Col, Statistic, Card, Empty } from "antd";
import { useSelector, useDispatch } from "react-redux";
import TreeView from "./TreeView";
import {
  setProfession,
  setSpecialty,
  setStepCheck,
} from "../../../redux/slice/SelectMentorSlice";
import MentorSelectionOverview from "./MentorSelectionOverview";

const { Sider, Content } = Layout;

const ChooseMentor = () => {
  const dispatch = useDispatch();
  const {
    selectedProfessionId,
    selectedSpecialtyId,
    professionCount,
    specialtyCount,
    updatedCount,
    notUpdatedCount,
    stepCheck,
  } = useSelector((state) => state.selectMentor);
  const [professionName, setProfessionName] = useState("");
  const [specialtyName, setSpecialtyName] = useState("");
  const handleSelect = (
    professionId,
    specialtyId,
    professionName,
    specialtyName
  ) => {
    if (specialtyId) {
      dispatch(setProfession({ professionId, professionName }));
      dispatch(setSpecialty({ specialtyId, specialtyName }));
      dispatch(setStepCheck(1));
      setProfessionName(professionName);
      setSpecialtyName(specialtyName);
    }
  };

  console.log("stepCheck", stepCheck);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <div style={{ backgroundColor: "#FFFF" }}>
        <Row style={{ marginBottom: 20 }} gutter={16} justify="center">
          <Col span={6}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Statistic title="Tổng số lĩnh vực" value={professionCount} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Statistic title="Tổng số chuyên môn" value={specialtyCount} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Statistic title="Chuyên môn đã chọn" value={updatedCount} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" }}>
              <Statistic title="Chuyên môn chưa chọn" value={notUpdatedCount} />
            </Card>
          </Col>
        </Row>
      </div>

      <Layout>
        <Sider
          width={300}
          style={{
            background: "#fff",
            padding: "20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <TreeView
            onSelect={handleSelect}
            selectedProfession={selectedProfessionId}
            selectedSpecialty={selectedSpecialtyId}
          />
        </Sider>

        <Layout>
          <Content
            style={{
              padding: "29px",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {professionName ? (
              <MentorSelectionOverview
                professionId={selectedProfessionId}
                specialtyId={selectedSpecialtyId}
                professionName={professionName}
                specialtyName={specialtyName}
              />
            ) : (
              <Empty
                description={<span>Vui lòng chọn chuyên môn để hiển thị!</span>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              ></Empty>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default ChooseMentor;
