import React, { useState, useEffect, forwardRef, useRef } from "react";
import {
  Row,
  Col,
  Spin,
  Alert,
  Typography,
  Divider,
  Input,
  Pagination,
  Button,
  message,
} from "antd";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  fetchMentors,
  saveMentorSelection,
  fetchTeacherSelection,
} from "../../api";
import PropTypes from "prop-types";
import MentorCard from "./MentorCard";
import "./teacherCSS/MentorSelection.css";

const { Title } = Typography;
const { Search } = Input;

const SortableItem = ({ id, children, containerId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { containerId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={id === "placeholder-selected" ? "sortable-placeholder" : ""}
    >
      {children}
    </div>
  );
};

SortableItem.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  containerId: PropTypes.string.isRequired,
};

const MentorSelection = forwardRef(
  (
    {
      professionId,
      specialtyId,
      selectedMentorsBySpecialty,
      setSelectedMentorsBySpecialty,
      availableMentorsRef,
      selectedMentorsRef,
    },
    ref
  ) => {
    const [availableMentors, setAvailableMentors] = useState([]);
    const [filteredMentors, setFilteredMentors] = useState([]);
    const [selectedMentors, setSelectedMentors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeId, setActiveId] = useState(null);
    const [isOverSelected, setIsOverSelected] = useState(false);
    const mentorsPerPage = 10;

    // Separate refs for each useEffect
    const previousSpecialtyIdRefForSelection = useRef(null);
    const previousSpecialtyIdRefForMentors = useRef(null);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      })
    );

    // Fetch teacher's selected mentors
    useEffect(() => {
      const getTeacherSelection = async () => {
        setLoading(true);
        try {
          const teacherId = localStorage.getItem("userId");
          const response = await fetchTeacherSelection(
            teacherId,
            professionId,
            specialtyId
          );

          if (response.data && response.data.length > 0) {
            const savedSelection = response.data[0];
            const selectedMentorsData = savedSelection.selectedMentors.map(
              (mentorData) => ({
                ...mentorData.mentorId,
                priority: mentorData.priority,
              })
            );

            const sortedMentors = selectedMentorsData.sort(
              (a, b) => a.priority - b.priority
            );

            setSelectedMentors(sortedMentors);
            setSelectedMentorsBySpecialty((prev) => ({
              ...prev,
              [specialtyId]: sortedMentors,
            }));
          } else {
            setSelectedMentors([]);
            setSelectedMentorsBySpecialty((prev) => ({
              ...prev,
              [specialtyId]: [],
            }));
          }
        } catch (err) {
          console.error("Error fetching selected mentors:", err);
          setError("Không thể lấy danh sách mentor đã chọn.");
        }
        setLoading(false);
      };

      if (
        specialtyId &&
        previousSpecialtyIdRefForSelection.current !== specialtyId
      ) {
        getTeacherSelection();
        previousSpecialtyIdRefForSelection.current = specialtyId;
      }
    }, [specialtyId, professionId, setSelectedMentorsBySpecialty]);

    // Fetch available mentors
    useEffect(() => {
      if (
        specialtyId &&
        previousSpecialtyIdRefForMentors.current !== specialtyId
      ) {
        const getMentors = async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await fetchMentors(professionId, specialtyId);
            const selectedMentorIds = (
              selectedMentorsBySpecialty[specialtyId] || []
            ).map((m) => m._id);
            const filtered = response.data.filter(
              (mentor) => !selectedMentorIds.includes(mentor._id)
            );
            setAvailableMentors(filtered);
            setFilteredMentors(filtered);
          } catch (err) {
            console.error("Error fetching mentors:", err);
            setError("Không thể lấy danh sách mentor.");
          }
          setLoading(false);
        };

        getMentors();
        previousSpecialtyIdRefForMentors.current = specialtyId;
      }
    }, [specialtyId, professionId, selectedMentorsBySpecialty]);

    // Update selectedMentors when selectedMentorsBySpecialty changes
    useEffect(() => {
      setSelectedMentors(selectedMentorsBySpecialty[specialtyId] || []);
    }, [selectedMentorsBySpecialty, specialtyId]);

    const handleSaveSelection = async () => {
      const dataToSave = {
        teacherId: localStorage.getItem("userId"),
        professionId,
        specialtyId,
        selectedMentors: selectedMentors.map((mentor, index) => ({
          mentorId: mentor?._id,
          priority: index + 1,
        })),
      };

      try {
        await saveMentorSelection(dataToSave);
        message.success("Lưu lựa chọn thành công!");
      } catch (error) {
        message.error("Lưu lựa chọn thất bại.");
        console.error("Lỗi khi lưu lựa chọn:", error);
      }
    };

    const handleDragStart = (event) => {
      const { active } = event;
      setActiveId(active.id);
    };

    const handleDragMove = (event) => {
      const { over } = event;

      if (over) {
        const overContainer = over.data.current?.containerId;
        setIsOverSelected(overContainer === "selectedMentors");
      } else {
        setIsOverSelected(false);
      }
    };

    const handleDragEnd = (event) => {
      const { active, over } = event;

      if (!over) {
        setActiveId(null);
        setIsOverSelected(false);
        return;
      }

      const activeId = active.id;
      const overId = over.id;

      const activeContainer = active.data.current?.containerId;
      const overContainer = over.data.current?.containerId;

      if (!activeContainer || !overContainer) {
        setActiveId(null);
        setIsOverSelected(false);
        return;
      }

      if (activeContainer === overContainer) {
        if (activeContainer === "selectedMentors") {
          const oldIndex = selectedMentors.findIndex(
            (mentor) => mentor._id === activeId
          );
          const newIndex = selectedMentors.findIndex(
            (mentor) => mentor._id === overId
          );
          const newSelectedMentors = arrayMove(
            selectedMentors,
            oldIndex,
            newIndex
          );
          setSelectedMentors(newSelectedMentors);
          setSelectedMentorsBySpecialty((prev) => ({
            ...prev,
            [specialtyId]: newSelectedMentors,
          }));
        } else if (activeContainer === "availableMentors") {
          const oldIndex = filteredMentors.findIndex(
            (mentor) => mentor._id === activeId
          );
          const newIndex = filteredMentors.findIndex(
            (mentor) => mentor._id === overId
          );
          const newFilteredMentors = arrayMove(
            filteredMentors,
            oldIndex,
            newIndex
          );
          setFilteredMentors(newFilteredMentors);
        }
      } else {
        if (
          activeContainer === "availableMentors" &&
          overContainer === "selectedMentors"
        ) {
          const mentor = availableMentors.find((m) => m._id === activeId);
          if (mentor) {
            const newAvailable = availableMentors.filter(
              (m) => m._id !== activeId
            );
            const newSelected = [...selectedMentors, mentor];
            setAvailableMentors(newAvailable);
            setFilteredMentors(newAvailable);
            setSelectedMentors(newSelected);
            setSelectedMentorsBySpecialty((prev) => ({
              ...prev,
              [specialtyId]: newSelected,
            }));
          }
        } else if (
          activeContainer === "selectedMentors" &&
          overContainer === "availableMentors"
        ) {
          const mentor = selectedMentors.find((m) => m._id === activeId);
          if (mentor) {
            const newSelected = selectedMentors.filter(
              (m) => m._id !== activeId
            );
            const newAvailable = [...availableMentors, mentor];
            setSelectedMentors(newSelected);
            setAvailableMentors(newAvailable);
            setFilteredMentors(newAvailable);
            setSelectedMentorsBySpecialty((prev) => ({
              ...prev,
              [specialtyId]: newSelected,
            }));
          }
        }
      }

      setActiveId(null);
      setIsOverSelected(false);
    };

    const handleSearch = (value) => {
      const filtered = availableMentors.filter((mentor) =>
        mentor.mentorId.email.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMentors(filtered);
      setCurrentPage(1);
    };

    const handleSelectMentor = (mentor) => {
      const newAvailable = availableMentors.filter((m) => m._id !== mentor._id);
      const newSelected = [...selectedMentors, mentor];

      setAvailableMentors(newAvailable);
      setFilteredMentors(newAvailable);
      setSelectedMentors(newSelected);

      setSelectedMentorsBySpecialty((prev) => ({
        ...prev,
        [specialtyId]: newSelected,
      }));
    };

    const handleDeselectMentor = (mentor) => {
      const newSelected = selectedMentors.filter((m) => m._id !== mentor._id);
      const newAvailable = [...availableMentors, mentor];

      setAvailableMentors(newAvailable);
      setFilteredMentors(newAvailable);
      setSelectedMentors(newSelected);

      setSelectedMentorsBySpecialty((prev) => ({
        ...prev,
        [specialtyId]: newSelected,
      }));
    };

    const indexOfLastMentor = currentPage * mentorsPerPage;
    const indexOfFirstMentor = indexOfLastMentor - mentorsPerPage;
    const currentMentors = filteredMentors.slice(
      indexOfFirstMentor,
      indexOfLastMentor
    );

    const handlePageChange = (page) => {
      setCurrentPage(page);
    };

    if (loading) return <Spin />;

    if (error) return <Alert message={error} type="error" />;

    return (
      <div ref={ref}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={4}>Mentor Đã Chọn (Thứ tự ưu tiên)</Title>
              <SortableContext
                items={selectedMentors.map((mentor) => mentor._id)}
                strategy={horizontalListSortingStrategy}
              >
                <div
                  className={`mentor-priority-container ${
                    isOverSelected ? "over-selected" : ""
                  }`}
                  ref={selectedMentorsRef}
                >
                  {selectedMentors.length === 0 ? (
                    <div className="empty-selected">
                      Chưa có mentor nào được chọn
                    </div>
                  ) : (
                    selectedMentors.map((mentor, index) => (
                      <SortableItem
                        key={mentor._id}
                        id={mentor._id}
                        containerId="selectedMentors"
                      >
                        <div
                          className={`mentor-priority-item priority-level-${
                            index + 1
                          }`}
                        >
                          <div className="priority-label">
                            Ưu tiên {index + 1}
                          </div>
                          <MentorCard
                            mentor={mentor}
                            onDeselect={handleDeselectMentor}
                            isSelected={true}
                          />
                        </div>
                      </SortableItem>
                    ))
                  )}
                </div>
              </SortableContext>
            </Col>

            <Divider />

            <Col span={24}>
              <Title level={4}>Danh Sách Mentor</Title>
              <Search
                placeholder="Tìm kiếm theo email"
                onSearch={handleSearch}
                enterButton
                style={{ marginBottom: 20 }}
              />
              <SortableContext
                items={currentMentors.map((mentor) => mentor._id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className={`mentor-available-container ${
                    isOverSelected ? "over-available" : ""
                  }`}
                  ref={availableMentorsRef}
                >
                  {currentMentors.length === 0 ? (
                    <div className="empty-available">
                      Không có mentor nào trong danh sách
                    </div>
                  ) : (
                    currentMentors.map((mentor) => (
                      <SortableItem
                        key={mentor._id}
                        id={mentor._id}
                        containerId="availableMentors"
                      >
                        <div className="mentor-available-item">
                          <MentorCard
                            mentor={mentor}
                            onSelect={handleSelectMentor}
                            isSelected={false}
                          />
                        </div>
                      </SortableItem>
                    ))
                  )}
                </div>
              </SortableContext>
              <Pagination
                current={currentPage}
                total={filteredMentors.length}
                pageSize={mentorsPerPage}
                onChange={handlePageChange}
                style={{ marginTop: 20, textAlign: "center" }}
              />
            </Col>
            <Col span={24} style={{ textAlign: "right", marginTop: "20px" }}>
              <Button type="primary" onClick={handleSaveSelection}>
                Lưu lựa chọn
              </Button>
            </Col>
          </Row>
          <DragOverlay>
            {activeId ? (
              <div className="mentor-priority-item">
                <MentorCard
                  mentor={
                    selectedMentors.find((m) => m._id === activeId) ||
                    availableMentors.find((m) => m._id === activeId)
                  }
                  isSelected={!!selectedMentors.find((m) => m._id === activeId)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
  }
);

MentorSelection.propTypes = {
  professionId: PropTypes.string.isRequired,
  specialtyId: PropTypes.string.isRequired,
  selectedMentorsBySpecialty: PropTypes.object.isRequired,
  setSelectedMentorsBySpecialty: PropTypes.func.isRequired,
  availableMentorsRef: PropTypes.object,
  selectedMentorsRef: PropTypes.object,
};

export default MentorSelection;
