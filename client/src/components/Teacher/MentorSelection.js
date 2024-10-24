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
} from "../../api"; // Thêm fetchTeacherSelection
import PropTypes from "prop-types";
import MentorCard from "./MentorCard";
import "./teacherCSS/MentorSelection.css"; // Thêm file CSS riêng
import MentorSelectionTour from "./MentorGuidedTour";

const { Title } = Typography;
const { Search } = Input;

// Component SortableItem để sử dụng với @dnd-kit
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
      mentorPriorityRef,
      mentorAvailableRef,
      saveButtonRef,
    },
    ref
  ) => {
    const [availableMentors, setAvailableMentors] = useState([]);
    const [filteredMentors, setFilteredMentors] = useState([]); // Mentor đã được lọc bởi tìm kiếm
    const [selectedMentors, setSelectedMentors] = useState([]); // Danh sách mentor đã chọn
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // Phân trang - trang hiện tại
    const [activeId, setActiveId] = useState(null); // ID của item đang kéo
    const [isOverSelected, setIsOverSelected] = useState(false); // Trạng thái kéo lên selectedMentors
    const mentorsPerPage = 10; // Số mentor mỗi trang
    const previousSpecialtyIdRef = useRef(null);
    const [currentProfessionId, setCurrentProfessionId] = useState(null);
    const [currentSpecialtyId, setCurrentSpecialtyId] = useState(null);

    // Tạo ref nội bộ nếu cần
    const localMentorPriorityRef = useRef(null);
    const localMentorAvailableRef = useRef(null);
    const localSaveButtonRef = useRef(null);

    // Gán ref từ props hoặc sử dụng ref nội bộ
    const mentorPriorityContainerRef =
      mentorPriorityRef || localMentorPriorityRef;
    const mentorAvailableContainerRef =
      mentorAvailableRef || localMentorAvailableRef;
    const saveButtonContainerRef = saveButtonRef || localSaveButtonRef;

    // Thiết lập sensors cho @dnd-kit
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      })
    );

    // Gọi API để lấy mentor đã chọn
    useEffect(() => {
      const getMentorsData = async () => {
        setLoading(true);
        try {
          const teacherId = localStorage.getItem("userId");
          console.log("professionId", professionId);
          console.log("specialtyId", specialtyId);

          // Lưu professionId và specialtyId hiện tại
          setCurrentProfessionId(professionId);
          setCurrentSpecialtyId(specialtyId);
          // Lấy danh sách mentor đã chọn
          const mentors = await fetchTeacherSelection(
            teacherId,
            professionId,
            specialtyId
          );

          let sortedMentors = [];
          if (mentors.data && mentors.data.length > 0) {
            // Sắp xếp danh sách mentor theo thứ tự ưu tiên
            sortedMentors = mentors.data.sort(
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

          // Lấy danh sách mentor khả dụng
          const response = await fetchMentors(professionId, specialtyId);

          // Lọc ra các mentor đã được chọn
          const selectedMentorIds = sortedMentors.map((m) => m._id);

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

      if (specialtyId && previousSpecialtyIdRef.current !== specialtyId) {
        getMentorsData();
        previousSpecialtyIdRef.current = specialtyId;
      }
    }, [specialtyId, professionId, setSelectedMentorsBySpecialty]);

    // Hàm để lưu danh sách mentor đã chọn
    const handleSaveSelection = async () => {
      const dataToSave = {
        teacherId: localStorage.getItem("userId"), // Lấy teacherId từ localStorage
        professionId: currentProfessionId,
        specialtyId: currentSpecialtyId,
        selectedMentors: selectedMentors.map((mentor, index) => ({
          mentorId: mentor?.mentorId?._id,
          priority: index + 1, // Thứ tự ưu tiên
        })),
      };
      console.log("dataToSave", dataToSave);

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
      const { active, over } = event;

      if (over) {
        const overContainer = over.data.current?.containerId;
        if (overContainer === "selectedMentors") {
          setIsOverSelected(true);
        } else {
          setIsOverSelected(false);
        }
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

      // Xác định danh sách nguồn và đích dựa trên containerId
      const activeContainer = active.data.current?.containerId;
      const overContainer = over.data.current?.containerId;

      if (!activeContainer || !overContainer) {
        setActiveId(null);
        setIsOverSelected(false);
        return;
      }

      // Di chuyển trong cùng một danh sách
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
          // Không cần cập nhật selectedMentors trong trường hợp này
        }
      } else {
        // Di chuyển giữa hai danh sách
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
            setFilteredMentors(newAvailable); // Cập nhật lại danh sách đã lọc
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
      setCurrentPage(1); // Reset lại về trang 1 sau khi tìm kiếm
    };

    const handleSelectMentor = (mentor) => {
      const newAvailable = availableMentors.filter((m) => m._id !== mentor._id);
      const newSelected = [...selectedMentors, mentor];

      setAvailableMentors(newAvailable);
      setFilteredMentors(newAvailable); // Cập nhật danh sách sau khi chọn mentor
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
      setFilteredMentors(newAvailable); // Cập nhật danh sách sau khi bỏ chọn mentor
      setSelectedMentors(newSelected);

      setSelectedMentorsBySpecialty((prev) => ({
        ...prev,
        [specialtyId]: newSelected,
      }));
    };

    // Phân trang - Lấy mentor cho trang hiện tại
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
                  ref={mentorPriorityContainerRef}
                  data-tour="mentor-priority"
                >
                  {/* Placeholder để nhận drop */}
                  <SortableItem
                    id="placeholder-selected"
                    containerId="selectedMentors"
                  >
                    {/* Có thể để trống hoặc thêm một biểu tượng nào đó */}
                  </SortableItem>
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
                            onDeselect={handleDeselectMentor} // Hàm bỏ chọn
                            isSelected={true} // Mentor đã được chọn
                          />
                        </div>
                      </SortableItem>
                    ))
                  )}
                </div>
              </SortableContext>
              <Button
                style={{ float: "right", marginTop: 10 }}
                type="primary"
                onClick={handleSaveSelection}
                ref={saveButtonContainerRef}
                data-tour="save-button"
              >
                Lưu lựa chọn
              </Button>
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
                  ref={mentorAvailableContainerRef}
                  data-tour="mentor-available"
                >
                  {currentMentors.length === 0 ? (
                    <SortableItem
                      id="placeholder-available"
                      containerId="availableMentors"
                    >
                      <div className="empty-available">
                        Không có mentor nào trong danh sách
                      </div>
                    </SortableItem>
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
              {/* Phân trang */}
              <Pagination
                current={currentPage}
                total={filteredMentors.length}
                pageSize={mentorsPerPage}
                onChange={handlePageChange}
                style={{ marginTop: 20, textAlign: "center" }}
              />
            </Col>
          </Row>
          {/* Drag Overlay để hiển thị item đang kéo */}
          <DragOverlay>
            {activeId ? (
              <div className="mentor-priority-item">
                <MentorCard
                  mentor={
                    selectedMentors.find((m) => m._id === activeId) ||
                    availableMentors.find((m) => m._id === activeId)
                  }
                  isSelected={
                    selectedMentors.find((m) => m._id === activeId)
                      ? true
                      : false
                  }
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
  mentorPriorityRef: PropTypes.object,
  mentorAvailableRef: PropTypes.object,
  saveButtonRef: PropTypes.object,
};

export default MentorSelection;
