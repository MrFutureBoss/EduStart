// MentorSelectionOverview.js
import React, { useEffect, useState } from "react";
import { Typography, Spin, Alert, Button } from "antd";
import { fetchTeacherSelection } from "../../../api";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import {
  setMentorsBySpecialty,
  setProfession,
  setSpecialty,
  setStepCheck,
} from "../../../redux/slice/SelectMentorSlice";
import MentorCard from "./MentorCard";
import "../teacherCSS/MentorSelectionOverview.css";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const MentorSelectionOverview = ({
  professionId,
  specialtyId,
  professionName,
  specialtyName,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mentorsBySpecialty = useSelector(
    (state) => state.selectMentor.mentorsBySpecialty
  );

  const teacherId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMentorSelection = async () => {
      if (professionId && specialtyId && !mentorsBySpecialty[specialtyId]) {
        setLoading(true);
        try {
          const response = await fetchTeacherSelection(
            teacherId,
            professionId,
            specialtyId
          );
          dispatch(
            setMentorsBySpecialty({ specialtyId, mentors: response.data })
          );
        } catch (error) {
          console.error("Error fetching mentor selection:", error);
        }
        setLoading(false);
      }
    };
    loadMentorSelection();
  }, [professionId, specialtyId, dispatch, mentorsBySpecialty, teacherId]);

  const mentors = mentorsBySpecialty[specialtyId] || [];
  const handleSelectMentor = () => {
    // Cập nhật Redux nếu cần
    if (professionId && specialtyId) {
      setProfession({
        professionId: professionId,
        professionName: professionName,
      });
      dispatch(
        setSpecialty({
          specialtyId: specialtyId,
          specialtyName: specialtyName,
        })
      );
      dispatch(setStepCheck(2));
    }

    // Điều hướng đến MainStep
    navigate("/teacher/choose-mentor");
  };

  return (
    <div className="mentor-overview-container">
      <div className="overview-header">
        <Title level={4}>
          <span>Lĩnh vực:</span>
          <strong className="profession-name">
            {professionName || "Chưa chọn"}
          </strong>
          <span>Chuyên môn:</span>
          <strong className="specialty-name">
            {specialtyName || "Chưa chọn"}
          </strong>
        </Title>
      </div>
      {loading ? (
        <div className="spinner-container">
          <Spin />
        </div>
      ) : (
        <div className="mentor-list">
          {mentors.length === 0 ? (
            <div className="mentor-placeholder">
              <Alert
                style={{ margin: 37 }}
                message="Không có mentor nào được chọn cho chuyên môn này."
                description={
                  <Button
                    style={{ backgroundColor: "#4682b4", color: "#FFFF" }}
                    onClick={handleSelectMentor}
                  >
                    Chọn Mentor Ngay
                  </Button>
                }
                type="warning"
                showIcon
              />
            </div>
          ) : (
            mentors.map((mentor) => (
              <div className="mentor-card-wrapper" key={mentor._id}>
                <MentorCard
                  mentor={mentor}
                  isSelected={false}
                  index={undefined}
                  showMenu={false}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

MentorSelectionOverview.propTypes = {
  professionId: PropTypes.string,
  specialtyId: PropTypes.string,
  professionName: PropTypes.string,
  specialtyName: PropTypes.string,
  onSelectMentor: PropTypes.func.isRequired,
};

export default MentorSelectionOverview;
